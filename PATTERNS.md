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

The command that produced each file, so any of them can be checked against
its source:

```sh
# SWW25, Aal Ower Toorie - the key names itself on the page.
python3 scripts/extract_chart.py SWW25.pdf --page 5 --vector 0 \
    --charts A:18x16 B:16x16 --out src/data/hats/sww25-aal-ower-toorie.charts.json

# SWW24, Islesburgh Toorie - two chart pages, one key, named by hand.
python3 scripts/extract_chart.py SWW24.pdf --page 6 --vector 0 \
    --key knit purl s2kp A B C D E \
    --charts A:4x9 B:8x11 D:8x12 --out .../sww24-v0.json
python3 scripts/extract_chart.py SWW24.pdf --page 7 --vector 1 \
    --key-page 6 --key-vector 0 --key knit purl s2kp A B C D E \
    --charts C:20x15 E:24x23 --out .../sww24-v1.json

# SWW21, Da Crofter's Kep - all three charts and the key on one page,
# with the body chart set beside the crown chart.
python3 scripts/extract_chart.py SWW21.pdf --page 4 --vector 0 \
    --key knit purl A B C D E F k2tog sk2p \
    --charts A:4x10 B:24x35 C:24x23 \
    --out src/data/hats/sww21-da-crofters-kep.charts.json

# SWW22, Bonnie Isle Hat - two chart pages with a different key on each.
python3 scripts/extract_chart.py SWW22.pdf --page 6 --vector 0 \
    --key knit purl A B C D E \
    --charts A:10x13 B:12x14 C:13x13 --out .../p6.json
python3 scripts/extract_chart.py SWW22.pdf --page 7 --vector 1 \
    --key knit k2tog sk2p A B C D E \
    --charts D:12x14 E:16x19 --out .../p7.json

# SWW15, the Baa-ble Hat - one chart, set as a word-processor table.
python3 scripts/extract_chart.py SWW15.pdf --page 3 --vector 0 --ruled \
    --key A B C D k2tog \
    --charts A:60x45 --out src/data/hats/sww15-baa-ble-hat.charts.json

# SWW18, Merrie Dancers Toorie - charts drawn as outlines, with the yarn
# printed as a number in each cell.
python3 scripts/extract_chart.py SWW18.pdf --page 3 --vector all \
    --cell 6.615 --marks --key A A/purl B C D E A/s2kp E/s2kp \
    --charts B:12x34 A:4x12 C:24x21 \
    --out src/data/hats/sww18-merrie-dancers-toorie.charts.json
```

Where a pattern's charts are split across pages, the pieces are merged into
one file by hand; `--key-page` and `--key-vector` point at the key when it is
not on the same page as the charts.

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

### Charts set as a table

2015's is the odd one out, and `--ruled` is for it. It was laid out in a word
processor rather than a page layout program, and a word processor draws a
table, not a chart:

- **Shading comes in runs.** Eleven white stitches in a row are one rectangle
  eleven cells wide, and two rows the same are one rectangle two cells tall.
  Only a stitch that breaks a run is drawn on its own.
- **A default cell is not drawn at all.** Whole runs of white stitches through
  the middle of the sheep are simply absent from the page's drawing.
- **There are no gutters.** Every cell of every row is part of the table to
  the very top, and the staircase down the crown is drawn by taking the
  *borders* off the cells that are not stitches. Read from the shading alone
  the crown comes out sixty stitches wide all the way up.

So under `--ruled` the rules say which cells a knitter works and the shading is
asked only what colour each one is. A stitch is a cell with a line above it and
a line below it: the line above gives a row its extent, since that is the one a
row draws for itself, and wanting the line below as well is what tells a row of
stitches from the empty row a table is apt to end with. The column of row
numbers is ruled exactly like the rest and is dropped because nothing in it is
ever shaded.

Two smaller things came from the same page. A key set into the same table as
its chart is not separable by position, so its swatches are found by being
boxed in on their own - the line down each side is one cell tall, where a
chart's verticals run the height of the whole grid. And one cell of this chart
is shaded 15% grey where its neighbours are 25%; a shade plainly nearer one
yarn than any other is read as that yarn, with a note, and one that could be
either is still an error.

### Charts that name their yarns rather than colouring them

2018's charts are not shaded at all, and `--marks` is for them. Every cell is
paper; what is printed in it says both which yarn and what to do with it:
nothing for the main colour knitted plain, a dot for a purl, a number for one
of the four contrast yarns, a chevron for a centred decrease. So a key entry
names a yarn and, where it is not a plain knit, a stitch: `A`, `A/purl`,
`E/s2kp`.

- **The numbers are read as text**, from the page's own characters rather than
  from a picture of them. Marks can be told apart by looking: a dot, a chevron
  and a shaded chevron are nothing like each other. Numbers cannot - a 2 and a
  3 differ by seven squares of a nine by nine bitmap - and a chart that a
  knitter follows is not the place to take that chance. A swatch in the key
  with a number in it is what teaches the extractor which number is which
  yarn, so the page still names its own palette.
- **The cells come from the outlines.** With nothing shaded there is no
  rectangle per cell, so `--cell` gives the size of one and the charts are the
  shapes filled on that grid: two plain oblongs and, for the crown, a single
  staircase drawn as one rectilinear polygon. Where the staircase steps in is
  where a decrease is. A shape counts as a chart only if it is the size of one
  the command line is expecting, which is what keeps the panel the whole page
  is printed on out of it.
- **`--vector all`** glues the page back together. This leaflet has been
  through something that split it into eight hundred streams, one per grid
  line, and no single one of them holds a chart.

Its two sizes are not the same knitting - a DK version over 108 stitches and a
4ply one over 120, with different chart repeats - and the site builds one hat
per pattern, so it builds the 4ply. The hat's own file says so.

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
- **Bonnie Isle Hat** — cast on 140, 156 after the increase round, 128 after
  the decrease round, 8 at the crown.
- **Da Crofter's Kep** — cast on 136, 168 after the increase round, 144 after
  the crown chart's own first row, 12 at the crown.

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
