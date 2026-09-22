import { Chart, HatPattern } from "./types";
import charts from "./sww15-baa-ble-hat.charts.json";

/**
 * Shetland Wool Week 2015: the Baa-ble Hat.
 *
 * The one that got away from everybody: a hat with a row of sheep round it,
 * given away free, knitted tens of thousands of times and still the hat most
 * people mean when they say Shetland Wool Week.
 *
 * It is also the oldest pattern here and the only one set in a word
 * processor rather than a page layout program, which changes how it had to be
 * read. Its chart is a table: every cell of every row is shaded, and the
 * staircase down the crown is drawn by taking the borders off the cells that
 * are not stitches rather than by leaving those cells out. So the extractor
 * reads this one's grid from its rules and asks the shading only what colour
 * each cell is - see PATTERNS.md, and the --ruled flag.
 *
 * Its charts are printed in plain greys, like 2021's, 2022's and 2024's, so
 * the shade names are exactly as published and the colours are stand-ins,
 * marked "approximate". The greys themselves are offered as a third colourway
 * and those are exact.
 *
 * One chart, worked twice a round, and it does everything: 45 rows taking 120
 * stitches to 10, with the sheep in the middle and the decreases from row 26.
 */

const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const sww15: HatPattern = {
  id: "sww15-baa-ble-hat",
  year: 2015,
  name: "Baa-ble Hat",
  designer: "Donna Smith",
  story:
    "Inspired by the sheep of Shetland and the wintery colours of the land " +
    "and sky, this hat is made in Shetland Aran weight yarn, so it is a " +
    "quick knit. Two colours of yarn are carried through the main part of " +
    "the hat, which makes a very firm, cosy garment that keeps out the wind. " +
    "The pattern was written for double pointed needles, as is traditional " +
    "in Shetland, but it knits just as well on a circular.",
  patternUrl: "https://www.shetlandwoolweek.com/",
  credit: "© Donna Smith",
  slots: ["A", "B", "C", "D"],

  sizes: [
    {
      // The pattern gives one size and one set of needles: 52-57cm to fit,
      // 48cm round the rib and 21cm from the turned up edge to the crown.
      id: "one",
      label: "One size",
      toFitCm: 54.5,
      circumferenceCm: 48,
      lengthCm: 21,
      stitchesPer10cm: 23,
      roundsPer10cm: 26,
      needlesMm: 4.5,
      ribNeedlesMm: 4,
    },
  ],

  colourways: [
    {
      id: "jamiesons",
      name: "Jamieson's Heather Aran",
      brand: "Jamieson's of Shetland",
      yarn: "Heather Aran",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballGrams: 50,
      shades: [
        { slot: "A", name: "Autumn", hex: "#8a4a2a", source: "approximate" },
        { slot: "B", name: "Natural White", hex: "#f2ece1", source: "approximate" },
        { slot: "C", name: "Natural Black", hex: "#2b2825", source: "approximate" },
        { slot: "D", name: "Highland Mist", hex: "#9aa3a8", source: "approximate" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1 },
    },
    {
      id: "jamieson-smith",
      name: "Jamieson & Smith Worsted Aran",
      brand: "Jamieson & Smith",
      yarn: "Worsted Aran",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballGrams: 50,
      shades: [
        { slot: "A", name: "Peat", hex: "#5a4a3a", source: "approximate" },
        { slot: "B", name: "Snaa White", hex: "#f4f1ea", source: "approximate" },
        { slot: "C", name: "Coll Black", hex: "#26241f", source: "approximate" },
        { slot: "D", name: "Silver Grey", hex: "#b6b7b2", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1 },
    },
    {
      id: "as-printed",
      name: "As printed",
      brand: "Shetland Wool Week",
      yarn: "the pattern's own greys",
      url: "https://www.shetlandwoolweek.com/",
      shades: [
        { slot: "A", name: "Shade A", hex: "#808080", source: "pattern" },
        { slot: "B", name: "Shade B", hex: "#ffffff", source: "pattern" },
        { slot: "C", name: "Shade C", hex: "#1c1c12", source: "pattern" },
        { slot: "D", name: "Shade D", hex: "#bfbfbf", source: "pattern" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1 },
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Rib",
      rounds: [
        { type: "castOn", count: 96, slot: "A" },
        { type: "rounds", count: 25, slot: "A", sequence: ["k", "k", "p", "p"] },
        {
          // *K2, P2, M1* to the end: 24 increases, 96 becomes 120.
          type: "shaping",
          slot: "A",
          to: 120,
          ops: [
            {
              repeat: [
                { work: "k", times: 2 },
                { work: "p", times: 2 },
                { work: "m1" },
              ],
              times: 24,
            },
          ],
        },
      ],
    },
    {
      label: "Main hat",
      // One chart for everything above the rib, worked twice a round: sixty
      // stitches to five over forty-five rows, with the first decrease on
      // row 26 and ten stitches left at the top.
      rounds: [{ type: "chart", chart: "A", rows: [1, 45], repeats: 2 }],
    },
  ],
};

export default sww15;
