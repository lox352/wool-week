import { Chart, HatPattern } from "./types";
import charts from "./sww24-islesburgh-toorie.charts.json";

/**
 * Shetland Wool Week 2024: the Islesburgh Toorie.
 *
 * This pattern prints its charts in plain greys, one per yarn slot, and
 * leaves the colour to the materials list - which is exactly the model the
 * site is built on, but it does mean there is no colour in the file to read.
 * So the shade names and numbers below are as published and the colours are
 * considered stand-ins, marked "approximate" and open to correction. The
 * pattern's own greys are offered as a fourth colourway, and those are exact.
 */

const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const sww24: HatPattern = {
  id: "sww24-islesburgh-toorie",
  year: 2024,
  name: "Islesburgh Toorie",
  designer: "Anne Doull, for the Doull family",
  story:
    "The Doull family farm at Islesburgh in Northmavine and are deeply rooted " +
    "in the Shetland Flock Book Society, so Anne's toorie carries a Shetland " +
    "ram motif as a tribute to it, with a band of wave lace print for her " +
    "mother Margaret's knitted lace. The colourways come from the natural " +
    "shades of the family's own flock, and from the heather hills and sunset " +
    "views off the farm.",
  patternUrl: "https://www.shetlandwoolweek.com/",
  credit: "© The Doull Family",
  hashtag: "#IslesburghToorie",
  slots: ["A", "B", "C", "D", "E"],

  sizes: [
    {
      id: "small",
      label: "Small",
      toFitCm: 49,
      circumferenceCm: 50,
      lengthCm: 20,
      stitchesPer10cm: 32,
      roundsPer10cm: 37,
      needlesMm: 2.5,
    },
    {
      id: "medium",
      label: "Medium",
      toFitCm: 52,
      circumferenceCm: 53,
      lengthCm: 21,
      stitchesPer10cm: 30,
      roundsPer10cm: 35,
      needlesMm: 2.75,
    },
    {
      id: "large",
      label: "Large",
      toFitCm: 56,
      circumferenceCm: 57,
      lengthCm: 22.5,
      stitchesPer10cm: 28,
      roundsPer10cm: 33,
      needlesMm: 3.0,
    },
  ],

  colourways: [
    {
      id: "jamiesons",
      name: "Colourway 1",
      brand: "Jamieson's of Shetland",
      yarn: "2ply Jumper Weight (Spindrift)",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: { small: 1, medium: 1, large: 2 }, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Potpourri", code: "603", hex: "#a98fa6", source: "approximate" },
        { slot: "B", name: "Purple Heather", code: "239", hex: "#55405e", source: "approximate" },
        { slot: "C", name: "Foxglove", code: "273", hex: "#9a6f8c", source: "approximate" },
        { slot: "D", name: "Prairie", code: "812", hex: "#b9b394", source: "approximate" },
        { slot: "E", name: "Earth", code: "227", hex: "#6a5c3e", source: "approximate" },
      ],
    },
    {
      id: "jamieson-smith",
      name: "Colourway 2",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: { small: 1, medium: 1, large: 2 }, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Shade 36", code: "36", hex: "#2a2545", source: "approximate" },
        { slot: "B", name: "Shade 8", code: "8", hex: "#e58aa0", source: "approximate" },
        { slot: "C", name: "Shade 73", code: "73", hex: "#ef8b33", source: "approximate" },
        { slot: "D", name: "Shade 14", code: "14", hex: "#9dbfdd", source: "approximate" },
        { slot: "E", name: "Shade 131", code: "131", hex: "#41479f", source: "approximate" },
      ],
    },
    {
      id: "uradale",
      name: "Colourway 3",
      brand: "Uradale",
      yarn: "2ply Jumper Weight, organic",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        // Three of these are exact: the 2025 pattern draws its charts in real
        // colour and uses the same undyed Uradale shades.
        { slot: "A", name: "Moorit", hex: "#6b472b", source: "pattern" },
        { slot: "B", name: "Glansin", hex: "#bdbdba", source: "pattern" },
        { slot: "C", name: "Beremeal", hex: "#9d8a6c", source: "approximate" },
        { slot: "D", name: "Aetmeal", hex: "#c9bfa6", source: "approximate" },
        { slot: "E", name: "Flukkra", hex: "#ffffff", source: "pattern" },
      ],
    },
    {
      id: "as-printed",
      name: "As printed",
      brand: "The pattern's own chart",
      yarn: "The greys the charts are drawn in, exactly as published",
      url: "https://www.shetlandwoolweek.com/",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Yarn A", hex: "#ffffff", source: "pattern" },
        { slot: "B", name: "Yarn B", hex: "#bdbdba", source: "pattern" },
        { slot: "C", name: "Yarn C", hex: "#6e6b63", source: "pattern" },
        { slot: "D", name: "Yarn D", hex: "#82807a", source: "pattern" },
        { slot: "E", name: "Yarn E", hex: "#57544a", source: "pattern" },
      ],
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Brim heading",
      rounds: [
        { type: "castOn", count: 144, slot: "A" },
        { type: "chart", chart: "A", rows: [1, 9], repeats: 36 },
        { type: "rounds", count: 1, slot: "A" },
        {
          type: "shaping",
          slot: "A",
          to: 160,
          // K4, [m1, k9] to last 5 sts, m1, k5.
          ops: [
            { work: "k", times: 4 },
            { repeat: [{ work: "m1" }, { work: "k", times: 9 }], untilRemaining: 5 },
            { work: "m1" },
            { work: "k", times: 5 },
          ],
        },
      ],
    },
    {
      label: "Body",
      rounds: [
        { type: "chart", chart: "B", rows: [1, 11], repeats: 20 },
        { type: "chart", chart: "C", rows: [1, 15], repeats: 8 },
        { type: "chart", chart: "D", rows: [1, 12], repeats: 20 },
      ],
    },
    {
      label: "Crown",
      rounds: [
        {
          type: "shaping",
          slot: "A",
          to: 144,
          // K4, [k2tog, k8] to last 6 sts, k2tog, k4.
          ops: [
            { work: "k", times: 4 },
            { repeat: [{ work: "k2tog" }, { work: "k", times: 8 }], untilRemaining: 6 },
            { work: "k2tog" },
            { work: "k", times: 4 },
          ],
        },
        { type: "chart", chart: "E", rows: [1, 23], repeats: 6 },
      ],
    },
  ],
};

export default sww24;
