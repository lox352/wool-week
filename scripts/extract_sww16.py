"""Extract Crofthoose Hat charts from the 2016 pattern PDF.

The body is printed four times, once in each sample colourway. The extractor
maps every printing back to yarn slots A-E and requires all four to agree cell
for cell, including the corrugated-rib purl marks. The crown is printed only in
colourway 1; its centred double decreases are read from the rendered page.
"""
import argparse
import json
from pathlib import Path
import fitz

BODY_CELL = 9.0
BODY_ROWS = 41
BODY_COLS = 12
BODY_SCALE = 6
CROWN_CELL = 17.59
CROWN_ROWS = 22
CROWN_COLS = 24
CROWN_SCALE = 6


def colour_distance(a, b):
    return sum(abs(int(a[i]) - int(b[i])) for i in range(3))


def cluster(values, tolerance=0.25):
    groups = []
    for value in sorted(values):
        if not groups or value - groups[-1][-1] > tolerance:
            groups.append([value])
        else:
            groups[-1].append(value)
    return [sum(group) / len(group) for group in groups]


def sample(pix, scale, x, y):
    return tuple(pix.pixel(int(x * scale), int(y * scale))[:3])


def body_charts(page):
    cells = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if (
            drawing.get("fill") is not None
            and len(drawing["items"]) == 1
            and drawing["items"][0][0] == "re"
            and abs(rect.width - BODY_CELL) < 0.08
            and abs(rect.height - BODY_CELL) < 0.08
            and rect.y0 > 430
        ):
            cells.append(drawing)

    x_counts = {}
    for drawing in cells:
        x = round(drawing["rect"].x0, 2)
        x_counts[x] = x_counts.get(x, 0) + 1
    dense = sorted(x for x, count in x_counts.items() if count >= 30)
    groups = []
    for x in dense:
        if not groups or x - groups[-1][-1] > 20:
            groups.append([x])
        else:
            groups[-1].append(x)
    assert [len(group) for group in groups] == [12, 12, 12, 12], groups

    pix = page.get_pixmap(matrix=fitz.Matrix(BODY_SCALE, BODY_SCALE), alpha=False)
    decoded = []
    first_palette = None
    for group_number, group in enumerate(groups, 1):
        x0 = min(group)
        selected = [
            drawing for drawing in cells
            if x0 - 0.1 <= drawing["rect"].x0 <= max(group) + 0.1
        ]
        bottom = max(drawing["rect"].y0 for drawing in selected)
        top = bottom - (BODY_ROWS - 1) * BODY_CELL

        def read(row, col, fx=0.25, fy=0.25):
            x = x0 + (BODY_COLS - col) * BODY_CELL
            y = top + (BODY_ROWS - row) * BODY_CELL
            return sample(
                pix, BODY_SCALE,
                x + fx * BODY_CELL, y + fy * BODY_CELL,
            )

        a = read(1, 1)
        palette = {a: "A"}
        for row, slot in [(2, "B"), (3, "C"), (4, "D"), (5, "E")]:
            colours = [read(row, col) for col in range(1, BODY_COLS + 1)]
            other = max(colours, key=lambda colour: colour_distance(colour, a))
            assert colour_distance(other, a) > 40
            palette[other] = slot
        assert set(palette.values()) == set("ABCDE")
        if group_number == 1:
            first_palette = dict(palette)

        rows = []
        for row in range(1, BODY_ROWS + 1):
            out = []
            for col in range(1, BODY_COLS + 1):
                quarter = read(row, col, 0.25, 0.25)
                base = min(
                    palette,
                    key=lambda colour: colour_distance(quarter, colour),
                )
                assert colour_distance(quarter, base) < 25
                cell = {"slot": palette[base]}
                center = read(row, col, 0.5, 0.5)
                if colour_distance(center, quarter) > 150:
                    cell["symbol"] = "purl"
                out.append(cell)
            rows.append(out)
        decoded.append(rows)

    canonical = decoded[0]
    for number, rows in enumerate(decoded[1:], 2):
        assert rows == canonical, (
            f"body colourway {number} does not match colourway 1"
        )
    assert sum(
        cell.get("symbol") == "purl"
        for row in canonical for cell in row
    ) == 48
    assert all(
        [
            i + 1 for i, cell in enumerate(row)
            if cell.get("symbol") == "purl"
        ] == [1, 3, 5, 7, 9, 11]
        for row in canonical[:8]
    )
    assert not any(
        cell.get("symbol") for row in canonical[8:] for cell in row
    )
    return canonical, first_palette


def crown_chart(page, body_palette):
    cells = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if (
            drawing.get("fill") is not None
            and len(drawing["items"]) == 1
            and drawing["items"][0][0] == "re"
            and abs(rect.width - CROWN_CELL) < 0.15
            and abs(rect.height - CROWN_CELL) < 0.15
            and 120 < rect.x0 < 530
            and 100 < rect.y0 < 500
        ):
            cells.append(drawing)
    assert len(cells) == 286

    xs = sorted(cluster([drawing["rect"].x0 for drawing in cells]))
    ys = sorted(
        cluster([drawing["rect"].y0 for drawing in cells]),
        reverse=True,
    )
    assert len(xs) == CROWN_COLS
    assert len(ys) == CROWN_ROWS

    normalised = {
        tuple(channel / 255 for channel in rgb): slot
        for rgb, slot in body_palette.items()
    }
    by_cell = {}
    for drawing in cells:
        cx = min(range(len(xs)), key=lambda i: abs(xs[i] - drawing["rect"].x0))
        ry = min(range(len(ys)), key=lambda i: abs(ys[i] - drawing["rect"].y0))
        fill = tuple(drawing["fill"])
        nearest = min(
            normalised,
            key=lambda colour: sum(
                abs(fill[i] - colour[i]) for i in range(3)
            ),
        )
        assert sum(abs(fill[i] - nearest[i]) for i in range(3)) < 0.04
        by_cell[(ry, cx)] = (drawing, normalised[nearest])

    pix = page.get_pixmap(
        matrix=fitz.Matrix(CROWN_SCALE, CROWN_SCALE),
        alpha=False,
    )
    rows = []
    for ry in range(CROWN_ROWS):
        present = [
            (cx, *by_cell[(ry, cx)])
            for cx in range(CROWN_COLS)
            if (ry, cx) in by_cell
        ]
        out = []
        for _, drawing, slot in sorted(present, reverse=True):
            rect = drawing["rect"]
            dark = total = 0
            for y in range(
                int((rect.y0 + 3) * CROWN_SCALE),
                int((rect.y1 - 3) * CROWN_SCALE),
            ):
                for x in range(
                    int((rect.x0 + 3) * CROWN_SCALE),
                    int((rect.x1 - 3) * CROWN_SCALE),
                ):
                    total += 1
                    if max(pix.pixel(x, y)[:3]) < 60:
                        dark += 1
            cell = {"slot": slot}
            if dark / total > 0.10:
                cell["symbol"] = "s2kp"
            out.append(cell)
        rows.append(out)

    assert [len(row) for row in rows] == [
        24, 22, 22, 20, 20, 18, 18, 16, 16, 14, 14,
        12, 12, 10, 10, 8, 8, 6, 6, 4, 4, 2,
    ]
    assert rows[0] == [{"slot": "A"} for _ in range(24)]
    assert [
        i + 1 for i, row in enumerate(rows)
        if any(cell.get("symbol") == "s2kp" for cell in row)
    ] == list(range(2, 23, 2))
    assert sum(
        cell.get("symbol") == "s2kp"
        for row in rows for cell in row
    ) == 11

    previous = 24
    for number, row in enumerate(rows[1:], 2):
        consumed = len(row) + 2 * sum(
            cell.get("symbol") == "s2kp" for cell in row
        )
        assert consumed == previous, (number, consumed, previous)
        previous = len(row)
    assert previous == 2
    return rows


def extract(path):
    doc = fitz.open(path)
    body, palette = body_charts(doc[2])
    crown = crown_chart(doc[3], palette)
    return {
        "charts": [
            {"id": "A", "rows": body},
            {"id": "B", "rows": crown},
        ]
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    Path(args.out).write_text(
        json.dumps(extract(args.pdf), indent=2) + "\n"
    )
