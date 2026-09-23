"""Extract Hazel Tindall's four Shwook Hat charts from page 4.

The PDF chart is a table rather than four isolated raster pictures. A/B/C use
fixed rectangular grids. D is a crown staircase whose worked cells are the
two red-outlined wings plus its centre decrease column. Yarn slots are learned
from the A-E key on the same page, and every chart row is checked against the
printed dark/light yarn table and stitch-count arithmetic.
"""
import argparse
import json
from pathlib import Path

import fitz

SCALE = 6
X_PITCH = 11.28
Y_PITCH = 9.60

GRIDS = {
    "A": (318.12, 144.12, 6, 4),
    "B": (70.44, 251.16, 28, 13),
    "C": (115.08, 448.20, 24, 13),
}
KEY_X = {"A": 81.24, "B": 115.08, "C": 148.92, "D": 182.76, "E": 216.60}
KEY_Y = 163.32

D_X0 = 205.32
D_ROW1_Y = 764.28


def rgb(pix, x, y):
    return tuple(pix.pixel(int(x * SCALE), int(y * SCALE))[:3])


def distance(a, b):
    return sum(abs(int(a[i]) - int(b[i])) for i in range(3))


def sample_cell(pix, x, y):
    # Away from circles and s2kp strokes in the centre of marked cells.
    return rgb(pix, x + X_PITCH * 0.23, y + Y_PITCH * 0.23)


def nearest(colour, palette):
    slot, d = min(
        ((slot, distance(colour, value)) for slot, value in palette.items()),
        key=lambda item: item[1],
    )
    assert d < 50, (colour, palette, slot, d)
    return slot


def words(page):
    return page.get_text("words")


def read_palette(page, pix):
    # Confirm that the five labels beside the swatches are really the A-E key.
    seen = {
        text
        for x0, y0, x1, y1, text, *_ in words(page)
        if 60 < x0 < 240 and 175 < y0 < 205 and text in set("ABCDE")
    }
    assert seen == set("ABCDE"), seen
    return {
        slot: sample_cell(pix, x, KEY_Y)
        for slot, x in KEY_X.items()
    }


def regular(pix, palette, name):
    x0, y0, width, height = GRIDS[name]
    rows = []
    for row in range(1, height + 1):
        y = y0 + (height - row) * Y_PITCH
        cells = []
        for col in range(1, width + 1):
            # Chart numbers run right-to-left; column 1 is the rightmost cell.
            x = x0 + (width - col) * X_PITCH
            cells.append({"slot": nearest(sample_cell(pix, x, y), palette)})
        rows.append(cells)
    return rows


def d_columns(row):
    # The red chart outline steps one stitch inward at both sides after every
    # second row. Column 9 is the separate centred-decrease spine.
    stage = (row - 1) // 2
    wing = 6 - stage
    left = list(range(16, 16 - wing, -1))
    right = list(range(7 - stage, 0, -1))
    return left + [9] + right


def crown(page, pix, palette):
    # The s2kp glyphs are real PDF text, which is stronger evidence than
    # classifying their black pixels.
    marks = []
    for x0, y0, x1, y1, text, *_ in words(page):
        if text.strip() != "/|\\":
            continue
        if not (190 < x0 < 410 and 630 < y0 < 790):
            continue
        row = round((D_ROW1_Y - y0) / Y_PITCH) + 1
        col = round((x0 - D_X0) / X_PITCH) + 1
        if 1 <= row <= 13:
            marks.append((row, col))
    assert sorted(marks) == [(row, 9) for row in range(1, 14, 2)], marks

    rows = []
    for row in range(1, 14):
        y = D_ROW1_Y - (row - 1) * Y_PITCH
        cells = []
        for col in d_columns(row):
            x = D_X0 + (col - 1) * X_PITCH
            cell = {"slot": nearest(sample_cell(pix, x, y), palette)}
            if (row, col) in marks:
                cell["symbol"] = "s2kp"
            cells.append(cell)
        rows.append(cells)

    assert [len(row) for row in rows] == [
        14, 14, 12, 12, 10, 10, 8, 8, 6, 6, 4, 4, 2,
    ]
    before = 16
    for number, row in enumerate(rows, 1):
        consumed = len(row) + 2 * sum(
            cell.get("symbol") == "s2kp" for cell in row
        )
        assert consumed == before, (number, consumed, before)
        before = len(row)
    assert before == 2
    return rows


def assert_tables(charts):
    # Page 4 names dark/light yarns by row. These checks independently anchor
    # the sampled cell colours to the printed yarn letters.
    allowed_a = [
        {"B", "C"}, {"B", "C"}, {"B", "C"}, {"B", "C"},
    ]
    allowed_b = [
        {"C", "D"}, {"C", "D"}, {"C", "D"},
        {"B", "E"}, {"B", "E"}, {"B", "E"},
        {"A", "B", "D"},
        {"B", "E"}, {"B", "E"}, {"B", "E"},
        {"C", "D"}, {"C", "D"}, {"C", "D"},
    ]
    allowed_c = [
        {"A", "B"}, {"A", "B"}, {"A", "B"},
        {"C", "D"}, {"C", "D"}, {"C", "D"},
        {"D", "E"},
        {"C", "D"}, {"C", "D"}, {"C", "D"},
        {"A", "B"}, {"A", "B"}, {"A", "B"},
    ]
    for name, allowed in [("A", allowed_a), ("B", allowed_b), ("C", allowed_c)]:
        rows = charts[name]
        for number, (row, expected) in enumerate(zip(rows, allowed), 1):
            actual = {cell["slot"] for cell in row}
            assert actual <= expected, (name, number, actual, expected)

    # D's printed table changes its pair of yarns in bands; the centre CDD
    # takes the colour of the cell it is printed on.
    d = charts["D"]
    allowed_d = [
        {"B", "E"}, {"A"}, {"C", "D", "E"}, {"C", "D", "E"},
        {"C", "D", "E"}, {"C", "D", "E"}, {"C", "D"},
        {"C", "D"}, {"C", "D"}, {"C", "D"}, {"C", "D"}, {"A"}, {"A"},
    ]
    for number, (row, expected) in enumerate(zip(d, allowed_d), 1):
        actual = {cell["slot"] for cell in row}
        assert actual <= expected, ("D", number, actual, expected)


def extract(path):
    doc = fitz.open(path)
    page = doc[3]
    pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE), alpha=False)
    palette = read_palette(page, pix)
    charts = {name: regular(pix, palette, name) for name in "ABC"}
    charts["D"] = crown(page, pix, palette)
    assert_tables(charts)

    assert [len(row) for row in charts["A"]] == [6] * 4
    assert [len(row) for row in charts["B"]] == [28] * 13
    assert [len(row) for row in charts["C"]] == [24] * 13

    return {
        "charts": [
            {"id": name, "rows": charts[name]}
            for name in "ABCD"
        ]
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    Path(args.out).write_text(json.dumps(extract(args.pdf), indent=2) + "\n")
