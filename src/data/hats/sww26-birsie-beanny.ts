import { Chart, ChartCell, HatPattern, SlotId, partKey } from "./types";
import charts from "./sww26-birsie-beanny.charts.json";

/**
 * Shetland Wool Week 2026: the Birsie Beanny, by the year's patron.
 *
 * A slouchy hat with the festival's name knitted round its brim, a band of
 * Helen Robertson's silver tiaras below Liss Hols lace holes and a heart, and
 * a Tree of Life crown. Birsie means hairy: the optional toosks are the
 * tassels on the Gunnister Man's purse, by way of Shetland's tattit rugs.
 *
 * It is the first hat here whose charts are drawn in **parts** rather than in
 * yarns. Each is printed twice - once for colourways 1 and 2, once for 3 and
 * 4 - because the four reverse light and dark between the brim and the top,
 * and the two printings are cell for cell inverses of each other. So one grid
 * is stored, every cell saying only whether it is ground or motif, and each
 * chart carries a table of which yarn plays each part on each row, one per
 * pair of colourways. That keeps the knitting free of the colourway, which is
 * the arrangement everywhere else here: changing colourway recolours and
 * never rebuilds.
 *
 * The charts are pictures - JPEGs, with no vectors and no text - so they were
 * read from the pixels: the grids by sampling each cell, the marks by how much
 * of a cell differs from its own colour, and the yarn letters beside each row
 * by eye, which is what the two tables below are. Every reading has a check.
 * The two printings had to come out exact inverses, and do, cell for cell. The
 * arithmetic has to chain, and does. The brim has to spell something, and
 * spells SHETLAND WOOL WEEK 2026 with a heart either side.
 *
 * Its brim is doubled, and the pattern says how: it is "worked in the round
 * from the brim up, starting with the rib and lettering brim, followed by the
 * inside rib (which is turned inside out)", and it is worn "with brim folded
 * up". So the lettering hangs from the top of the brim down to the fold - the
 * purl round the chart draws right across row 17, which is a turning ridge
 * and nothing else - and the inside rib climbs back up within it, until "it
 * reaches the same depth". That is one fold, and the chart's own arithmetic
 * agrees with it: the decrease from 160 stitches back to 128 falls just past
 * the ridge, where the fabric has turned and wants to be smaller because it
 * is now the layer inside. See knitting/folding.ts.
 *
 * The brim is also turned twice, and only the second turn is the fold. "Turn
 * work inside out so the wrong side of the brim is facing you", says the
 * pattern at the body, which is how a brim meant to be worn up gets knitted
 * with its right side in: everything below that point goes on the other way
 * about the hat from everything above it. It is why the brim charts are drawn
 * upside down and back to front, which looked for a while like an error in
 * reading them and is not - read them the usual way, work the turn and the
 * fold, and SHETLAND WOOL WEEK comes out the right way round. Model only the
 * fold and it comes out in mirror writing. See the "turn" round in types.ts.
 *
 * It is also the one hat here knitted at two tensions at once, and says so:
 * "the brim is designed to be close-fitting while the top of the hat is
 * slouchy, therefore the tension has been measured over the number of sts of
 * the inside rib, and the number of rows have been measured over the
 * colourwork parts of the hat to check the length". One tension cannot hold
 * both, and on one this hat came out a sixth short and half again too wide,
 * because its hundred and ninety-two stitches went round a circle they never
 * had and spent on going sideways what the slouch should have spent on going
 * up. How much narrower the colourwork is the pattern says without saying it,
 * and so does how much shorter its rounds are; see tensions below.
 *
 * On the two of them it settles to fifty point two centimetres round the
 * inside brim, against the fifty the pattern prints, and twenty-seven point
 * four from the folded edge over the crown against its twenty-seven and a
 * half. Neither was fitted to: the one comes out of the rib's own tension and
 * the other out of the colourwork's.
 */

const rib = (): ChartCell[] => [
  { slot: "ground", symbol: "k1tbl" },
  { slot: "ground", symbol: "k1tbl" },
  { slot: "ground", symbol: "purl" },
  { slot: "ground", symbol: "purl" },
];
const purlRib = (): ChartCell[] => [
  { slot: "ground" },
  { slot: "ground" },
  { slot: "ground", symbol: "purl" },
  { slot: "ground", symbol: "purl" },
];
const plain = (): ChartCell[] => Array.from({ length: 4 }, () => ({ slot: "ground" as const }));

/**
 * Which yarn plays each part, row by row, read off the letters printed beside
 * every row of every chart. Colourways 1 and 2 share one set and 3 and 4 the
 * other; 3 and 4 are knitted in four yarns rather than six, which is why their
 * columns never mention E or F.
 */
const parts: Record<string, Record<string, [SlotId, SlotId][]>> = {
  Brim: {
    "1-2": [
      ["A", "A"], ["A", "B"], ["A", "A"], ["E", "F"], ["E", "F"],
      ["E", "F"], ["C", "D"], ["C", "D"], ["C", "D"], ["E", "F"],
      ["E", "F"], ["E", "F"], ["A", "A"], ["A", "B"], ["A", "A"],
      ["A", "A"], ["A", "A"], ["A", "A"],
    ],
    "3-4": [
      ["B", "B"], ["B", "A"], ["B", "B"], ["B", "A"], ["B", "A"],
      ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"],
      ["B", "A"], ["B", "A"], ["B", "B"], ["B", "A"], ["B", "B"],
      ["B", "B"], ["B", "B"], ["B", "B"],
    ],
  },
  Body: {
    "1-2": [
      ["D", "D"], ["D", "D"], ["D", "C"], ["D", "C"], ["D", "C"],
      ["D", "C"], ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"],
      ["D", "C"], ["D", "C"], ["D", "C"], ["D", "C"], ["F", "E"],
      ["F", "E"], ["F", "E"], ["F", "E"], ["B", "A"], ["B", "A"],
      ["B", "A"], ["B", "A"], ["F", "E"], ["F", "E"], ["F", "E"],
      ["F", "E"], ["D", "C"], ["D", "C"], ["D", "C"], ["D", "C"],
      ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"],
      ["B", "A"], ["B", "A"], ["D", "C"], ["D", "C"], ["D", "C"],
    ],
    "3-4": [
      ["A", "A"], ["A", "A"], ["A", "B"], ["A", "B"], ["A", "B"],
      ["A", "B"], ["A", "C"], ["A", "C"], ["A", "C"], ["A", "C"],
      ["A", "B"], ["A", "B"], ["A", "B"], ["A", "B"], ["A", "D"],
      ["A", "D"], ["A", "D"], ["A", "D"], ["A", "C"], ["A", "C"],
      ["A", "C"], ["A", "C"], ["A", "D"], ["A", "D"], ["A", "D"],
      ["A", "D"], ["A", "B"], ["A", "B"], ["A", "B"], ["A", "B"],
      ["A", "C"], ["A", "C"], ["A", "C"], ["A", "C"], ["A", "B"],
      ["A", "B"], ["A", "B"], ["A", "D"], ["A", "D"], ["A", "D"],
    ],
  },
  Crown: {
    "1-2": [
      ["D", "C"], ["D", "C"], ["F", "E"], ["F", "E"], ["F", "E"],
      ["F", "E"], ["F", "E"], ["D", "C"], ["D", "C"], ["D", "C"],
      ["D", "C"], ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"],
      ["B", "A"], ["B", "A"], ["B", "A"], ["D", "C"], ["D", "C"],
      ["D", "C"], ["D", "C"], ["F", "E"], ["F", "E"], ["F", "F"],
      ["F", "F"], ["F", "F"], ["F", "F"], ["F", "F"],
    ],
    "3-4": [
      ["A", "D"], ["A", "D"], ["A", "B"], ["A", "B"], ["A", "B"],
      ["A", "C"], ["A", "C"], ["A", "C"], ["A", "B"], ["A", "B"],
      ["A", "B"], ["A", "D"], ["A", "D"], ["A", "D"], ["A", "D"],
      ["A", "D"], ["A", "B"], ["A", "B"], ["A", "B"], ["A", "C"],
      ["A", "C"], ["A", "C"], ["A", "B"], ["A", "B"], ["A", "A"],
      ["A", "A"], ["A", "A"], ["A", "A"], ["A", "A"],
    ],
  },
  Rib: {
    "1-2": [
      ["A", "A"], ["A", "A"], ["A", "A"],
    ],
    "3-4": [
      ["B", "B"], ["B", "B"], ["B", "B"],
    ],
  },
  Hem: {
    "1-2": [
      ["A", "A"], ["A", "A"], ["A", "A"], ["A", "A"], ["E", "E"],
      ["E", "E"], ["E", "E"], ["E", "E"], ["C", "C"], ["C", "C"],
      ["C", "C"], ["C", "C"], ["C", "C"], ["C", "C"], ["C", "C"],
      ["C", "C"], ["E", "E"], ["E", "E"], ["E", "E"], ["E", "E"],
      ["A", "A"], ["A", "A"], ["A", "A"], ["A", "A"],
    ],
    "3-4": [
      ["B", "B"], ["B", "B"], ["B", "B"], ["B", "B"], ["C", "C"],
      ["C", "C"], ["C", "C"], ["C", "C"], ["D", "D"], ["D", "D"],
      ["D", "D"], ["D", "D"], ["D", "D"], ["D", "D"], ["D", "D"],
      ["D", "D"], ["C", "C"], ["C", "C"], ["C", "C"], ["C", "C"],
      ["B", "B"], ["B", "B"], ["B", "B"], ["B", "B"],
    ],
  },
};

const chartsOf = (): Chart[] => [
  // The three charted ones - the lettering, the body and the crown - are all
  // colourwork, and so all knitted on the larger needles.
  ...charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
    parts: parts[chart.id],
    fabric: "colourwork",
  })),
  {
    // "*K2 tbl, p2; rep from * to end", three rounds of it.
    id: "Rib",
    rows: [rib(), rib(), rib()],
    parts: parts.Rib,
    fabric: "rib",
  },
  {
    /*
     * The inside rib, which hangs within the brim. Twenty-four rounds of
     * *k2, p2* with a plain knit round worked on the first round of each new
     * colour, as the pattern's own note asks.
     */
    id: "Hem",
    rows: Array.from({ length: 24 }, (_, i) =>
      [5, 9, 17, 21].includes(i + 1) ? plain() : purlRib(),
    ),
    parts: parts.Hem,
    fabric: "rib",
  },
];

const sww26: HatPattern = {
  id: "sww26-birsie-beanny",
  year: 2026,
  name: "Birsie Beanny",
  designer: "Helen Robertson",
  story:
    "Shetland Wool Week is a truly unique community effort, bringing " +
    "together makers, designers, voluntary groups and local industry across " +
    "Shetland, and Helen chose to celebrate that by working the festival's " +
    "name into the brim - a wearable souvenir and a conversation starter. " +
    "The patterns above it come from different strands of her own work: the " +
    "lower motif from her silver knitted tiaras, then Liss Hols, the lace " +
    "holes her Unst granny knitted round the edge of her christening shawl, " +
    "then a heart adapted from her Mariner's Compass Hat, and a crown taken " +
    "from the lace Tree of Life. The slouch is from the hat in Stanley " +
    "Cursiter's The Fair Isle Jumper of 1923, and the optional toosks - " +
    "birsie means hairy - are the tassels on the Gunnister Man's purse.",
  patternUrl: "https://payhip.com/b/Zozyp",
  credit: "© Helen Robertson",
  hashtag: "#BirsieBeanny",
  // The stitches as this pattern's own abbreviations define them.
  stitchNotes: {
    k1tbl: { abbreviation: "k tbl", how: "Knit the stitch through the back loop." },
    m1: {
      lean: "left",
      how:
        "Pick up the bar between stitches with the left needle from front " +
        "to back, and knit it through the back of the loop.",
    },
    k2tog: { how: "Knit 2 stitches together as if they are one stitch." },
    s2kp: {
      how:
        "Slip 2 stitches together as if to knit, knit 1 in the shade shown, " +
        "then pass both slipped stitches over.",
    },
  },
  slots: ["A", "B", "C", "D", "E", "F"],

  sizes: [
    {
      id: "small",
      label: "Small",
      toFitCm: 47.5,
      circumferenceCm: 46,
      lengthCm: 26,
      // Stitches over the inside rib and rounds over the colourwork, which is
      // how this pattern measures: the brim is close-fitting and the top is
      // slouchy, so one tension will not do for both.
      stitchesPer10cm: 28,
      roundsPer10cm: 35,
      needlesMm: 2.5,
      ribNeedlesMm: 2.25,
    },
    {
      id: "medium",
      label: "Medium",
      toFitCm: 51.5,
      circumferenceCm: 50,
      lengthCm: 27.5,
      stitchesPer10cm: 24,
      roundsPer10cm: 33.5,
      needlesMm: 2.75,
      ribNeedlesMm: 2.25,
    },
    {
      id: "large",
      label: "Large",
      toFitCm: 57.5,
      circumferenceCm: 54,
      lengthCm: 29,
      stitchesPer10cm: 22,
      roundsPer10cm: 32,
      needlesMm: 3,
      ribNeedlesMm: 2.5,
    },
  ],

  colourways: [
    {
      id: "sea-anemone",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Sea Anemone",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      part: "1-2",
      shades: [
        { slot: "A", name: "Port Wine", code: "293", hex: "#382229", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-293" },
        { slot: "B", name: "Cloud", code: "764", hex: "#b6d2d5", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-764" },
        { slot: "C", name: "Pacific", code: "763", hex: "#576375", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-763" },
        { slot: "D", name: "Orchid", code: "547", hex: "#d1c0c0", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-547" },
        { slot: "E", name: "Gentian", code: "710", hex: "#302f4f", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-710" },
        { slot: "F", name: "Lilac", code: "620", hex: "#bbb3c4", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-620" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "funky",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Funky",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      part: "1-2",
      shades: [
        { slot: "A", name: "Dark Purple Mix", code: "FC14", hex: "#443f4d",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc14" },
        { slot: "B", name: "Salmon Pink", code: "9144", hex: "#cb5246", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-9144" },
        { slot: "C", name: "Aubergine", code: "134", hex: "#9e4463", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-134" },
        { slot: "D", name: "Bright Orange", code: "73", hex: "#d54400", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-73" },
        { slot: "E", name: "Dark Red Mix", code: "FC13", hex: "#351818", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-fc13" },
        { slot: "F", name: "Bright Turquoise", code: "71", hex: "#4cd9cc",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-71" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "heddery-hills",
      wool: "uradale-yarns-2ply-jumper-weight",
      name: "Heddery Hills",
      brand: "Uradale Yarns",
      yarn: "2ply Jumper Weight",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      part: "3-4",
      shades: [
        { slot: "A", name: "Clover Heath", hex: "#6eaf89", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-clover-heath" },
        { slot: "B", name: "Sea Pink Heath", hex: "#edbee0", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-sea-pink-heath" },
        { slot: "C", name: "Meadowsweet", hex: "#fdde9a", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-meadowsweet" },
        { slot: "D", name: "Moss", hex: "#d1d67c", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-moss" },
      ],
      // Official 2026 errata: Heddery Hills needs two balls of Yarn B.
      // https://shop.shetlandwoolweek.com/products/birsie-beanny-shetland-wool-week-2026-paper-copy
      balls: { A: 2, B: 2, C: 1, D: 1 },
    },
    {
      id: "nostalgia",
      name: "Nostalgia",
      brand: "Foula Wool",
      yarn: "2ply",
      url: "https://www.foulawool.co.uk",
      ballMetres: 89,
      ballGrams: 25,
      part: "3-4",
      shades: [
        { slot: "A", name: "Shetland Black", hex: "#2e2a28", source: "approximate" },
        { slot: "B", name: "Grey", hex: "#8d8b86", source: "approximate" },
        { slot: "C", name: "Natural White", hex: "#efe9dd", source: "approximate" },
        { slot: "D", name: "Moiget", hex: "#c8a35e", source: "approximate" },
      ],
      balls: { A: 2, B: 2, C: 1, D: 1 },
    },
  ],

  charts: chartsOf(),

  /*
   * Two fabrics, and the pattern prints half of each: its stitch tension is
   * measured over the inside rib and its round tension over the colourwork.
   * So a ribbed stitch is a stitch wide and a colourwork round a round tall,
   * by definition, and the pattern gives the other two without stating them.
   *
   * How wide a colourwork stitch is comes from the shaping. 128 ribbed
   * stitches and 160 colourwork ones go round the same brim - that is what
   * the increase above the rib and the decrease below the hem are for,
   * neither of which changes how big the brim is - so 160 colourwork stitches
   * are as wide as 128 ribbed ones. Which then makes the body 192 of them: a
   * fifth wider than the brim rather than half again, and that fifth is the
   * slouch.
   *
   * How tall a ribbed round is comes from the note under the inside rib: "If
   * the rib is falling short of the top brim, continue ribbing until it
   * reaches the same depth." The two sides of the fold are that same depth,
   * then - four ribbed rounds and nineteen colourwork ones down the outside,
   * twenty-six and one back up the inside - and one ratio satisfies that:
   * eighteen colourwork rounds to twenty-two ribbed ones. Which is about
   * forty-one rounds to ten centimetres of rib against the colourwork's
   * thirty-three and a half, and finer needles do that.
   */
  tensions: {
    rib: { stitch: 1, round: 9 / 11 },
    colourwork: { stitch: 128 / 160, round: 1 },
  },

  sections: [
    {
      label: "Brim",
      rounds: [
        // The top of the brim, not the bottom: this edge ends up level with
        // the body, and the lettering hangs below it.
        {
          type: "castOn",
          count: 128,
          slot: partKey("Rib", 1, "ground"),
          fabric: "rib",
        },
        { type: "chart", chart: "Rib", rows: [1, 3], repeats: 32 },
        {
          type: "rounds",
          count: 1,
          slot: partKey("Rib", 3, "ground"),
          fabric: "rib",
        },
        {
          // "Inc Round: K2, m1, [k4, m1] x 31, k2. 160 sts."
          // Thirty-two more stitches and not a millimetre more brim: this is
          // the change of fabric, not a change of size.
          type: "shaping",
          slot: partKey("Rib", 3, "ground"),
          to: 160,
          fabric: "colourwork",
          ops: [
            { work: "k", times: 2 },
            { work: "m1" },
            { repeat: [{ work: "k", times: 4 }, { work: "m1" }], times: 31 },
            { work: "k", times: 2 },
          ],
        },
        {
          type: "rounds",
          count: 1,
          slot: partKey("Rib", 3, "ground"),
          fabric: "colourwork",
        },
      ],
    },
    {
      label: "Lettering",
      // One hundred and sixty stitches of it, worked once: the brim spells
      // the festival's name, so it does not repeat.
      rounds: [
        { type: "chart", chart: "Brim", rows: [1, 17], repeats: 1 },
        // The one place the fabric turns, and the chart says where: row 17 is
        // drawn purl right the way round, which is a turning ridge and
        // nothing else. Everything above is knitted downwards to here;
        // everything below it climbs back up inside.
        { type: "fold" },
        { type: "chart", chart: "Brim", rows: [18, 18], repeats: 1 },
        {
          // "Dec round: [K3, k2tog] x 32. 128 sts."
          // The change of fabric again, the other way about, and again the
          // brim does not change size for it.
          type: "shaping",
          slot: partKey("Brim", 18, "ground"),
          to: 128,
          fabric: "rib",
          ops: [
            {
              repeat: [{ work: "k", times: 3 }, { work: "k2tog" }],
              times: 32,
            },
          ],
        },
        {
          type: "rounds",
          count: 1,
          slot: partKey("Brim", 18, "ground"),
          fabric: "rib",
        },
      ],
    },
    {
      label: "Inside rib",
      rounds: [
        { type: "chart", chart: "Hem", rows: [1, 24], repeats: 32 },
      ],
    },
    {
      label: "Body",
      rounds: [
        // "Turn work inside out so the wrong side of the brim is facing you."
        // Everything below this goes on the other way about the hat - which
        // is why the brim charts are drawn upside down and back to front, and
        // why the name comes out the right way round once the brim is up.
        { type: "turn" },
        {
          type: "rounds",
          count: 1,
          slot: partKey("Hem", 24, "ground"),
          fabric: "rib",
        },
        {
          // "Inc round: K1, m1, [K2, m1] x 63, k1. 192 sts."
          type: "shaping",
          slot: partKey("Hem", 24, "ground"),
          to: 192,
          fabric: "colourwork",
          ops: [
            { work: "k", times: 1 },
            { work: "m1" },
            { repeat: [{ work: "k", times: 2 }, { work: "m1" }], times: 63 },
            { work: "k", times: 1 },
          ],
        },
        { type: "chart", chart: "Body", rows: [1, 40], repeats: 6 },
      ],
    },
    {
      label: "Crown",
      rounds: [{ type: "chart", chart: "Crown", rows: [1, 29], repeats: 6 }],
    },
  ],
};

export default sww26;
