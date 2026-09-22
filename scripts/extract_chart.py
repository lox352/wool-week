#!/usr/bin/env python3
"""Turn a Shetland Wool Week pattern's chart page into chart JSON.

This is an authoring tool, run by hand once per pattern. Its output is
reviewed and committed; the PDFs themselves never enter the repository and
the site never reads one.

How it reads a page:

  Cells are vector rectangles, so the fills come from the page's own drawing
  operators rather than from a picture of it. Cells can overlap - SWW25 draws
  10.6pt cells on a 9.6pt pitch - so columns are found by clustering
  coordinates, not by dividing by the cell width.

  The fills say nothing about the marks drawn on top of them, so the page is
  also rasterised and each cell's interior compared against its own fill
  colour: pixels that differ are ink. The key's swatches are cells too, drawn
  at the same size with the same marks, so they are used as templates and the
  classifier calibrates itself off the page it is reading.

  The key also names itself. "Yarn A" beside a swatch is what ties a fill to a
  yarn slot, and "s2kp" beside another is what names a symbol, so nothing
  about a particular pattern's palette is assumed here.

A chart row is stored as the stitches *worked* in that round, right to left as
knitted. Its length is therefore the stitch count after the round, and the
count before it is the sum of what each cell consumes. That is what makes a
crown chart's staircase readable: the blanks are gutters in the drawing, not
stitches, and are dropped.

    python3 scripts/extract_chart.py pattern.pdf --page 6 --vector 0 \
        --charts A:4x9 B:8x11 D:8x12 --out src/data/hats/sww24.charts.json
"""
from __future__ import annotations

import argparse
import collections
import json
import os
import re
import subprocess
import sys
import tempfile
import zlib

PAGE_HEIGHT_PT = 595.276
# Fine enough that a chart cell is tens of pixels across even on a leaflet
# printed at A5, where a cell is about seven and a half points.
RENDER_DPI = 600

# ---------------------------------------------------------------- pdf streams


def streams(path):
    data = open(path, "rb").read()
    for match in re.finditer(rb"stream\r?\n", data):
        start = match.end()
        end = data.find(b"endstream", start)
        if end < 0:
            continue
        try:
            yield zlib.decompress(data[start:end])
        except zlib.error:
            continue


NUMBER = re.compile(r"-?\d*\.?\d+")


def from_cmyk(values):
    cyan, magenta, yellow, black = values
    return tuple(
        round(max(0.0, min(1.0, (1 - channel) * (1 - black))), 2)
        for channel in (cyan, magenta, yellow)
    )


def cell_span(stream):
    """How big this page's chart cells are, from the page itself.

    A chart is hundreds of squares all the same size, and almost nothing else
    on a page is, so the commonest square size is the cell. Rounded to a tenth
    of a point before counting, because a drawing program will not repeat
    itself to the last decimal.
    """
    sizes = collections.Counter()
    for _x, _y, width, _fill in cells_in(stream, span=(3.0, 30.0)):
        sizes[round(width, 1)] += 1
    if not sizes:
        return None
    cell, seen = sizes.most_common(1)[0]
    if seen < 40:
        return None
    # Enough either side to catch the same cell drawn a hair larger or smaller.
    return (cell * 0.85, cell * 1.15)


def cells_in(stream, span=None):
    """Filled square-ish rectangles on a page, as (x, y, size, rgb).

    Rectangles are accumulated and painted on the paint operator rather than
    on sight, because a page may build a path of many and fill it in one go
    ("re re re ... f*") as readily as one at a time ("re f").

    `span` is the (smallest, largest) a cell may be, in points. Left out, it
    is worked out from the page - see cell_span - because a chart cell is
    whatever size the leaflet it is printed in makes it: the same designer's
    charts are 10.6pt on an A4 pattern and 7.6pt on an A5 one, and a range
    that fits one silently finds nothing at all in the other.
    """
    if span is None:
        span = (3.0, 30.0)
    smallest, largest = span
    text = stream.decode("latin-1")
    # Text blocks carry digits and slashes that would otherwise parse as geometry.
    text = re.sub(r"BT.*?ET", " ", text, flags=re.S)
    # A name binds tight to the operator before it ("f*/GS1"), so split it off.
    tokens = text.replace("/", " /").split()

    fill = None
    stack = []
    pending = []
    numbers = []
    out = []

    for token in tokens:
        if NUMBER.fullmatch(token):
            numbers.append(float(token))
            continue
        if token == "q":
            stack.append(fill)
        elif token == "Q":
            fill = stack.pop() if stack else None
        elif token == "rg" and len(numbers) >= 3:
            fill = tuple(round(v, 2) for v in numbers[-3:])
        elif token == "g" and numbers:
            grey = round(numbers[-1], 2)
            fill = (grey, grey, grey)
        elif token == "k" and len(numbers) >= 4:
            fill = from_cmyk(numbers[-4:])
        elif token in ("sc", "scn"):
            # A colour set in a colour space rather than a device one, which
            # is what a drawing program exports when it has been told about
            # colour management: the same grey, said differently. How many
            # numbers came with it is what says which space it is.
            if len(numbers) >= 4:
                fill = from_cmyk(numbers[-4:])
            elif len(numbers) == 3:
                fill = tuple(round(v, 2) for v in numbers)
            elif len(numbers) == 1:
                grey = round(numbers[0], 2)
                fill = (grey, grey, grey)
        elif token == "re" and len(numbers) >= 4:
            pending.append(tuple(numbers[-4:]))
        elif token in ("f", "F", "f*", "b", "b*", "B", "B*"):
            for x, y, width, height in pending:
                if (
                    smallest < width < largest
                    and smallest < abs(height) < largest
                    # Square-ish: a chart cell is, and a rule or a swatch of
                    # background is not.
                    and abs(abs(height) - width) < width * 0.25
                ):
                    out.append((x, min(y, y + height), width, fill))
            pending = []
        elif token in ("S", "s", "n"):
            pending = []
        numbers = []

    return out


# ------------------------------------------------------------------ page text

TEXT_TOKEN = re.compile(
    rb"([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+Tm"
    rb"|\[((?:[^\[\]\\]|\\.)*)\]\s*TJ"
    rb"|\(((?:[^()\\]|\\.)*)\)\s*Tj"
    rb"|([-\d.]+)\s+([-\d.]+)\s+Td"
    rb"|(T\*)"
)


def _unescape(raw):
    return (
        raw.replace(rb"\(", b"(").replace(rb"\)", b")").replace(rb"\\", b"\\")
    ).decode("latin-1")


def text_runs(stream):
    """(x, y, text) per run, in page space.

    Tm sets the text position *and* its scale, and a following Td is in text
    space, so Td offsets are scaled before they mean anything on the page.
    """
    out = []
    for block in re.findall(rb"BT(.*?)ET", stream, re.S):
        x = y = 0.0
        scale_x = scale_y = 1.0
        text = ""
        origin = (0.0, 0.0)

        def flush():
            nonlocal text
            if text.strip():
                out.append((origin[0], origin[1], text.strip()))
            text = ""

        for match in TEXT_TOKEN.finditer(block):
            if match.group(1) is not None:
                flush()
                scale_x, scale_y = float(match.group(1)), float(match.group(4))
                x, y = float(match.group(5)), float(match.group(6))
                origin = (x, y)
            elif match.group(7) is not None:
                if not text:
                    origin = (x, y)
                text += "".join(
                    _unescape(part)
                    for part in re.findall(rb"\(((?:[^()\\]|\\.)*)\)", match.group(7))
                )
            elif match.group(8) is not None:
                if not text:
                    origin = (x, y)
                text += _unescape(match.group(8))
            elif match.group(9) is not None:
                dx = float(match.group(9)) * scale_x
                dy = float(match.group(10)) * scale_y
                if abs(dy) > 0.5:
                    flush()
                x += dx
                y += dy
            else:
                flush()
                y -= scale_y
        flush()
    return out


# ------------------------------------------------------------------- rendering


def read_ppm(path):
    with open(path, "rb") as handle:
        assert handle.readline().strip() == b"P6", "expected a binary PPM"
        fields = []
        while len(fields) < 3:
            line = handle.readline()
            if line.startswith(b"#"):
                continue
            fields += line.split()
        width, height = int(fields[0]), int(fields[1])
        return width, height, handle.read(width * height * 3)


class RenderedPage:
    """The page as pixels, for reading the marks drawn over the cells."""

    def __init__(self, pdf, page):
        prefix = tempfile.mktemp()
        subprocess.run(
            ["pdftoppm", "-r", str(RENDER_DPI), "-f", str(page), "-l", str(page),
             pdf, prefix],
            check=True,
        )
        candidates = [f"{prefix}-{page}.ppm", f"{prefix}-{page:02d}.ppm"]
        path = next(p for p in candidates if os.path.exists(p))
        self.width, self.height, self.data = read_ppm(path)
        os.remove(path)
        self.scale = RENDER_DPI / 72.0

    def pixel(self, x, y):
        i = (y * self.width + x) * 3
        return self.data[i], self.data[i + 1], self.data[i + 2]

    def ink(self, x, y, size, fill, grid=7, inset=0.16, covered=0.22):
        """A grid x grid bitmap of where a cell differs from its own fill.

        Each square of the grid is looked at whole rather than poked once in
        the middle. A knitting symbol is a hairline - a diagonal, a chevron -
        and on a small chart a single sample lands on it or beside it more or
        less by chance, which reads the same mark differently in the key and
        in the chart and leaves the classifier with nothing to match. Asking
        what fraction of each square is inked is stable at any size the chart
        happens to be printed.
        """
        base = tuple(int(round(v * 255)) for v in fill)
        step = (1 - 2 * inset) / grid
        bitmap = []
        for gy in range(grid):
            row = []
            for gx in range(grid):
                left = x + (inset + gx * step) * size
                right = x + (inset + (gx + 1) * step) * size
                top = y + (1 - inset - gy * step) * size
                bottom = y + (1 - inset - (gy + 1) * step) * size

                px0 = int(left * self.scale)
                px1 = max(px0 + 1, int(right * self.scale))
                py0 = int((PAGE_HEIGHT_PT - top) * self.scale)
                py1 = max(py0 + 1, int((PAGE_HEIGHT_PT - bottom) * self.scale))

                seen = inked = 0
                for py in range(py0, py1):
                    if not 0 <= py < self.height:
                        continue
                    for px in range(px0, px1):
                        if not 0 <= px < self.width:
                            continue
                        seen += 1
                        pixel = self.pixel(px, py)
                        if sum(abs(a - b) for a, b in zip(pixel, base)) > 150:
                            inked += 1
                row.append(1 if seen and inked / seen >= covered else 0)
            bitmap.append(row)
        return bitmap


def ink_weight(bitmap):
    return sum(sum(row) for row in bitmap)


def classify(bitmap, templates, tolerance=12):
    if ink_weight(bitmap) < 3:
        return None
    best, best_distance = None, 10 ** 9
    for name, template in templates.items():
        distance = sum(
            a != b for row, trow in zip(bitmap, template) for a, b in zip(row, trow)
        )
        if distance < best_distance:
            best, best_distance = name, distance
    if best_distance > tolerance:
        raise SystemExit(
            f"unrecognised symbol in a cell (closest was {best}, distance "
            f"{best_distance}):\n"
            + "\n".join("  " + "".join("#" if v else "." for v in r) for r in bitmap)
        )
    return best


# --------------------------------------------------------------------- blocks


def blocks_of(cells, size):
    """Connected components of cells, so each chart and swatch comes out whole."""
    reach = size * 1.6
    parent = list(range(len(cells)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    buckets = collections.defaultdict(list)
    for i, (x, y, _, _) in enumerate(cells):
        buckets[(int(x // reach), int(y // reach))].append(i)

    for (bx, by), members in buckets.items():
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for j in buckets.get((bx + dx, by + dy), ()):
                    for i in members:
                        if (abs(cells[i][0] - cells[j][0]) <= reach
                                and abs(cells[i][1] - cells[j][1]) <= reach):
                            a, b = find(i), find(j)
                            if a != b:
                                parent[a] = b

    groups = collections.defaultdict(list)
    for i in range(len(cells)):
        groups[find(i)].append(cells[i])
    return list(groups.values())


def stops(values, size):
    """Cluster coordinates onto the drawing's own pitch."""
    values = sorted(values)
    gaps = sorted(
        {round(b - a, 2) for a, b in zip(values, values[1:])
         if 0.4 * size < b - a < 1.4 * size}
    )
    pitch = gaps[0] if gaps else size
    out = [values[0]]
    for value in values[1:]:
        if value - out[-1] > pitch * 0.5:
            out.append(value)
    return out


def chart_rows(cells, size):
    """Rows of cells, bottom row first, each ordered right to left as knitted."""
    xs = stops({c[0] for c in cells}, size)
    ys = stops({c[1] for c in cells}, size)
    nearest = lambda v, arr: min(range(len(arr)), key=lambda i: abs(arr[i] - v))

    grid = collections.defaultdict(dict)
    for cell in cells:
        grid[nearest(cell[1], ys)][nearest(cell[0], xs)] = cell

    rows = []
    for r in range(len(ys)):
        # Drop the gutters a chart leaves between its pieces: a blank square is
        # not a stitch, it is a gap in the drawing.
        row = [grid[r][c] for c in sorted(grid[r], reverse=True)]
        rows.append(row)
    return rows


# ------------------------------------------------------------------ extraction


def read_key(pdf, page, vector_index, order=None):
    """The key's palette and symbol templates.

    A key usually names itself - "Yarn A" beside a swatch ties a fill to a
    slot, "s2kp" beside another names a mark - so nothing about a particular
    pattern's palette is assumed. Some patterns draw those captions outside
    the page's own content stream, where they cannot be read; for those,
    `order` names the swatches top to bottom instead.
    """
    stream = chart_stream(pdf, vector_index)
    cells = cells_in(stream)
    size = collections.Counter(round(c[2], 1) for c in cells).most_common(1)[0][0]
    rendered = RenderedPage(pdf, page)
    swatches = sorted(
        (b[0] for b in blocks_of(cells, size) if len(b) == 1), key=lambda c: -c[1]
    )

    if order:
        if len(order) != len(swatches):
            raise SystemExit(
                f"--key names {len(order)} swatches but the page has {len(swatches)}"
            )
        named = list(zip(order, swatches))
    else:
        labels = text_runs(stream)
        named = []
        for swatch in swatches:
            x, y = swatch[0], swatch[1]
            near = [
                label for label in labels
                if abs(label[1] - y) < size * 0.6 and 0 < label[0] - x < size * 6
            ]
            if near:
                named.append((min(near, key=lambda l: l[0] - x)[2], swatch))

    slots, templates = {}, {}
    for text, (x, y, cell_size, fill) in named:
        yarn = re.match(r"(?:Yarn\s+)?([A-H])$", text.strip())
        if yarn:
            slots[yarn.group(1)] = fill
            continue
        # sk2p and s2kp are different stitches - one leans, the other is
        # centred - and a pattern that uses one names it exactly, so both are
        # here and neither is read as the other.
        symbol = re.match(r"(knit|purl|s2kp|sk2p|k2tog|k1tbl)", text.strip())
        if symbol and symbol.group(1) != "knit":
            templates[symbol.group(1)] = rendered.ink(x, y, cell_size, fill)

    if not slots:
        raise SystemExit(
            "no yarn slots found in the key; pass --key to name the swatches "
            "top to bottom, e.g. --key knit purl s2kp A B C D E"
        )
    return slots, templates


def resolve_fills(cells, slots):
    """Map every fill on the page to a yarn slot.

    Exact matches first. A pattern's pages are not always exported with quite
    the same colour conversion - SWW24 draws yarn C as #6d6a63 on one chart
    page and #5f5c54 on the next - so any fill left over is paired with any
    slot left over, nearest first. That only runs when the two sets are the
    same size, because anything else means a colour genuinely is not in the key.
    """
    by_fill = {fill: slot for slot, fill in slots.items()}
    unmatched = sorted({c[3] for c in cells} - set(by_fill))
    if not unmatched:
        return by_fill

    spare = sorted(set(slots) - {by_fill[f] for f in by_fill})
    spare = [slot for slot in slots if slot not in
             {by_fill[f] for f in by_fill if f in {c[3] for c in cells}}]
    if len(spare) != len(unmatched):
        raise SystemExit(
            "these fills are not in the key: "
            + ", ".join("#%02x%02x%02x" % tuple(int(round(v * 255)) for v in f)
                        for f in unmatched)
            + f"; unused slots: {spare or 'none'}"
        )

    distance = lambda a, b: sum((x - y) ** 2 for x, y in zip(a, b))
    for fill in unmatched:
        slot = min(spare, key=lambda s: distance(fill, slots[s]))
        spare.remove(slot)
        by_fill[fill] = slot
        print("  note: #%02x%02x%02x read as yarn %s (nearest unused slot)"
              % (*[int(round(v * 255)) for v in fill], slot), file=sys.stderr)
    return by_fill


def chart_stream(pdf, vector_index):
    found = [s for s in streams(pdf) if cell_span(s)]
    if vector_index >= len(found):
        raise SystemExit(
            f"--vector {vector_index} out of range; this PDF has "
            f"{len(found)} chart-bearing streams"
        )
    return found[vector_index]


def extract(pdf, page, vector_index, slots, templates):
    stream = chart_stream(pdf, vector_index)
    cells = cells_in(stream, cell_span(stream))
    size = collections.Counter(round(c[2], 1) for c in cells).most_common(1)[0][0]
    rendered = RenderedPage(pdf, page)

    raw = blocks_of(cells, size)
    slabs = [b for b in raw if len(b) > 1]


    # Merge slabs sharing a vertical band: a crown chart is drawn as two wedges
    # either side of its decrease column, but it is one chart.
    slabs.sort(key=lambda b: -max(c[1] for c in b))
    merged = []
    for slab in slabs:
        low, high = min(c[1] for c in slab), max(c[1] for c in slab)
        for group in merged:
            glow, ghigh = min(c[1] for c in group), max(c[1] for c in group)
            if min(high, ghigh) - max(low, glow) > size:
                group.extend(slab)
                break
        else:
            merged.append(list(slab))
    merged.sort(key=lambda g: (-max(c[1] for c in g), min(c[0] for c in g)))

    # Only the chart's own cells: the key's symbol swatches are drawn in the
    # paper colour, which is not a yarn and has no slot.
    by_fill = resolve_fills([c for g in merged for c in g], slots)

    charts = []
    for group in merged:
        rows = chart_rows(group, size)
        out_rows = []
        for row in rows:
            out_row = []
            for x, y, cell_size, fill in row:
                slot = by_fill.get(fill)
                if slot is None:
                    raise SystemExit(
                        "a chart cell is filled #%02x%02x%02x, which is not any "
                        "yarn in the key" % tuple(int(round(v * 255)) for v in fill)
                    )
                symbol = classify(rendered.ink(x, y, cell_size, fill), templates)
                cell = {"slot": slot}
                if symbol:
                    cell["symbol"] = symbol
                out_row.append(cell)
            out_rows.append(out_row)
        charts.append(out_rows)

    return charts


def consumed(row):
    cost = {"k2tog": 2, "s2kp": 3, "sk2p": 3}
    return sum(cost.get(cell.get("symbol"), 1) for cell in row)


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pdf")
    parser.add_argument("--page", type=int, required=True,
                        help="1-based PDF page number, for rasterising the marks")
    parser.add_argument("--vector", type=int, default=0,
                        help="which chart-bearing content stream on that page")
    parser.add_argument("--charts", nargs="+", required=True,
                        help="expected charts in reading order, as ID:WIDTHxROWS")
    parser.add_argument("--key", nargs="+",
                        help="name the key's swatches top to bottom, for pages "
                             "whose captions are not in the content stream, "
                             "e.g. --key knit purl s2kp A B C D E")
    parser.add_argument("--key-page", type=int,
                        help="read the key from this page instead (a chart page "
                             "that carries no key borrows one)")
    parser.add_argument("--key-vector", type=int)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    slots, templates = read_key(
        args.pdf,
        args.key_page if args.key_page is not None else args.page,
        args.key_vector if args.key_vector is not None else args.vector,
        args.key,
    )
    charts = extract(args.pdf, args.page, args.vector, slots, templates)

    if len(charts) != len(args.charts):
        raise SystemExit(
            f"found {len(charts)} charts on the page but {len(args.charts)} "
            f"were expected: {[len(c[0]) for c in charts]} wide"
        )

    out = {"slots": {k: "#%02x%02x%02x" % tuple(int(round(v * 255)) for v in f)
                     for k, f in sorted(slots.items())},
           "charts": []}

    for spec, rows in zip(args.charts, charts):
        chart_id, _, shape = spec.partition(":")
        width, _, height = shape.partition("x")
        if len(rows) != int(height) or len(rows[0]) != int(width):
            raise SystemExit(
                f"chart {chart_id}: expected {width}x{height}, "
                f"got {len(rows[0])}x{len(rows)}"
            )
        # Each row's cells are the stitches worked, so the count going in is
        # what they consume and the count coming out is how many there are.
        for i in range(1, len(rows)):
            if consumed(rows[i]) != len(rows[i - 1]):
                raise SystemExit(
                    f"chart {chart_id} row {i + 1} consumes {consumed(rows[i])} "
                    f"stitches but row {i} produced {len(rows[i - 1])}"
                )
        out["charts"].append({"id": chart_id, "rows": rows})

    with open(args.out, "w") as handle:
        json.dump(out, handle, indent=1)
        handle.write("\n")

    print(f"wrote {args.out}")
    for spec, chart in zip(args.charts, out["charts"]):
        rows = chart["rows"]
        print(f"  chart {chart['id']}: {len(rows[0])} sts x {len(rows)} rows, "
              f"{consumed(rows[0])} in -> {len(rows[-1])} out")


if __name__ == "__main__":
    main()
