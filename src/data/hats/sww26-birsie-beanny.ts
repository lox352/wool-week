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
 * Its brim is worn turned up, with the inside rib hanging within it, so the
 * fabric turns twice: once at the top of the lettering and once at the foot of
 * the hem, where the body sets off. See knitting/folding.ts.
 *
 * It is the one hat here that comes out shorter on screen than the tape says,
 * and the reason is the slouch. The pattern's two tensions are measured over
 * two different fabrics - stitches over the close-fitting inside rib, rounds
 * over the colourwork - because no single one would describe both, and the
 * model has only one stitch width to give. So its hundred and ninety-two
 * stitches go round a wider circle than the wool would, and the length that a
 * slouchy hat gets by draping it spends on going sideways instead. The
 * knitting is right; the posture is a little squat.
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
      ["A", "A"], ["A", "A"], ["A", "A"], ["A", "A"], ["A", "B"],
      ["A", "A"], ["E", "F"], ["E", "F"], ["E", "F"], ["C", "D"],
      ["C", "D"], ["C", "D"], ["E", "F"], ["E", "F"], ["E", "F"],
      ["A", "A"], ["A", "B"], ["A", "A"],
    ],
    "3-4": [
      ["B", "B"], ["B", "B"], ["B", "B"], ["B", "B"], ["B", "A"],
      ["B", "B"], ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"],
      ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"], ["B", "A"],
      ["B", "B"], ["B", "A"], ["B", "B"],
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
  ...charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
    parts: parts[chart.id],
  })),
  {
    // "*K2 tbl, p2; rep from * to end", three rounds of it.
    id: "Rib",
    rows: [rib(), rib(), rib()],
    parts: parts.Rib,
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
  patternUrl: "https://www.shetlandwoolweek.com/",
  credit: "© Helen Robertson",
  hashtag: "#BirsieBeanny",
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
      name: "Sea Anemone",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      part: "1-2",
      shades: [
        { slot: "A", name: "Port Wine", code: "293", hex: "#6b2737", source: "approximate" },
        { slot: "B", name: "Cloud", code: "764", hex: "#cfd4d8", source: "approximate" },
        { slot: "C", name: "Pacific", code: "763", hex: "#3f6d9e", source: "approximate" },
        { slot: "D", name: "Orchid", code: "547", hex: "#9c6f9e", source: "approximate" },
        { slot: "E", name: "Gentian", code: "710", hex: "#3a4f84", source: "approximate" },
        { slot: "F", name: "Lilac", code: "620", hex: "#b9a8c8", source: "approximate" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "funky",
      name: "Funky",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      part: "1-2",
      shades: [
        { slot: "A", name: "Dark Purple Mix", code: "FC14", hex: "#3d2b3f", source: "approximate" },
        { slot: "B", name: "Salmon Pink", code: "9144", hex: "#e0857a", source: "approximate" },
        { slot: "C", name: "Aubergine", code: "134", hex: "#4a2639", source: "approximate" },
        { slot: "D", name: "Bright Orange", code: "73", hex: "#e2701f", source: "approximate" },
        { slot: "E", name: "Dark Red Mix", code: "FC13", hex: "#6e2229", source: "approximate" },
        { slot: "F", name: "Bright Turquoise", code: "71", hex: "#2fa5ae", source: "approximate" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "heddery-hills",
      name: "Heddery Hills",
      brand: "Uradale Yarns",
      yarn: "2ply Jumper Weight",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      part: "3-4",
      shades: [
        { slot: "A", name: "Clover Heath", hex: "#6d4f63", source: "approximate" },
        { slot: "B", name: "Seapink Heath", hex: "#c98ea0", source: "approximate" },
        { slot: "C", name: "Meadowsweet", hex: "#e6e0cf", source: "approximate" },
        { slot: "D", name: "Moss", hex: "#6b7340", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1 },
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

  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 128, slot: partKey("Rib", 1, "ground") },
        { type: "chart", chart: "Rib", rows: [1, 3], repeats: 32 },
        { type: "rounds", count: 1, slot: partKey("Rib", 3, "ground") },
        {
          // "Inc Round: K2, m1, [k4, m1] x 31, k2. 160 sts."
          type: "shaping",
          slot: partKey("Rib", 3, "ground"),
          to: 160,
          ops: [
            { work: "k", times: 2 },
            { work: "m1" },
            { repeat: [{ work: "k", times: 4 }, { work: "m1" }], times: 31 },
            { work: "k", times: 2 },
          ],
        },
        { type: "rounds", count: 1, slot: partKey("Rib", 3, "ground") },
      ],
    },
    {
      label: "Lettering",
      // One hundred and sixty stitches of it, worked once: the brim spells
      // the festival's name, so it does not repeat.
      rounds: [
        { type: "chart", chart: "Brim", rows: [1, 18], repeats: 1 },
        {
          // "Dec round: [K3, k2tog] x 32. 128 sts."
          type: "shaping",
          slot: partKey("Brim", 18, "ground"),
          to: 128,
          ops: [
            {
              repeat: [{ work: "k", times: 3 }, { work: "k2tog" }],
              times: 32,
            },
          ],
        },
        { type: "rounds", count: 1, slot: partKey("Brim", 18, "ground") },
        // The brim is worn turned up: the fabric folds here and the inside
        // rib hangs down within it.
        { type: "fold" },
      ],
    },
    {
      label: "Inside rib",
      rounds: [
        { type: "chart", chart: "Hem", rows: [1, 24], repeats: 32 },
        // And turns back up here, where the body sets off.
        { type: "fold" },
      ],
    },
    {
      label: "Body",
      rounds: [
        { type: "rounds", count: 1, slot: partKey("Hem", 24, "ground") },
        {
          // "Inc round: K1, m1, [K2, m1] x 63, k1. 192 sts."
          type: "shaping",
          slot: partKey("Hem", 24, "ground"),
          to: 192,
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
