"""Extract Roadside Beanie's six charts from page 3 of the supplied leaflet.

Requires PyMuPDF. This page has unfilled symbol-key boxes and a detached
decrease column, so use its vector paths directly rather than extract_chart's
filled-key and connected-chart discovery. Bounds are PDF points, top-left
origin. Neither the source PDF nor its written instructions are copied.
"""
import argparse
import json
from pathlib import Path

import fitz


def extract(path):
    doc = fitz.open(path)
    drawings = doc[2].get_drawings()
    cells = [d for d in drawings if d["fill"] is not None
             and len(d["items"]) == 1 and d["items"][0][0] == "re"
             and abs(d["rect"].width - 7.277) < .02
             and abs(d["rect"].height - 7.277) < .02]
    key = sorted([d for d in cells if d["rect"].x0 < 180
                  and d["rect"].y0 < 200], key=lambda d: d["rect"].y0)
    assert len(key) == 7, "Expected the seven yarn swatches"
    palette = {tuple(d["fill"]): slot for slot, d in zip("ABCDEFG", key)}
    # Dots are filled Bezier circles; decreases are diagonal stroked lines.
    symbols = []
    for d in drawings:
        r = d["rect"]
        if d["type"] == "fs" and 3 < r.width < 4 and 3 < r.height < 4:
            assert all(item[0] == "c" for item in d["items"])
            symbols.append((r, "purl"))
        elif d["type"] == "s" and 4 < r.width < 5 and 4 < r.height < 5:
            assert len(d["items"]) == 1 and d["items"][0][0] == "l"
            symbols.append((r, "k2tog"))
    specs = [
        ("A", (165, 245, 200, 353), 4, 14),
        ("B", (233, 245, 251, 272), 2, 3),
        ("C", (165, 395, 374, 519), 28, 16),
        ("D", (231, 310, 264, 365), 4, 7),
        ("E", (284, 245, 375, 338), 12, 12),
        ("F", (224, 57, 374, 207), 20, 20),
    ]
    charts = []
    for name, bounds, width, height in specs:
        selected = [d for d in cells if fitz.Rect(bounds).contains(d["rect"])]
        bottom = max(d["rect"].y0 for d in selected)
        rows = [[] for _ in range(height)]
        for d in selected:
            r = d["rect"]
            index = round((bottom - r.y0) / 7.2775)
            assert abs(bottom - r.y0 - index * 7.2775) < .03
            cell = {"slot": palette[tuple(d["fill"])]}
            marks = [mark for rect, mark in symbols if r.contains(rect)]
            assert len(marks) <= 1
            if marks:
                cell["symbol"] = marks[0]
            existing = [c for x, c in rows[index] if abs(x - r.x0) < .02]
            if existing:
                # A few cells are painted twice at identical coordinates.
                assert existing == [cell]
            else:
                rows[index].append((r.x0, cell))
        rows = [[cell for _, cell in sorted(row, reverse=True)] for row in rows]
        assert len(rows[0]) == width
        for i, row in enumerate(rows):
            consumed = len(row) + sum(c.get("symbol") == "k2tog" for c in row)
            assert consumed == (len(rows[i - 1]) if i else width), (name, i + 1, len(row), consumed, len(rows[i-1]))
            if name != "F":
                assert len(row) == width
        assert sum(c.get("symbol") == "purl" for row in rows for c in row) == (28 if name == "A" else 0)
        assert sum(c.get("symbol") == "k2tog" for row in rows for c in row) == (19 if name == "F" else 0)
        charts.append({"id": name, "rows": rows})
        print(f"{name}: {len(rows)} rows, {len(rows[0])} -> {len(rows[-1])} stitches")
    return {"charts": charts}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    Path(args.out).write_text(json.dumps(extract(args.pdf), indent=2) + "\n")
