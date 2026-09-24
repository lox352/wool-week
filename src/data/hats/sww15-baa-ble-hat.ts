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
 * there is no colour in the file to read. The shades are the two the pattern
 * names, and their colours come out of the yarn library - see data/yarns.
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
  patternUrl: "https://www.ravelry.com/patterns/library/baa-ble-hat",
  credit: "© Donna Smith",
  slots: ["A", "B", "C", "D"],

  sizes: [
    {
      // The pattern gives one size and one set of needles: 52-57cm to fit,
      // 48cm round the rib and 21cm from the turned up edge to the crown.
      id: "one",
      label: "One size",
      toFitRangeCm: [52, 57],
      circumferenceCm: 48,
      circumferenceLabel: "Rib circumference",
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
      wool: "jamieson-s-of-shetland-heather-aran",
      name: "Jamieson's Heather Aran",
      brand: "Jamieson's of Shetland",
      yarn: "Heather Aran",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballGrams: 50,
      shades: [
        { slot: "A", name: "Autumn", code: "998", hex: "#896d45", source: "library",
          wool: "jamieson-s-of-shetland-heather-aran-998" },
        { slot: "B", name: "Natural White", code: "104", hex: "#f2efdd", source: "library",
          wool: "jamieson-s-of-shetland-heather-aran-104" },
        { slot: "C", name: "Shetland Black", code: "101", hex: "#37312c", source: "library",
          wool: "jamieson-s-of-shetland-heather-aran-101" },
        { slot: "D", name: "Highland Mist", code: "1390", hex: "#9aa6aa", source: "library",
          wool: "jamieson-s-of-shetland-heather-aran-1390" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1 },
    },
    {
      id: "jamieson-smith",
      wool: "jamieson-smith-shetland-aran-worsted",
      name: "Jamieson & Smith Worsted Aran",
      brand: "Jamieson & Smith",
      yarn: "Worsted Aran",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballGrams: 50,
      shades: [
        { slot: "A", name: "Peat", hex: "#56302c", source: "library",
          wool: "jamieson-smith-shetland-aran-worsted-peat" },
        { slot: "B", name: "Snaa White", hex: "#e8e0b8", source: "library",
          wool: "jamieson-smith-shetland-aran-worsted-snaa-white" },
        { slot: "C", name: "Coll Black", hex: "#363636", source: "library",
          wool: "jamieson-smith-shetland-aran-worsted-coll-black" },
        { slot: "D", name: "Silver Grey", hex: "#938c7d", source: "library",
          wool: "jamieson-smith-shetland-aran-worsted-silver-grey" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1 },
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Rib",
      rounds: [
        { type: "castOn", count: 96, slot: "A" },
        // Twenty-five rounds of rib, worn turned up: twelve rounds and the
        // cast-on come back up the outside, and the thirteen above the fold
        // are what carries on into the hat. The pattern measures its 21cm
        // from the turned up edge, not from the cast-on.
        { type: "rounds", count: 12, slot: "A", sequence: ["k", "k", "p", "p"] },
        { type: "fold" },
        { type: "rounds", count: 13, slot: "A", sequence: ["k", "k", "p", "p"] },
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
