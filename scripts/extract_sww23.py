"""Extract the five Buggiflooer Beanie charts from the 2023 pattern PDF.

The charts are embedded raster images rather than PDF vector cells. The
pattern prints them in the Uradale colourway, with Yarn A as MC throughout
and a row-by-row CC letter at the right. We therefore read each cell as
either the dark Yarn A ground or the printed row's contrast slot.

Chart A's black dots are purls. Chart E's black triangles are centred double
decreases (CDD), represented by the site's s2kp stitch.

Usage:
    python3 scripts/extract_sww23.py SWW23.pdf \
      --out src/data/hats/sww23-buggiflooer-beanie.charts.json
"""
import argparse
import json
from pathlib import Path
import fitz

GROUND = (64, 23, 21)
X_TO_Y = 0.9545

def distance(a, b):
    return sum(abs(int(a[i]) - int(b[i])) for i in range(3))

def is_ground(rgb):
    return distance(rgb, GROUND) < 35

def rgb(pix, x, y):
    value = pix.pixel(max(0, min(pix.width - 1, int(x))),
                      max(0, min(pix.height - 1, int(y))))
    return tuple(value[:3])

def chart_images(doc):
    p5 = doc[4]
    items = []
    for image in p5.get_images(full=True):
        xref = image[0]
        pix = fitz.Pixmap(doc, xref)
        rect = p5.get_image_rects(xref)[0]
        if pix.width < 400 or pix.height < 300:
            continue
        items.append((rect, pix))
    a = max(items, key=lambda item: item[1].height / item[1].width)[1]
    short = [item for item in items if item[1] is not a]
    b = min(short, key=lambda item: item[0].y0)[1]
    d = max(short, key=lambda item: item[0].y0)[1]

    p6 = doc[5]
    large = []
    for image in p6.get_images(full=True):
        pix = fitz.Pixmap(doc, image[0])
        if pix.width > 1000 and pix.height > 1000:
            large.append(pix)
    c = max(large, key=lambda pix: pix.width / pix.height)
    e = max(large, key=lambda pix: pix.height / pix.width)
    return a, b, c, d, e

def regular(pix, cols, rows, contrasts, purls=False):
    cell_h = pix.height / (rows + 1)
    cell_w = cell_h * X_TO_Y
    out = []
    for row in range(1, rows + 1):
        y0 = (rows - row) * cell_h
        cells = []
        for image_col in reversed(range(cols)):
            x0 = image_col * cell_w
            quarter = rgb(pix, x0 + 0.25 * cell_w, y0 + 0.25 * cell_h)
            center = rgb(pix, x0 + 0.5 * cell_w, y0 + 0.5 * cell_h)
            cell = {"slot": "A" if is_ground(quarter) else contrasts[row]}
            if purls and not is_ground(quarter) and max(center) < 30:
                cell["symbol"] = "purl"
            cells.append(cell)
        out.append(cells)
    return out

def crown(pix, contrasts):
    rows, cols = 26, 22
    cell_h = pix.height / (rows + 1)
    cell_w = cell_h * X_TO_Y
    data_bottom = rows * cell_h
    out = []
    for row in range(1, rows + 1):
        y0 = data_bottom - row * cell_h
        cells = []
        for image_col in reversed(range(cols)):
            x0 = image_col * cell_w
            quarter = rgb(pix, x0 + 0.25 * cell_w, y0 + 0.25 * cell_h)
            center = rgb(pix, x0 + 0.5 * cell_w, y0 + 0.5 * cell_h)
            if min(quarter) > 250 and min(center) > 250:
                continue
            cell = {"slot": "A" if is_ground(quarter) else contrasts[row]}
            if image_col == 10 and row >= 8 and row % 2 == 0 and max(center) < 30:
                cell["slot"] = contrasts[row]
                cell["symbol"] = "s2kp"
            cells.append(cell)
        out.append(cells)
    return out

def extract(path):
    doc = fitz.open(path)
    a, b, c, d, e = chart_images(doc)
    cc_a = {r: ("C" if r <= 4 or r >= 8 else "D") for r in range(1, 11)}
    cc_c = {
        **{r: "C" for r in range(1, 6)},
        **{r: "D" for r in range(6, 10)},
        **{r: "E" for r in range(10, 13)},
        13: "F",
        **{r: "E" for r in range(14, 17)},
        **{r: "D" for r in range(17, 21)},
        **{r: "C" for r in range(21, 26)},
    }
    cc_e = {
        **{r: "C" for r in range(1, 7)},
        7: "F",
        **{r: "E" for r in range(8, 14)},
        **{r: "D" for r in range(14, 27)},
    }
    return {"charts": [
        {"id": "A", "rows": regular(a, 4, 10, cc_a, purls=True)},
        {"id": "B", "rows": regular(b, 4, 4, {r: "B" for r in range(1, 5)})},
        {"id": "C", "rows": regular(c, 34, 25, cc_c)},
        {"id": "D", "rows": regular(d, 4, 4, {r: "B" for r in range(1, 5)})},
        {"id": "E", "rows": crown(e, cc_e)},
    ]}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    Path(args.out).write_text(json.dumps(extract(args.pdf), indent=2) + "\n")
