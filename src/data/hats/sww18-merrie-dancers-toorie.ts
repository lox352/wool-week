import { Chart, HatPattern, Section } from "./types";
import charts from "./sww18-merrie-dancers-toorie.charts.json";

/**
 * Shetland Wool Week 2018: the Merrie Dancers Toorie.
 *
 * Elizabeth Johnston's copy of a fisherman's kep of about 1950, in the
 * Shetland Museum's Boat Hall, knitted by an old woman from Yell who
 * remembered the patterns her family's menfolk wore to the far haaf.
 *
 * Its charts are the reason the extractor can read a page's text. They are
 * not shaded: every cell is paper, and a number printed in it says which
 * yarn - 1, 2, 3 or 4 - with a dot for a purl, a chevron for a centred
 * decrease and nothing at all for the main colour. The numbers are read from
 * the page's own text rather than from a picture of it, because a 2 and a 3
 * differ by seven squares of a nine by nine bitmap and that is not a distance
 * to trust a knitter's chart to. The cells themselves come from the outlines
 * the charts are drawn as: the crown is one filled staircase, and where it
 * steps in is where a decrease is. See PATTERNS.md, and --marks.
 *
 * **This is the pattern's Yarn Weight 2**, and the only one of these hats
 * whose sizes are not the same knitting. The leaflet gives two: a DK version
 * cast on over 108 stitches and a 4ply one over 120, with different chart
 * repeats and different increase rounds. The site builds one hat per pattern,
 * so it builds the 4ply - Jamieson & Smith Jumper weight, Jamieson's
 * Spindrift, Uradale Jumper weight - and says so here rather than pretending
 * a knitter could pick either. The Shetland Handspun kit the designer sells
 * is the DK version and so is not offered as a colourway.
 */

const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

// YW1, pages 2–3: omit chart A rows 6 and 12; the common plain
// rounds after the increases/decreases apply to both weights.
const dkSections: Section[] = [
  { label: "Rib", rounds: [
    { type: "castOn", count: 108, slot: "A" },
    { type: "rounds", count: 1, slot: "A", sequence: ["k", "k", "p", "p"] },
    { type: "chart", chart: "A", rows: [1, 5], repeats: 27 },
    { type: "chart", chart: "A", rows: [7, 11], repeats: 27 },
    { type: "shaping", slot: "A", to: 132, ops: [
      { work: "k", times: 6 }, { work: "kfb" },
      { repeat: [{ work: "k", times: 3 }, { work: "kfb" }], untilRemaining: 13 },
      { work: "k", times: 7 }, { work: "kfb" }, { work: "k", times: 5 },
    ] },
    { type: "rounds", count: 1, slot: "A" },
  ] },
  { label: "Body", rounds: [{ type: "chart", chart: "B", rows: [1, 34], repeats: 11 }] },
  { label: "Crown", rounds: [
    { type: "shaping", slot: "A", to: 120, ops: [
      { repeat: [{ work: "k", times: 9 }, { work: "k2tog" }], times: 12 },
    ] },
    { type: "rounds", count: 1, slot: "A" },
    { type: "chart", chart: "C", rows: [1, 21], repeats: 5 },
  ] },
];

const sww18: HatPattern = {
  id: "sww18-merrie-dancers-toorie",
  year: 2018,
  name: "Merrie Dancers Toorie",
  designer: "Elizabeth Johnston",
  story:
    "My Merrie Dancers Toorie is based on a fisherman's kep on display in " +
    "the Shetland Museum and Archives' Boat Hall. It was knitted about 1950 " +
    "by an old woman from the island of Yell, who remembered patterns knit " +
    "by the womenfolk for the fishermen in her family. Such keps were worn " +
    "when the men rowed to the far haaf - the deep sea fishing grounds - in " +
    "large open boats. The kep has three small patterns but is not a Fair " +
    "Isle design: I kept the small stars for one band just as they are in " +
    "the kep, and for a second band combined all three to make a nine-row " +
    "pattern. Its dark background carries colours that remind me of the " +
    "northern lights, or merrie dancers in Shetland dialect, and a familiar " +
    "sight to fishermen.",
  patternUrl: "https://www.ravelry.com/patterns/library/merrie-dancers-toorie-2",
  credit: "© Elizabeth Johnston (Shetland Handspun)",
  hashtag: "#merriedancerstoorie",
  slots: ["A", "B", "C", "D", "E"],

  sizes: [
    { id: "yw1", label: "Yarn weight 1 · DK", circumferenceCm: 48.5,
      lengthCm: 25.9, stitchesPer10cm: 27, roundsPer10cm: 27, needlesMm: 3.5,
      lengthEstimated: true,
      measurementNote: "Length estimated from 70 worked rounds at the published tension. The pattern does not specify a head-size measurement.",
      sections: dkSections },
    {
      // The leaflet gives a circumference and a tension and no length, so the
      // length here is the pattern's own arithmetic: seventy-three rounds at
      // twenty-nine rounds to ten centimetres. Nor does it say what head it
      // fits; a 50cm hat is knitted for about a 54cm one.
      id: "yw2",
      label: "Yarn weight 2",
      circumferenceCm: 50,
      lengthCm: 25,
      lengthEstimated: true,
      measurementNote: "Length is an estimate from rounds and tension, not a designer-supplied measurement. The pattern does not specify a head-size measurement.",
      stitchesPer10cm: 29,
      roundsPer10cm: 29,
      needlesMm: 3.5,
    },
  ],

  colourways: [
    {
      id: "jamieson-smith",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Jamieson & Smith",
      brand: "Jamieson & Smith",
      yarn: "Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Dark Navy", code: "36", hex: "#24222a", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-36" },
        { slot: "B", name: "Dark Green Grey", code: "FC46", hex: "#6d6850",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc46" },
        { slot: "C", name: "Mid Fawn Green Mix", code: "FC64", hex: "#957b66",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc64" },
        { slot: "D", name: "Dark Fawn", code: "78", hex: "#af8067", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-78" },
        { slot: "E", name: "Lavender", code: "FC21", hex: "#8e787f", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-fc21" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "jamiesons",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Jamieson's of Shetland",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Oxford", code: "123", hex: "#4b4a47", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-123" },
        { slot: "B", name: "Damask", code: "567", hex: "#9e6a6f", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-567" },
        { slot: "C", name: "Fog", code: "272", hex: "#c0afa0", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-272" },
        { slot: "D", name: "White", code: "304", hex: "#f1f1e7", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-304" },
        { slot: "E", name: "Rye", code: "140", hex: "#d3d2af", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-140" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "uradale",
      wool: "uradale-yarns-2ply-jumper-weight",
      name: "Uradale Yarns",
      brand: "Uradale Yarns",
      yarn: "Jumper Weight",
      url: "https://www.uradale.com",
      ballGrams: 50,
      shades: [
        { slot: "A", name: "Graeff (Shetland black)", hex: "#352c2c", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-graeff-shetland-black" },
        { slot: "B", name: "Flukkra (natural white)", hex: "#eef0e2", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-flukkra-natural-white" },
        { slot: "C", name: "Beremeal (mid fawn)", hex: "#dfd4d5", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-beremeal-mid-fawn" },
        { slot: "D", name: "Speedwell", hex: "#5fccff", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-speedwell" },
        { slot: "E", name: "Moss Heath", hex: "#cdc391", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-moss-heath" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Rib",
      rounds: [
        { type: "castOn", count: 120, slot: "A" },
        // "Round 1: *K2, p2; rep from * to end", in the main colour, before
        // the two-coloured rib the chart sets out begins.
        { type: "rounds", count: 1, slot: "A", sequence: ["k", "k", "p", "p"] },
        { type: "chart", chart: "A", rows: [1, 12], repeats: 30 },
        {
          // "K2, kfb, (k3, kfb) 3 times, *k7, kfb, (k3, kfb) 3 times;
          //  rep from * to last 5 sts, k5. 144 sts"
          type: "shaping",
          slot: "A",
          to: 144,
          ops: [
            { work: "k", times: 2 },
            { work: "kfb" },
            {
              repeat: [
                { work: "k", times: 3 },
                { work: "kfb" },
              ],
              times: 3,
            },
            {
              repeat: [
                { work: "k", times: 7 },
                { work: "kfb" },
                {
                  repeat: [
                    { work: "k", times: 3 },
                    { work: "kfb" },
                  ],
                  times: 3,
                },
              ],
              untilRemaining: 5,
            },
            { work: "k", times: 5 },
          ],
        },
        { type: "rounds", count: 1, slot: "A" },
      ],
    },
    {
      label: "Body",
      rounds: [{ type: "chart", chart: "B", rows: [1, 34], repeats: 12 }],
    },
    {
      label: "Crown",
      rounds: [
        // "Round 1: *K4, k2tog; rep from * to end. 120 sts. Round 2: Knit."
        {
          type: "shaping",
          slot: "A",
          to: 120,
          ops: [
            {
              repeat: [{ work: "k", times: 4 }, { work: "k2tog" }],
              times: 24,
            },
          ],
        },
        { type: "rounds", count: 1, slot: "A" },
        { type: "chart", chart: "C", rows: [1, 21], repeats: 5 },
      ],
    },
  ],
};

// Same named shades, but explicitly DK rather than a fingering-weight purchase.
const dkColourways = sww18.colourways.filter(c => c.id !== "jamieson-smith").map(c => ({
  ...c, id: `${c.id}-dk`, sizeIds: ["yw1"], yarn: "DK", wool: undefined,
  ballMetres: undefined,
  shades: c.shades.map(s => ({ ...s, wool: undefined, source: "approximate" as const })),
}));
sww18.colourways.forEach(c => { c.sizeIds = ["yw2"]; });
sww18.colourways.push(...dkColourways);

export default sww18;
