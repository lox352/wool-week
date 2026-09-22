import { Chart, HatPattern } from "./types";
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
  patternUrl: "https://www.shetlandwoolweek.com/",
  credit: "© Elizabeth Johnston (Shetland Handspun)",
  hashtag: "#merriedancerstoorie",
  slots: ["A", "B", "C", "D", "E"],

  sizes: [
    {
      // The leaflet gives a circumference and a tension and no length, so the
      // length here is the pattern's own arithmetic: seventy-three rounds at
      // twenty-nine rounds to ten centimetres. Nor does it say what head it
      // fits; a 50cm hat is knitted for about a 54cm one.
      id: "yw2",
      label: "Yarn weight 2",
      toFitCm: 54,
      circumferenceCm: 50,
      lengthCm: 25,
      stitchesPer10cm: 29,
      roundsPer10cm: 29,
      needlesMm: 3.5,
    },
  ],

  colourways: [
    {
      id: "jamieson-smith",
      name: "Jamieson & Smith",
      brand: "Jamieson & Smith",
      yarn: "Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Shade 36", code: "36", hex: "#2f2c2a", source: "approximate" },
        { slot: "B", name: "Shade FC46", code: "FC46", hex: "#76834e", source: "pattern" },
        { slot: "C", name: "Shade FC64", code: "FC64", hex: "#9d9287", source: "pattern" },
        { slot: "D", name: "Shade 78", code: "78", hex: "#af967d", source: "pattern" },
        { slot: "E", name: "Shade FC21", code: "FC21", hex: "#888cb7", source: "pattern" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "jamiesons",
      name: "Jamieson's of Shetland",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Oxford", hex: "#3a3a3c", source: "approximate" },
        { slot: "B", name: "Damask", hex: "#964d69", source: "pattern" },
        { slot: "C", name: "Fog", hex: "#ae9189", source: "pattern" },
        { slot: "D", name: "White", hex: "#cdcec9", source: "pattern" },
        { slot: "E", name: "Rye", hex: "#bac6a7", source: "pattern" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "uradale",
      name: "Uradale Yarns",
      brand: "Uradale Yarns",
      yarn: "Jumper Weight",
      url: "https://www.uradale.com",
      ballGrams: 50,
      shades: [
        { slot: "A", name: "Graeff", hex: "#3b3733", source: "approximate" },
        { slot: "B", name: "Flukkra", hex: "#dfe2d7", source: "pattern" },
        { slot: "C", name: "Beremeal", hex: "#898f99", source: "pattern" },
        { slot: "D", name: "Speedwell", hex: "#6a94af", source: "pattern" },
        { slot: "E", name: "Moss Heath", hex: "#a3aa56", source: "pattern" },
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
          //
          // A kfb knits into a stitch twice, so it is a knit that consumes the
          // stitch below and a make-one for the loop that comes out of nothing.
          type: "shaping",
          slot: "A",
          to: 144,
          ops: [
            { work: "k", times: 2 },
            { work: "k", times: 1 },
            { work: "m1" },
            {
              repeat: [
                { work: "k", times: 3 },
                { work: "k", times: 1 },
                { work: "m1" },
              ],
              times: 3,
            },
            {
              repeat: [
                { work: "k", times: 7 },
                { work: "k", times: 1 },
                { work: "m1" },
                {
                  repeat: [
                    { work: "k", times: 3 },
                    { work: "k", times: 1 },
                    { work: "m1" },
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

export default sww18;
