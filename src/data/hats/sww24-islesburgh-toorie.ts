import { Chart, HatPattern } from "./types";
import charts from "./sww24-islesburgh-toorie.charts.json";

/**
 * Shetland Wool Week 2024: the Islesburgh Toorie.
 *
 * This pattern prints its charts in plain greys, one per yarn slot, and
 * leaves the colour to the materials list - which is exactly the model the
 * site is built on, but it does mean there is no colour in the file to read.
 * So the shade names and numbers below are as published, and their colours
 * come out of the yarn library - see data/yarns.
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
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colourway 1",
      brand: "Jamieson's of Shetland",
      yarn: "2ply Jumper Weight (Spindrift)",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: { small: 1, medium: 1, large: 2 }, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Pot-Pourri", code: "603", hex: "#91767a", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-603" },
        { slot: "B", name: "Purple Heather", code: "239", hex: "#412329", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-239" },
        { slot: "C", name: "Foxglove", code: "273", hex: "#684159", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-273" },
        { slot: "D", name: "Prairie", code: "812", hex: "#394d2a", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-812" },
        { slot: "E", name: "Earth", code: "227", hex: "#28261e", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-227" },
      ],
    },
    {
      id: "jamieson-smith",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Colourway 2",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: { small: 1, medium: 1, large: 2 }, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Dark Navy", code: "36", hex: "#121115", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-36" },
        { slot: "B", name: "Bright Pink", code: "8", hex: "#c24345", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-8" },
        { slot: "C", name: "Bright Orange", code: "73", hex: "#9a3005", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-73" },
        { slot: "D", name: "Light Blue", code: "14", hex: "#6e8c9e", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-14" },
        { slot: "E", name: "Purpley Blue", code: "131", hex: "#384073", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-131" },
      ],
    },
    {
      id: "uradale",
      wool: "uradale-yarns-2ply-jumper-weight",
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
        { slot: "A", name: "Moorit (Shetland brown)", hex: "#565352", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-moorit-shetland-brown" },
        { slot: "B", name: "Glansin (light grey)", hex: "#c2c2c1", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-glansin-light-grey" },
        { slot: "C", name: "Beremeal (mid fawn)", hex: "#a79ea0", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-beremeal-mid-fawn" },
        { slot: "D", name: "Aetmeal (light fawn)", hex: "#c0b9af", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-aetmeal-light-fawn" },
        { slot: "E", name: "Flukkra (natural white)", hex: "#cdcfc1", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-flukkra-natural-white" },
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
