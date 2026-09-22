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
    for _x, _y, width, height, _fill in painted(stream)[0]:
        if 3.0 < width < 30.0 and 3.0 < height < 30.0 \
                and abs(height - width) < width * 0.25:
            sizes[round(width, 1)] += 1
    if not sizes:
        return None
    cell, seen = sizes.most_common(1)[0]
    if seen < 40:
        return None
    # Enough either side to catch the same cell drawn a hair larger or smaller.
    return (cell * 0.85, cell * 1.15)


def painted(stream):
    """What a page fills, in page points.

    Two lists. The rectangles, as (x, y, w, h, rgb). And the outlines drawn
    freehand - as (subpaths, rgb, even_odd) - which is how a chart whose cells
    are not shaded one by one gets drawn: 2018 fills the whole of a crown
    chart's staircase as a single rectilinear polygon and prints a number in
    each of its cells, so the polygon is the only thing on the page that says
    which cells there are.

    Rectangles are accumulated and painted on the paint operator rather than
    on sight, because a page may build a path of many and fill it in one go
    ("re re re ... f*") as readily as one at a time ("re f").

    Coordinates are put through the current transformation matrix, because a
    page need not draw in page units. Word exports a chart into a space of
    its own and scales it down to fit - 2015's cells are 20 units square
    under a 0.3 scale - so numbers straight out of the stream can be three
    times the size of the page they are on.
    """
    text = stream.decode("latin-1")
    # Text blocks carry digits and slashes that would otherwise parse as geometry.
    text = re.sub(r"BT.*?ET", " ", text, flags=re.S)
    # A name binds tight to the operator before it ("f*/GS1"), so split it off.
    tokens = text.replace("/", " /").split()

    fill = None
    # (x scale, y scale, x shift, y shift): rotation and skew are not something
    # a chart is drawn with, and ignoring them is better than half-reading them.
    ctm = (1.0, 1.0, 0.0, 0.0)
    stack = []
    pending = []
    subpaths = []
    here = None
    freehand = False
    numbers = []
    out = []
    shapes = []

    def at(where, x, y):
        sx, sy, tx, ty = where
        return (sx * x + tx, sy * y + ty)

    for token in tokens:
        if NUMBER.fullmatch(token):
            numbers.append(float(token))
            continue
        if token == "q":
            stack.append((fill, ctm))
        elif token == "Q":
            fill, ctm = stack.pop() if stack else (None, (1.0, 1.0, 0.0, 0.0))
        elif token == "cm" and len(numbers) >= 6:
            a, _b, _c, d, e, f = numbers[-6:]
            sx, sy, tx, ty = ctm
            ctm = (sx * a, sy * d, sx * e + tx, sy * f + ty)
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
            pending.append((tuple(numbers[-4:]), ctm))
            x, y, width, height = numbers[-4:]
            subpaths.append([
                at(ctm, x, y), at(ctm, x + width, y),
                at(ctm, x + width, y + height), at(ctm, x, y + height),
            ])
        elif token == "m" and len(numbers) >= 2:
            here = [at(ctm, *numbers[-2:])]
            subpaths.append(here)
            freehand = True
        elif token == "l" and len(numbers) >= 2 and here is not None:
            here.append(at(ctm, *numbers[-2:]))
        elif token == "c" and len(numbers) >= 6 and here is not None:
            # Only where a curve ends, which is all a rectilinear chart has.
            here.append(at(ctm, *numbers[-2:]))
        elif token in ("f", "F", "f*", "b", "b*", "B", "B*"):
            for (x, y, width, height), where in pending:
                sx, sy, tx, ty = where
                left = min(sx * x + tx, sx * (x + width) + tx)
                low = min(sy * y + ty, sy * (y + height) + ty)
                out.append(
                    (left, low, abs(width * sx), abs(height * sy), fill)
                )
            # A path of nothing but rectangles is already in `out`; only one
            # drawn freehand has anything to add.
            if freehand and subpaths:
                shapes.append((subpaths, fill, token in ("f*", "b*", "B*")))
            pending, subpaths, here, freehand = [], [], None, False
        elif token in ("S", "s", "n"):
            pending, subpaths, here, freehand = [], [], None, False
        numbers = []

    return out, shapes


def pitch_of(values, drawn):
    """The step between neighbouring cells, from where they are drawn.

    Every piece of a chart starts on a grid line, whether it is one cell
    or eleven, so their edges taken together mark out the whole grid. The
    commonest step between neighbouring edges is a single cell - commonest
    rather than smallest, because one cell nudged half a point by rounding
    would otherwise set the pitch for the whole page and leave every run
    measuring a fraction of a stitch too wide.
    """
    edges = sorted(set(values))
    gaps = [b - a for a, b in zip(edges, edges[1:]) if b - a > drawn * 0.4]
    if not gaps:
        return drawn
    about = collections.Counter(round(g, 1) for g in gaps).most_common(1)[0][0]
    near = [g for g in gaps if abs(g - about) < 0.15]
    return sum(near) / len(near)


def outline_grid(rectangles, shapes, cell, shapes_wanted):
    """The grid of a chart drawn as outlines rather than as shaded cells.

    2018's charts are not shaded at all: each is one filled outline in the
    paper colour with a number printed in each of its cells, so the cells come
    from the shape rather than from any rectangle. The pitch is therefore
    taken from the shape's own corners, every one of which is on a cell
    boundary.

    A chart whose outline is a plain oblong is drawn as one rectangle rather
    than as a path, so the rectangles that are the size of a chart the caller
    is expecting count too. Asking the size is what keeps the panel the whole
    page is printed on out of it: that is an oblong on the same grid as
    everything else, and it is not a chart.
    """
    vertices = [p for subs, _fill, _rule in shapes for sub in subs for p in sub]
    if len(vertices) < 8 or not cell:
        return None
    across = up = cell

    whole = lambda v, step: abs(v / step - round(v / step)) < 0.1

    def is_chart(subpaths):
        points = [p for sub in subpaths for p in sub]
        wide = max(p[0] for p in points) - min(p[0] for p in points)
        high = max(p[1] for p in points) - min(p[1] for p in points)
        return (whole(wide, across) and whole(high, up)
                and (int(round(wide / across)), int(round(high / up)))
                in shapes_wanted)

    drawn = [s for s in shapes if is_chart(s[0])]
    oblongs = [
        ([[(x, y), (x + w, y), (x + w, y + h), (x, y + h)]], fill, False)
        for x, y, w, h, fill in rectangles
        if whole(w, across) and whole(h, up)
        and (int(round(w / across)), int(round(h / up))) in shapes_wanted
    ]
    return [], [], across, across, up, drawn + oblongs


def cells_of(shapes, across, up, size):
    """The grid cells a filled outline covers, as (x, y, size, rgb).

    A cell counts if the outline encloses the middle of it, which is what
    makes a staircase come out as a staircase: the rule is the page's own
    winding rule, so a shape drawn as one loop and a shape drawn as a loop
    with a notch cut out of it both read the way they look.
    """
    out = []
    for subpaths, fill, even_odd in shapes:
        points = [p for sub in subpaths for p in sub]
        if len(points) < 4:
            continue
        left = min(p[0] for p in points)
        right = max(p[0] for p in points)
        low = min(p[1] for p in points)
        high = max(p[1] for p in points)
        wide = int(round((right - left) / across))
        tall = int(round((high - low) / up))
        if wide < 1 or tall < 1 or wide * tall > 20000:
            continue
        for j in range(tall):
            for i in range(wide):
                x = left + (i + 0.5) * across
                y = low + (j + 0.5) * up
                if inside(subpaths, x, y, even_odd):
                    out.append((left + i * across, low + j * up, size, fill))
    return out


def inside(subpaths, x, y, even_odd):
    """Whether (x, y) is in the filled region, by the rule the page asked for."""
    winding = 0
    crossings = 0
    for sub in subpaths:
        for i in range(len(sub)):
            (x0, y0), (x1, y1) = sub[i], sub[(i + 1) % len(sub)]
            if (y0 > y) == (y1 > y):
                continue
            where = x0 + (y - y0) / (y1 - y0) * (x1 - x0)
            if where <= x:
                continue
            crossings += 1
            winding += 1 if y1 > y0 else -1
    return crossings % 2 == 1 if even_odd else winding != 0


def grid_of(stream, span=None, outlines=False, cell=None, wanted=None):
    """A page's drawing and the grid its chart cells sit on.

    Returns the page's rectangles, the ones a chart could be drawn out of,
    the size a cell is drawn at and the pitch across and up.

    `span` is the (smallest, largest) a cell may be, in points. Left out, it
    is worked out from the page - see cell_span - because a chart cell is
    whatever size the leaflet it is printed in makes it: the same designer's
    charts are 10.6pt on an A4 pattern and 7.6pt on an A5 one, and a range
    that fits one silently finds nothing at all in the other.

    A cell need not have been drawn as its own rectangle. A word processor
    shades a table by run: eleven white stitches in a row come out as one
    rectangle eleven cells wide and one cell tall, and only the stitches that
    break a run are drawn singly. So a rectangle of cell height is measured
    against the pitch and handed back as the several cells it stands for,
    which leaves a chart drawn cell by cell exactly as it was.
    """
    if span is None:
        span = (3.0, 30.0)
    smallest, largest = span
    rectangles, shapes = painted(stream)
    if outlines:
        return outline_grid(rectangles, shapes, cell, wanted or set())

    square = [
        r for r in rectangles
        if smallest < r[2] < largest
        and smallest < r[3] < largest
        # Square-ish: a chart cell is, and a rule or a swatch of background
        # is not.
        and abs(r[3] - r[2]) < r[2] * 0.25
    ]
    if not square:
        return None
    size = collections.Counter(round(r[2], 1) for r in square).most_common(1)[0][0]
    tall = collections.Counter(round(r[3], 1) for r in square).most_common(1)[0][0]

    # Cells and runs alike, which is everything the chart is drawn out of.
    pieces = [r for r in rectangles if r[2] > size * 0.6 and r[3] > tall * 0.6]

    across = pitch_of((round(r[0], 2) for r in pieces), size)
    up = pitch_of((round(r[1], 2) for r in pieces), tall)
    return rectangles, pieces, size, across, up, []


def cells_in(stream, span=None, ruled=False, runs=True, outlines=False,
              cell=None, wanted=None):
    """A page's chart cells, as (x, y, size, rgb), one entry per stitch.

    `span` is the (smallest, largest) a cell may be, in points - see grid_of.

    A cell need not have been drawn as its own rectangle. A word processor
    shades a table by run: eleven white stitches in a row come out as one
    rectangle eleven cells wide and one cell tall, and only the stitches that
    break a run are drawn singly. So a rectangle is measured against the pitch
    and handed back as the several cells it stands for, which leaves a chart
    drawn cell by cell exactly as it was.
    """
    found = grid_of(stream, span, outlines, cell, wanted)
    if not found:
        return []
    rectangles, pieces, size, across, up, shapes = found
    if outlines:
        return cells_of(shapes, across, up, size)

    out = []
    for x, y, width, height, fill in pieces:
        # One cell, drawn at whatever size its own row and column happen to
        # be: a key's swatches are often set in a taller row than the chart's.
        # Only something half as big again as the pitch can be two cells.
        wide = 1 if width < across * 1.5 else int(round(width / across))
        high = 1 if height < up * 1.5 else int(round(height / up))
        if ((wide > 1 and abs(width - wide * across) > across * 0.4)
                or (high > 1 and abs(height - high * up) > up * 0.4)):
            continue
        if not runs and wide * high != 1:
            continue
        # A run's own extent divides more evenly than the page's average pitch
        # does, because a word processor's rows are not all quite the same
        # height, and one drawn taller than its neighbours would otherwise put
        # the cells under it half a row out.
        for j in range(high):
            for i in range(wide):
                out.append((x + i * width / wide, y + j * height / high, size, fill))

    return within_rules(out, rectangles, across, up) if ruled else out


def boxed_in(stream, cells):
    """The cells the page draws a box of their own around.

    A key set into the same table as its chart is not separable by position -
    it is one more row of it, and its swatches touch their neighbours exactly
    as the chart's cells touch theirs. What marks a swatch out is that it is
    ruled on its own: the line down its left and the line down its right are
    each one cell tall, where a chart's verticals run the height of the whole
    grid because the cells beside them share them.
    """
    found = grid_of(stream)
    if not found:
        return []
    rectangles, _pieces, _size, across, up, _shapes = found
    sides = [(r[0], r[1]) for r in rectangles
             if r[2] < across * 0.25 and up * 0.8 < r[3] < up * 2.0]

    def ruled(x, y):
        return any(abs(a - x) < across * 0.15 and abs(b - y) < up * 0.5
                   for a, b in sides)

    return [c for c in cells
            if ruled(c[0], c[1]) and ruled(c[0] + across, c[1])]


def within_rules(cells, rectangles, across, up):
    """The chart as its table rules it, rather than as its shading draws it.

    A chart set as a table has no gutters to leave blank: a word processor
    fills every cell of every row, and the staircase down a crown is drawn by
    taking the *borders* off the cells that are not stitches, not by leaving
    them out. Read from the shading alone, 2015's Baa-ble crown comes out
    sixty stitches wide to the very top. The other way round, a cell left at
    the table's default shading is not drawn at all, so whole runs of white
    stitches are missing from the middle of the sheep. Only the rules know
    which cells a knitter works, so here they say, and the shading is asked
    only what colour each one is.

    A stitch is a cell with a line above it and a line below it. The line
    above gives a row its extent, that being the one a row draws for itself;
    wanting the line below as well is what tells a row of stitches from the
    empty row a table is apt to end with, which has the chart's bottom edge
    over it and nothing under it at all.
    """
    if not cells:
        return cells
    rules = [r for r in rectangles if r[3] < up * 0.25 and r[2] > across * 0.7]
    if len(rules) < 20:
        return cells

    origin = min(c[0] for c in cells)
    column = lambda x: int(round((x - origin) / across))

    # A chart's columns are the ones that are shaded somewhere. It matters
    # because the table usually carries the row numbers in a column of its
    # own, ruled exactly like the rest and no part of the knitting.
    seen = collections.Counter(column(c[0]) for c in cells)
    busiest = max(seen.values())
    columns = {c for c, n in seen.items() if n * 5 >= busiest}

    ruled = collections.defaultdict(set)
    for x, y, width, _height, _fill in rules:
        start = column(x)
        ruled[round(y, 1)].update(
            range(start, start + max(int(round(width / across)), 1))
        )
    at = lambda y: columns & set().union(
        set(), *(v for k, v in ruled.items() if abs(k - y) < up * 0.3)
    )

    painted_at = {(round(c[1], 1), column(c[0])): c[3] for c in cells}
    size = collections.Counter(c[2] for c in cells).most_common(1)[0][0]

    out = []
    for y in sorted({round(c[1], 1) for c in cells}):
        above, below = at(y + up), at(y)
        if not above or not above <= below:
            continue
        for c in sorted(above):
            # Nothing drawn means the table's default, which is the paper.
            fill = painted_at.get((y, c), (1.0, 1.0, 1.0))
            out.append((origin + c * across, y, size, fill))
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


def text_boxes(pdf, page):
    """Every word on a page, as (x, y, text), in page points.

    Poppler resolves a subset font's own encoding, which a chart that names
    its yarns by printing a number in each cell needs and nothing else here
    does. The marks can be told apart by looking at them - a dot is not a
    chevron - but a 2 and a 3 differ by seven squares of a nine by nine
    bitmap, which is not a distance to trust a knitter's chart to.
    """
    out = subprocess.run(
        ["pdftotext", "-f", str(page), "-l", str(page), "-bbox", pdf, "-"],
        capture_output=True, text=True, check=True,
    ).stdout
    words = []
    for x0, y0, x1, y1, text in re.findall(
        r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">'
        r"(.*?)</word>",
        out,
    ):
        words.append((
            (float(x0) + float(x1)) / 2,
            PAGE_HEIGHT_PT - (float(y0) + float(y1)) / 2,
            text,
        ))
    return words


def digit_in(words, x, y, size):
    """The single digit printed inside a cell, if there is one."""
    for wx, wy, text in words:
        if len(text) == 1 and text.isdigit() and x < wx < x + size and y < wy < y + size:
            return text
    return None


def read_marked_key(named, size, rendered, digits):
    """A key whose swatches say which yarn as well as which stitch.

    2018's charts are not shaded at all. Every cell is paper, and what is
    printed in it - nothing, a dot, a number, a chevron - says both which yarn
    to use and what to do with it. So a key entry is named "A", or "A/purl",
    or "E/s2kp": the yarn, and the stitch where it is not a plain knit.

    A swatch with a number in it teaches that number. A swatch with nothing in
    it is what an empty cell means. Everything else becomes a template to
    match a cell's ink against, which is safe here because a dot, a chevron
    and a shaded chevron are not remotely alike.
    """
    blank, by_digit, templates, meaning = None, {}, {}, {}
    for text, (x, y, _cell_size, fill) in named:
        slot, _, symbol = text.partition("/")
        if not re.fullmatch(r"[A-H]", slot):
            raise SystemExit(f"--marks wants every key entry to name a yarn; got {text!r}")
        printed = digit_in(digits, x, y, size)
        if printed is not None:
            by_digit[printed] = slot
            continue
        bitmap = rendered.ink(x, y, size, fill, grid=9)
        if ink_weight(bitmap) == 0:
            blank = (slot, symbol or None)
            continue
        templates[text] = bitmap
        meaning[text] = (slot, symbol or None)

    if blank is None:
        raise SystemExit("--marks wants a key entry for an empty cell")
    if not by_digit:
        raise SystemExit("--marks found no numbered swatches in the key")
    return {"blank": blank, "digits": by_digit, "meaning": meaning}, templates


def key_column(swatches, wanted, size):
    """A key read as what it looks like: a column of evenly spaced swatches.

    A page can have any number of things the size of a chart cell on it - a
    leaflet's bullets, the corners of its boxes - and 2018's has eighty-three.
    Only one set of them is a key, and a key is a column: the same left edge
    all the way down, one step between each and the next.
    """
    by_left = collections.defaultdict(list)
    for swatch in swatches:
        by_left[round(swatch[0] / size)].append(swatch)
    for run in by_left.values():
        if len(run) != wanted:
            continue
        run.sort(key=lambda s: -s[1])
        steps = [a[1] - b[1] for a, b in zip(run, run[1:])]
        if max(steps) - min(steps) < size * 0.2:
            return run
    return None


def read_key(pdf, page, vector_index, order=None, cell=None,
             marks=False, ruled=False):
    """The key's palette and symbol templates.

    A key usually names itself - "Yarn A" beside a swatch ties a fill to a
    slot, "s2kp" beside another names a mark - so nothing about a particular
    pattern's palette is assumed. Some patterns draw those captions outside
    the page's own content stream, where they cannot be read; for those,
    `order` names the swatches top to bottom instead.
    """
    stream = chart_stream(pdf, vector_index)
    # A key drawn beside a chart whose cells are not shaded is the only thing
    # on the page that *is* a cell, so it is looked for at the chart's size.
    # As runs only where the chart is a table, which is the one drawing that
    # shades several cells with one rectangle - and whose key is set into the
    # same table. Anywhere else a swatch stands for one yarn and is one cell,
    # so a rectangle covering several is the panel behind the key rather than
    # a row of it, and a leaflet that prints its charts on a tinted panel
    # draws exactly that: read as runs it buries every swatch on the page.
    cells = cells_in(
        stream, (cell * 0.85, cell * 1.15) if cell else None, runs=ruled
    )
    size = cell or collections.Counter(
        round(c[2], 1) for c in cells
    ).most_common(1)[0][0]
    rendered = RenderedPage(pdf, page)
    # Top to bottom, then left to right, because a key set as one line across
    # the foot of a chart has all its swatches at the same height.
    order_by = lambda c: (-round(c[1] / size), c[0])
    swatches = sorted(
        (b[0] for b in blocks_of(cells, size) if len(b) == 1), key=order_by
    )
    if order and len(swatches) != len(order):
        boxed = sorted(boxed_in(stream, cells), key=order_by)
        if len(boxed) == len(order):
            swatches = boxed
    if order and len(swatches) != len(order):
        column = key_column(swatches, len(order), size)
        if column:
            swatches = column

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

    if marks:
        return read_marked_key(named, size, rendered, digits=text_boxes(pdf, page))

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
    distance = lambda a, b: sum((x - y) ** 2 for x, y in zip(a, b))

    if len(spare) != len(unmatched):
        # No slot going spare, so this is not a page drawn in slightly
        # different colours from the key - it is a cell shaded a shade off.
        # 2015's chart has one cell at 15% grey in a row of 25% grey ones,
        # and a shade that is plainly nearer one yarn than any other is that
        # yarn; one that could be either is an error and says so.
        left = []
        for fill in unmatched:
            ranked = sorted(slots, key=lambda s: distance(fill, slots[s]))
            if (len(ranked) < 2
                    or distance(fill, slots[ranked[0]]) * 1.5
                    > distance(fill, slots[ranked[1]])):
                left.append(fill)
                continue
            by_fill[fill] = ranked[0]
            print("  note: #%02x%02x%02x read as yarn %s (a shade off it, and "
                  "nothing else)" % (*[int(round(v * 255)) for v in fill],
                                     ranked[0]), file=sys.stderr)
        if not left:
            return by_fill
        raise SystemExit(
            "these fills are not in the key: "
            + ", ".join("#%02x%02x%02x" % tuple(int(round(v * 255)) for v in f)
                        for f in left)
            + f"; unused slots: {spare or 'none'}"
        )

    for fill in unmatched:
        slot = min(spare, key=lambda s: distance(fill, slots[s]))
        spare.remove(slot)
        by_fill[fill] = slot
        print("  note: #%02x%02x%02x read as yarn %s (nearest unused slot)"
              % (*[int(round(v * 255)) for v in fill], slot), file=sys.stderr)
    return by_fill


def chart_stream(pdf, vector_index):
    """The page's drawing.

    Usually one content stream. Some PDFs have been through a tool that split
    a page into a stream per object - 2018's leaflet has eight hundred of
    them, one per grid line - and there "all" glues them back together, which
    is safe because each is balanced and carries page coordinates.
    """
    if vector_index == "all":
        return b"\n".join(streams(pdf))
    vector_index = int(vector_index)
    found = [s for s in streams(pdf) if cell_span(s)]
    if vector_index >= len(found):
        raise SystemExit(
            f"--vector {vector_index} out of range; this PDF has "
            f"{len(found)} chart-bearing streams"
        )
    return found[vector_index]


def marked_cell(x, y, size, fill, words, key, templates, rendered):
    """One cell of a chart that says in the cell which yarn to use."""
    printed = digit_in(words, x, y, size)
    if printed is not None:
        slot = key["digits"].get(printed)
        if slot is None:
            raise SystemExit(f"a chart cell says {printed}, which the key does not")
        return {"slot": slot}
    name = classify(rendered.ink(x, y, size, fill, grid=9), templates, tolerance=20)
    slot, symbol = key["meaning"][name] if name else key["blank"]
    return {"slot": slot, "symbol": symbol} if symbol else {"slot": slot}


def extract(pdf, page, vector_index, slots, templates, ruled=False,
            cell=None, wanted=None, marks=False):
    stream = chart_stream(pdf, vector_index)
    if cell:
        cells = cells_in(stream, outlines=True, cell=cell, wanted=wanted)
        size = cell
    else:
        # Runs only where the chart is a table. A word processor shades by
        # run and leaves a plain stitch undrawn, so there a rectangle stands
        # for the several cells it covers; a page-layout program draws every
        # cell on its own, and its one big rectangle is the panel the charts
        # are printed on, which is not 3,000 stitches.
        cells = cells_in(stream, cell_span(stream), ruled, runs=ruled)
        size = collections.Counter(
            round(c[2], 1) for c in cells
        ).most_common(1)[0][0]
    rendered = RenderedPage(pdf, page)

    raw = blocks_of(cells, size)
    slabs = [b for b in raw if len(b) > 1]


    """Merge slabs that are one chart drawn in pieces.

    A crown chart comes apart into two wedges either side of its decrease
    column, and they share a vertical band, so sharing one is most of the
    test. But it is not all of it: a page that sets two charts side by side -
    2021 puts a 24 stitch body chart beside a 24 stitch crown - has them
    sharing a band too, and merging those gives one impossible chart 48
    stitches wide. So they must also be within a few cells of each other
    across the page. A decrease column is one cell; a gutter between two
    charts is a dozen.
    """
    reach = size * 4
    slabs.sort(key=lambda b: -max(c[1] for c in b))
    merged = []
    for slab in slabs:
        low, high = min(c[1] for c in slab), max(c[1] for c in slab)
        left, right = min(c[0] for c in slab), max(c[0] for c in slab)
        for group in merged:
            glow, ghigh = min(c[1] for c in group), max(c[1] for c in group)
            gleft, gright = min(c[0] for c in group), max(c[0] for c in group)
            apart = max(gleft - right, left - gright, 0)
            if min(high, ghigh) - max(low, glow) > size and apart <= reach:
                group.extend(slab)
                break
        else:
            merged.append(list(slab))
    merged.sort(key=lambda g: (-max(c[1] for c in g), min(c[0] for c in g)))

    words = text_boxes(pdf, page) if marks else []
    # Only the chart's own cells: the key's symbol swatches are drawn in the
    # paper colour, which is not a yarn and has no slot.
    by_fill = {} if marks else resolve_fills([c for g in merged for c in g], slots)

    charts = []
    for group in merged:
        rows = chart_rows(group, size)
        out_rows = []
        for row in rows:
            out_row = []
            for x, y, cell_size, fill in row:
                if marks:
                    out_row.append(marked_cell(x, y, cell_size, fill, words,
                                               slots, templates, rendered))
                    continue
                slot = by_fill.get(fill)
                if slot is None:
                    raise SystemExit(
                        "a chart cell is filled #%02x%02x%02x, which is not any "
                        "yarn in the key" % tuple(int(round(v * 255)) for v in fill)
                    )
                symbol = classify(rendered.ink(x, y, cell_size, fill), templates)
                out = {"slot": slot}
                if symbol:
                    out["symbol"] = symbol
                out_row.append(out)
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
    parser.add_argument("--vector", default="0",
                        help="which chart-bearing content stream on that page, "
                             "or \"all\" for a page split into one per object")
    parser.add_argument("--charts", nargs="+", required=True,
                        help="expected charts in reading order, as ID:WIDTHxROWS")
    parser.add_argument("--key", nargs="+",
                        help="name the key's swatches top to bottom, for pages "
                             "whose captions are not in the content stream, "
                             "e.g. --key knit purl s2kp A B C D E")
    parser.add_argument("--key-page", type=int,
                        help="read the key from this page instead (a chart page "
                             "that carries no key borrows one)")
    parser.add_argument("--key-vector")
    parser.add_argument("--cell", type=float,
                        help="how big a cell is, in points, for a chart drawn "
                             "as an outline rather than as shaded cells")
    parser.add_argument("--marks", action="store_true",
                        help="the cell says which yarn as well as which "
                             "stitch, so key entries are named A, A/purl, "
                             "E/s2kp and so on")
    parser.add_argument("--ruled", action="store_true",
                        help="the chart is a word-processor table, whose "
                             "gutters are cells with their borders taken off "
                             "rather than cells left out")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    wanted = set()
    for spec in args.charts:
        _id, _, shape = spec.partition(":")
        width, _, height = shape.partition("x")
        wanted.add((int(width), int(height)))

    slots, templates = read_key(
        args.pdf,
        args.key_page if args.key_page is not None else args.page,
        args.key_vector if args.key_vector is not None else args.vector,
        args.key,
        args.cell,
        args.marks,
        args.ruled,
    )
    charts = extract(args.pdf, args.page, args.vector, slots, templates,
                     args.ruled, args.cell, wanted, args.marks)

    if len(charts) != len(args.charts):
        raise SystemExit(
            f"found {len(charts)} charts on the page but {len(args.charts)} "
            f"were expected: {[len(c[0]) for c in charts]} wide"
        )

    palette = {} if args.marks else slots
    out = {"slots": {k: "#%02x%02x%02x" % tuple(int(round(v * 255)) for v in f)
                     for k, f in sorted(palette.items())},
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
