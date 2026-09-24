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

# SWW23, Buggiflooer Beanie - the five charts are embedded raster images.
# Its dedicated extractor reads the cell fills, purl dots and CDD triangles.
python3 scripts/extract_sww23.py SWW23.pdf \\
    --out src/data/hats/sww23-buggiflooer-beanie.charts.json

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

# SWW20, Katie's Kep - the same leaflet design as SWW21, with a key set as
# two interleaved columns: a yarn, then a symbol, then the next yarn.
python3 scripts/extract_chart.py SWW20.pdf --page 3 --vector 0 \
    --key A knit B purl C k2tog D sk2p E \
    --charts A:4x8 B:24x40 C:24x23 \
    --out src/data/hats/sww20-katies-kep.charts.json

# SWW19, Roadside Beanie - PyMuPDF reads the vector cells and marks directly.
# The symbol key is unfilled, and the crown's decrease column is detached.
python3 scripts/extract_sww19.py SWW19.pdf \
    --out src/data/hats/sww19-roadside-beanie.charts.json

# SWW18, Merrie Dancers Toorie - charts drawn as outlines, with the yarn
# printed as a number in each cell.
python3 scripts/extract_chart.py SWW18.pdf --page 3 --vector all \
    --cell 6.615 --marks --key A A/purl B C D E A/s2kp E/s2kp \
    --charts B:12x34 A:4x12 C:24x21 \
    --out src/data/hats/sww18-merrie-dancers-toorie.charts.json

# SWW17, Bousta Beanie - vector-filled cells, but some crown decrease slashes
# only survive reliably in the rendered page, so the dedicated extractor uses
# vectors for yarns and pixels for those marks.
python3 scripts/extract_sww17.py SWW17.pdf \
    --out src/data/hats/sww17-bousta-beanie.charts.json

# SWW16, Crofthoose Hat - the body chart is printed four times, once in each
# colourway. The dedicated extractor maps all four back to A-E and requires
# every cell and purl mark to agree before reading the separate crown chart.
python3 scripts/extract_sww16.py SWW16.pdf \
    --out src/data/hats/sww16-crofthoose-hat.charts.json

# SWW14, Shwook Hat - A/B/C are table grids and D is a red-outlined crown
# staircase. Its A-E key and row-by-row dark/light tables are on the same page;
# the CDD glyphs survive as PDF text and are read directly.
python3 scripts/extract_sww14.py SWW14.pdf \
    --out src/data/hats/sww14-shwook-hat.charts.json
```

2023 and 2026 have charts embedded as pictures rather than PDF drawings.
2023's dedicated extractor is listed above; 2026's did not come out of this
tool at all - see below.

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

### Charts printed on a tinted panel

A panel is one big rectangle, and a rectangle read as a run of cells - which
is what a word processor's shading has to be, above - comes out as thousands
of stitches covering the whole page. On SWW20's page that buried every swatch
in the key, and the same design in SWW21 had stopped extracting for the same
reason.

So runs are read only where the chart is a table, which is what `--ruled`
already meant; everywhere else a page-layout program draws each cell on its
own and the one big rectangle is the panel. A key swatch is never a run under
either rule, because a swatch stands for one yarn and is one cell.

Every chart already committed still comes out of the tool cell for cell after
that change - all nineteen of them, which is what the commands above are for.

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

Both yarn weights are supported: DK (YW1) casts on 108, omits rib-chart rows
6 and 12, increases to 132, works eleven body repeats, then decreases to 120.
4ply (YW2) retains its existing 120 → 144 → 120 sequence. Both finish with
five crown repeats and ten live stitches. Size-filtered colourways prevent
offering fingering-weight yarn as the DK materials. DK display colours are
explicitly approximate, not claimed to be DK catalogue samples. The YW1
length is estimated from 70 worked rounds at 27 rounds per 10cm.

### Charts that are pictures

2026's are JPEGs. There are no vectors on those pages and no text either, so
`extract_chart.py` has nothing to read and was not used: the grids were sampled
from the rendered pages instead, cell by cell, and the marks from how much of a
cell differs from its own colour. What makes that safe to commit is that this
pattern checks itself four ways over.

- **Each chart is printed twice**, once for colourways 1-2 and once for 3-4,
  because the four reverse light and dark between the brim and the top of the
  hat. The two printings have to be cell-for-cell inverses of each other, and
  are - all 1,280 cells of the body, every one.
- **The arithmetic has to chain**, and does: 160 through the lettering, 32 to
  32 through the body, 32 to 2 over the crown's staircase on fifteen centred
  decreases, one on each odd row, each read as ink on the page rather than
  inferred from the shape.
- **The brim has to spell something.** It spells SHETLAND WOOL WEEK 2026, with
  a heart either side, which is a stiff test of a 160 by 18 grid read out of a
  picture rotated on its side and broken across two columns.
- **The yarn letters printed beside every row** - `A / D`, `B / A` - were read
  by eye and transcribed into the hat's own file. Colourways 3 and 4 are
  knitted in four yarns where 1 and 2 use six, and their columns never mention
  E or F, which is a check on the transcription rather than a coincidence.

Because the two printings are inverses, only one grid is stored. Every cell
says whether it is ground or motif, and each chart carries a table of which
yarn plays each part on each row, one per pair of colourways. That is why the
knitting stays free of the colourway even here: changing colourway recolours
and never rebuilds.

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
- **Katie's Kep** — the same four: cast on 136, 168, 144 on the crown chart's
  first row, 12 at the crown. Its charts carry no colour, only five greys, so
  they are checked a second way: every row prints its contrast yarn as a
  letter down the right-hand edge, and all seventy-one rows of the three
  charts agree with the greys the extractor read. Two of them are named in the
  written instructions as well - "join in yarn B" at chart A, "join in yarn D"
  at chart C - which anchors the letters to prose.
- **Bousta Beanie** — cast on 120, 144 after the rib increase, 132 after crown
  row 1, 72 after crown row 10, then 48, 24 and 12. The crown repeat is also
  checked row by row: its visible widths are 11, 11, 10, 10, 9, 9, 8, 8, 6,
  6 and its decrease marks consume exactly the preceding row.
- **Crofthoose Hat** — cast on 120, increase to 168 on chart row 9, decrease
  to 144 on crown row 1, then 132, 120, 108, 96, 84, 72, 60, 48, 36, 24 and
  12 through the eleven centred double decreases before the final 6.
- **Shwook Hat** — its sizes are different knitting, not just different
  needles. Size 1 checks 112 → 140 → 138 → 120 → 112 and Chart D down to
  14 → 7; Sizes 2 and 3 check 134 → 168 → 144 → 128 and Chart D down to
  16 → 8. Their chart sequences are also asserted: B, A, C, D for Size 1 and
  A, B, A, C, D for Sizes 2 and 3.

A chart misread by a single cell breaks one of those, so it fails the build.

## Colours

### Shwook Hat (2014) source checks

Shwook is the first hat here whose selectable sizes are not the same knitting.
Size 1 deliberately starts with Chart B and uses fewer stitches; Sizes 2 and 3
use A, B, A, C, D. A Size may therefore carry its own round script, and settled
geometry is keyed by size where that happens. Existing hats keep their old
single script and single settled file.

Page 4 is read three ways. A/B/C are sampled on their printed grid and mapped
through the page's own A-E key. The printed dark/light yarn table independently
limits which letters may occur in every row. Chart D's active cells are its
red-outlined staircase, while its seven centred double decreases are read from
the PDF's actual `/|\\` text glyphs and then checked by stitch consumption:
16 → 14 → 14 → 12 → ... → 2 per repeat. The written size counts multiply that
out independently.

The source itself has three inconsistencies, and they are documented rather
than silently erased. Its page-1 size table says Size 3 uses a 3.25mm main
needle, while page 2 specifies 3.50mm and gives the Size-3 tension on 3.50mm;
the detailed 3.50mm specification is used. Chart D's count table twice prints
`42 (38:48)`, where its own chart and surrounding counts require
`42 (48:48)`. And the generic finishing paragraph says to thread through
eight stitches even though the immediately preceding size-specific count is
7 (8:8). The engine keeps 7 for Size 1 and 8 for Sizes 2/3.

The displayed circumference is labelled **Unstretched rib circumference**
because that is what Hazel Tindall measures; it is not relabelled as a
finished body circumference. All thirty commercial shade slots in the three
Jamieson & Smith and three Jamieson's versions resolve to exact yarn-library
entries. The historical organic option is kept in both alternatives the
leaflet permits for Yarn B — fawn and silver — and remains approximate rather
than being silently mapped to a current producer.

### Crofthoose Hat (2016) source checks

The main 12 × 41 chart is unusually well self-checking: the PDF prints it four
times, once for every sample colourway. The dedicated extractor learns A-E
from each printing separately and requires all 492 cells plus the 48
corrugated-rib purl marks to agree across all four copies. The crown is a
second 24-column chart: its visible widths step 24 → 22 → 22 → 20 → ... → 2,
and eleven CDD marks consume exactly the preceding row. The written counts
then independently reconcile 120 → 168 → 144 → 12 → 6.

The leaflet gives a 22-inch head size and a gauge, but not finished hat
measurements. The site's 64.6cm body circumference is therefore the pattern's
168 stitches at 26 sts/10cm, and its 24.6cm length is the 64 worked rounds at
26 rounds/10cm. They are arithmetic consequences of the printed pattern, not
extra measurements supplied by the designer.

Jamieson & Smith and Jamieson's shades match current library entries.
Shetland Organics was a separate historical producer, and the fourth sample is
a one-off naturally dyed set referenced to Spindrift Crafts; neither can be
honestly mapped onto a current catalogue. Their printed names are retained
with display colours sampled from their own chart printings and marked
`source: "approximate"`.

### Roadside Beanie (2019) source checks

All six charts are read from page 3's vector paths, bottom to top and right
to left. Duplicate painted cells are deduplicated only when their content
agrees. Purl dots and decrease strokes are read as paths, including the
crown's detached left column. The 28 purls and 19 single decreases match the
printed charts. `src/knitting/roadside.test.ts` checks the published counts
132 → 168 → 140 → 7, the chart boundaries, and all four colourways.

The leaflet credits Oliver Henry's theme, Sandra Manson's design and knitting,
and Ella Gordon's charting. These credits are retained. Its finished
circumference (58.5cm) and gauge (32 sts/10cm) are retained as printed even
though 168 stitches at that gauge imply 52.5cm. It gives no numeric head
measurement, so the size is labelled Medium adult without inventing one.

Uradale's historic names "Forget-me-not" and "Sea Pink" cannot be uniquely
matched to the current Heath/Meal catalogue names. They retain their printed
names with approximate display colours. Foula shades also remain approximate,
consistent with the other hats; the remaining 19 shades use the yarn library.

### Shared yarn catalogue

Every shade on the site comes out of one place: `src/data/yarns`, a library of
998 shades from the five Shetland spinners these patterns are written in -
Jamieson's of Shetland, Jamieson & Smith, Uradale, Laxdale and Aister 'oo' -
read off their own shops, with a colour, a shade number and a link to buy it.

A hat's shade names it by id and copies its name, number and colour inline, so
that drawing a hat never loads the library; `src/data/yarns/yarns.test.ts`
checks every copy against the original, and that no two hats give the same wool
two different colours. That last one is the point of the library. Before it,
every colourway had been guessed at on its own, and Uradale's Graeff was three
different colours in three different hats.

The colours are estimates sampled from the spinners' product photographs -
the best anyone outside a dye house has - and then corrected. A photograph of
a ball of wool is partly the shadow between its strands, so a raw sample comes
out darker than the wool, and unevenly: Jamieson's Spindrift photographs are
lit well and Jamieson & Smith's Shetland Aran Worsted are not, badly enough
that its Optic White sampled as a mid brown and the Baa-ble Hat's second
colourway drew as a beige sheep on a near-black sky.

The correction is a lightness one that leaves the hue alone, and it holds up
against the shades whose colour their name already gives: across the library
it lifts shades named white from a mean luminance of 182 to 221, leaves shades
named black at 62, and moves mean saturation by three thousandths. The palette
keeps the raw sample alongside it, so the two can always be compared.

The library also names shades the way the shop does - the 2025 pattern's
"Shade 96" is Pale Lemon - and building it caught real errors, among them a
Jamieson & Smith dark red that had been recorded as an orange.

Not every historical sample can be tied to a current catalogue. Foula Wool,
the 2021 handspun, 2016's discontinued Shetland Organics range and its one-off
naturally dyed Spindrift Crafts sample therefore keep considered stand-ins, as
do the two ambiguous historic Uradale names in Roadside Beanie. Those shades
carry `source: "approximate"`; all positively matched shades carry
`source: "library"`.

A better reading of the colours can be dropped in without redoing any of that:

```
python3 scripts/refresh_yarns.py CATALOGUE.json [PALETTE.json]
```

rewrites the library and re-copies every hat's name, number and colour out of
it. The hard part - deciding that "Shade 96" is Pale Lemon, that a "Grall" was
a mistyped Graeff, that 2021 works one yarn in Shetland Supreme and five in
ordinary 2ply - was done once against the printed pages and is recorded in the
hat files as a wool id, so a new set of colours never touches it. Running it
against the catalogue already committed leaves no diff at all.

Sampling the patterns' own photographs was tried and abandoned: the group shots
are dim enough that a natural-shades hat clusters to a blue-grey.

Anyone knitting can set any shade to the wool actually in their hands, which is
the right answer regardless — a shade card is a photograph of wool too.
