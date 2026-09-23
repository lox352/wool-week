"""Extract the Bousta Beanie charts from page 3 of the 2017 pattern PDF.

The charts are PDF vector cells, but their k2tog slash marks are not all
exposed consistently as vector strokes. Read cell fills from the drawing
operators and detect the slash marks from a high-resolution rendering of each
cell. Neither the source PDF nor its written instructions are copied.

Usage:
    python3 scripts/extract_sww17.py SWW17.pdf \
      --out src/data/hats/sww17-bousta-beanie.charts.json
"""
import argparse
import json
from pathlib import Path

import fitz

CELL_MIN = 9.84
CELL_MAX = 9.89
SCALE = 8

# The chart key uses these three fills: A = white, B = mid grey, C = dark grey.
PALETTE = {
    (1.000, 1.000, 1.000): "A",
    (0.695, 0.698, 0.700): "B",
    (0.284, 0.283, 0.279): "C",
}


def nearest_slot(fill):
    colour = tuple(round(value, 3) for value in fill)
    nearest = min(
        PALETTE,
        key=lambda candidate: sum(
            abs(colour[index] - candidate[index]) for index in range(3)
        ),
    )
    assert sum(abs(colour[index] - nearest[index]) for index in range(3)) < 0.02
    return PALETTE[nearest]


def extract(path):
    doc = fitz.open(path)
    page = doc[2]

    # Chart cells are the 9.865pt squares in the lower-right chart panel.
    cells = {}
    for drawing in page.get_drawings():
        if (
            drawing["fill"] is None
            or len(drawing["items"]) != 1
            or drawing["items"][0][0] != "re"
        ):
            continue
        rect = drawing["rect"]
        if not (
            CELL_MIN < rect.width < CELL_MAX
            and CELL_MIN < rect.height < CELL_MAX
            and 205 < rect.x0 < 330
            and 225 < rect.y0 < 520
        ):
            continue
        key = (round(rect.x0, 3), round(rect.y0, 3))
        if key in cells:
            # A few crown cells are painted twice at exactly the same place.
            assert nearest_slot(cells[key]["fill"]) == nearest_slot(drawing["fill"])
        else:
            cells[key] = drawing

    # Rasterise once to recover decrease slashes. In ordinary white/dark cells
    # the inset is completely uniform; a slash contributes a conspicuous run
    # of opposite-colour pixels.
    pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE), alpha=False)

    def has_k2tog(rect, slot):
        x0 = int((rect.x0 + 1.8) * SCALE)
        x1 = int((rect.x1 - 1.8) * SCALE)
        y0 = int((rect.y0 + 1.8) * SCALE)
        y1 = int((rect.y1 - 1.8) * SCALE)
        opposite = 0
        total = 0
        for y in range(y0, y1):
            for x in range(x0, x1):
                pixel = pix.pixel(x, y)
                luminance = sum(pixel[:3]) / 3
                total += 1
                if (slot == "A" and luminance < 80) or (
                    slot == "C" and luminance > 230
                ):
                    opposite += 1
        return slot in {"A", "C"} and opposite / total > 0.03

    def read_rows(selected, expected_rows):
        ys = sorted(
            {round(drawing["rect"].y0, 3) for drawing in selected},
            reverse=True,
        )
        assert len(ys) == expected_rows
        rows = []
        for y in ys:
            # PDF x increases left-to-right, but the pattern says every chart
            # row is read right-to-left.
            row_drawings = sorted(
                (
                    drawing
                    for drawing in selected
                    if abs(drawing["rect"].y0 - y) < 0.01
                ),
                key=lambda drawing: drawing["rect"].x0,
                reverse=True,
            )
            row = []
            for drawing in row_drawings:
                slot = nearest_slot(drawing["fill"])
                cell = {"slot": slot}
                if has_k2tog(drawing["rect"], slot):
                    cell["symbol"] = "k2tog"
                row.append(cell)
            rows.append(row)
        return rows

    chart_a_cells = [
        drawing
        for drawing in cells.values()
        if 225 < drawing["rect"].y0 < 370 and drawing["rect"].x0 < 250
    ]
    chart_b_cells = [
        drawing for drawing in cells.values() if 415 < drawing["rect"].y0 < 520
    ]

    chart_a = read_rows(chart_a_cells, 14)
    chart_b = read_rows(chart_b_cells, 10)

    assert all(len(row) == 4 for row in chart_a)
    assert not any(cell.get("symbol") for row in chart_a for cell in row)

    # Chart B begins over 12 stitches per repeat. Its stair-step drawing shows
    # the stitches left after each row, so validate consumption as well as
    # visible width. Row 9 has two decreases, which is why it drops 8 -> 6.
    assert [len(row) for row in chart_b] == [11, 11, 10, 10, 9, 9, 8, 8, 6, 6]
    previous = 12
    for number, row in enumerate(chart_b, 1):
        consumed = len(row) + sum(
            cell.get("symbol") == "k2tog" for cell in row
        )
        assert consumed == previous, (number, consumed, previous)
        previous = len(row)
    assert sum(
        cell.get("symbol") == "k2tog" for row in chart_b for cell in row
    ) == 6

    return {
        "charts": [
            {"id": "A", "rows": chart_a},
            {"id": "B", "rows": chart_b},
        ]
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    Path(args.out).write_text(json.dumps(extract(args.pdf), indent=2) + "\n")
