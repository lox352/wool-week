# Where the pattern data came from

## The short version

The charts here were read out of the pattern PDFs, which are sold by Shetland
Wool Week. Each year lives in exactly two files, so any year can be removed in
one commit:

```
src/data/hats/<id>.ts            the sizes, colourways and round-by-round script
src/data/hats/<id>.charts.json   the chart grids
```

Delete both and drop its line from `src/data/hats/index.ts`.

The PDFs themselves are **not** in this repository and the site never reads
one. No written instructions are reproduced — only the chart, which is what
the visualisation needs, plus the measurements and materials a knitter needs
to pick a size.

If Shetland Wool Week or a designer would rather a year were not here, it
should come out. That is what the two-file rule is for.

## How a chart is extracted

`scripts/extract_chart.py` does it, run by hand once per pattern. Its output is
reviewed and committed.

```sh
python3 scripts/extract_chart.py pattern.pdf \
    --page 5 --vector 0 \
    --charts A:18x16 B:16x16 \
    --out src/data/hats/sww25-aal-ower-toorie.charts.json
```

It reads a page two ways and makes them agree:

- **Colours from the vectors.** Chart cells are drawn as rectangles, so the
  fills come from the page's own drawing operators rather than from a picture
  of it. Cells can overlap — SWW25 draws 10.6pt cells on a 9.6pt pitch — so
  columns are found by clustering coordinates, not by dividing by cell width.
- **Symbols from the pixels.** The fills say nothing about the marks drawn on
  top, so the page is rasterised and each cell compared against its own fill:
  pixels that differ are ink. The key's swatches are cells too, drawn at the
  same size with the same marks, so they serve as templates and the classifier
  calibrates itself off the page it is reading.
- **Names from the key.** "Yarn A" beside a swatch is what ties a fill to a
  slot. Where a pattern draws those captions outside the page's content stream,
  `--key knit purl s2kp A B C D E` names the swatches top to bottom instead.

It refuses to write a file whose arithmetic does not chain: a chart row holds
the stitches *worked* in that round, so its length is the count afterwards and
the count before is what its cells consume. Anything that does not add up is an
error, not a warning.

## How it is checked

`src/knitting/engine.test.ts` replays each pattern and asserts every stitch
count the published pattern prints out loud:

- **Islesburgh Toorie** — cast on 144, 160 after the increase round, 144 after
  the decrease round, 12 at the crown.
- **Aal Ower Toorie** — cast on 130, 162 after the increase round, 9 at the
  crown.

A chart misread by a single cell breaks one of those, so it fails the build.

## Colours

Yarn colours carry a `source` saying how far to trust them.

**`"pattern"` — exact.** SWW25 prints its charts three times over, once per
colourway, in the real shades, so every one of its 24 colours was read straight
out of the file. Its third colourway uses five yarns where the other two use
eight, so several slots share a shade; that is the colourway's doing, and the
mapping was derived by comparing the three pages cell by cell rather than
assumed.

**`"approximate"` — a considered stand-in.** SWW24 prints its charts in plain
greys, one per yarn slot, and leaves the colour to the materials list. That is
the model this whole site is built on, but it does mean there is no colour in
the file to read. So:

- the shade names, numbers, brands and links are exactly as published;
- the colours are stand-ins, flagged as such in the interface;
- its own greys are offered as a fourth colourway, "As printed", and those are
  exact;
- three Uradale shades (Moorit, Glansin, Flukkra) are exact, because the 2025
  pattern draws the same undyed shades in colour.

Sampling the pattern's photographs was tried and abandoned: the group shot is
dim enough that the natural-shades hat clusters to a blue-grey, which would
have been worse than saying "approximate".

Anyone knitting can set any shade to the wool actually in their hands, which is
the right answer regardless — a shade card is a photograph of wool too.
