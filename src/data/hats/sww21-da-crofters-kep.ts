import { Chart, HatPattern } from "./types";
import charts from "./sww21-da-crofters-kep.charts.json";

/**
 * Shetland Wool Week 2021: Da Crofter's Kep.
 *
 * Six yarns rather than five, and the first hat here whose crown chart does
 * its own first decrease: chart C is worked over 28 stitches a repeat and
 * leaves 24, so the 168 the body carries becomes the 144 the pattern prints
 * on row 1 rather than in a separate round.
 *
 * Its charts are printed in plain greys, like 2022's and 2024's, so the shade
 * names and numbers are exactly as published and the colours are considered
 * stand-ins, marked "approximate". The greys themselves are offered as a
 * sixth colourway and those are exact, as are Uradale's Moorit and Flukkra,
 * which the 2025 pattern prints in colour.
 */

const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const sww21: HatPattern = {
  id: "sww21-da-crofters-kep",
  year: 2021,
  name: "Da Crofter's Kep",
  designer: "Wilma Malcolmson",
  story:
    "Wilma's father, Tammy Fraser, was a crofter who worked the land all his " +
    "life; it meant long days, difficult times and many struggles, and she " +
    "remembers the great pride he took in what he did. Just as her Katie's " +
    "Kep was a tribute to her mother and the knitters like her, Da Crofter's " +
    "Kep honours the people who work the land in Shetland - whose commitment " +
    "to their land and livestock, in all weathers and for generations, is why " +
    "there are Shetland sheep, and wool, and yarn at all.",
  patternUrl: "https://www.shetlandwoolweek.com/",
  credit: "© Wilma Malcolmson",
  hashtag: "#dacrofterskep",
  slots: ["A", "B", "C", "D", "E", "F"],

  sizes: [
    {
      id: "small",
      label: "Small",
      toFitCm: 51.5,
      circumferenceCm: 49.5,
      lengthCm: 20,
      stitchesPer10cm: 34,
      roundsPer10cm: 32,
      needlesMm: 2.5,
    },
    {
      id: "medium",
      label: "Medium",
      toFitCm: 54.5,
      circumferenceCm: 52.5,
      lengthCm: 20,
      stitchesPer10cm: 32,
      roundsPer10cm: 32,
      needlesMm: 2.75,
    },
    {
      id: "large",
      label: "Large",
      toFitCm: 58,
      circumferenceCm: 56,
      lengthCm: 20,
      stitchesPer10cm: 30,
      roundsPer10cm: 32,
      needlesMm: 3.0,
    },
  ],

  colourways: [
    {
      id: "jamiesons",
      name: "Colourway 1",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Eclipse", code: "707", hex: "#23283a", source: "approximate" },
        { slot: "B", name: "Fjord", code: "170", hex: "#6c86a3", source: "approximate" },
        { slot: "C", name: "Twilight", code: "175", hex: "#6b6f92", source: "approximate" },
        { slot: "D", name: "Pacific", code: "763", hex: "#3f6d9e", source: "approximate" },
        { slot: "E", name: "Blueberry", code: "294", hex: "#3c4470", source: "approximate" },
        { slot: "F", name: "Mist", code: "180", hex: "#b8c3cc", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "jamieson-smith",
      name: "Colourway 2",
      brand: "Jamieson & Smith",
      // Two yarns in one colourway: yarn A is Shetland Supreme, at 172m per
      // 50g ball, and the other five are 2ply Jumper Weight. The figures
      // below are the 2ply's, which is five of the six.
      yarn: "Shetland Supreme Jumper Weight (A) and 2ply Jumper Weight (B-F)",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Shade 2005", code: "2005", hex: "#2b2523", source: "approximate" },
        { slot: "B", name: "Shade FC46", code: "FC46", hex: "#b5622a", source: "approximate" },
        { slot: "C", name: "Shade 122", code: "122", hex: "#8a6a4a", source: "approximate" },
        { slot: "D", name: "Shade FC38", code: "FC38", hex: "#d08a3a", source: "approximate" },
        { slot: "E", name: "Shade 82", code: "82", hex: "#7a3b20", source: "approximate" },
        { slot: "F", name: "Shade 32", code: "32", hex: "#d9cdb8", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "uradale",
      name: "Colourway 3",
      brand: "Uradale Yarns",
      yarn: "2ply Jumper Weight",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      shades: [
        // Uradale's wool is undyed and the 2025 pattern prints Moorit and
        // Flukkra in colour, so those two are read from there.
        { slot: "A", name: "Aetmeal", hex: "#c9bfa6", source: "approximate" },
        { slot: "B", name: "Tormentil Heath", hex: "#b8913f", source: "approximate" },
        { slot: "C", name: "Moss Heath", hex: "#8a8a5a", source: "approximate" },
        { slot: "D", name: "Moorit", hex: "#6b472b", source: "pattern" },
        { slot: "E", name: "Flukkra", hex: "#ffffff", source: "pattern" },
        { slot: "F", name: "Moss", hex: "#6c7a4a", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "shetland-handspun",
      name: "Colourway 4",
      brand: "Shetland Handspun",
      // Sold in skeins, and the pattern does not say how long a skein is, so
      // there is nothing to put in the ball figures.
      yarn: "Handspun 2ply, sold in skeins",
      url: "https://www.shetlandhandspun.com",
      shades: [
        { slot: "A", name: "Silver", hex: "#b8b8b4", source: "approximate" },
        { slot: "B", name: "Rouge", hex: "#a33a35", source: "approximate" },
        { slot: "C", name: "Wine", hex: "#6e2733", source: "approximate" },
        { slot: "D", name: "Maroon", hex: "#7c3038", source: "approximate" },
        { slot: "E", name: "Cloud", hex: "#e3e0da", source: "approximate" },
        { slot: "F", name: "Midnight", hex: "#23252e", source: "approximate" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "foula",
      name: "Colourway 5",
      brand: "Foula Wool",
      yarn: "Jumper Weight",
      url: "https://www.foulawool.co.uk",
      ballMetres: 90,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Black", hex: "#2a2724", source: "approximate" },
        { slot: "B", name: "Grey", hex: "#8c8a85", source: "approximate" },
        { slot: "C", name: "Mioget", hex: "#c9a961", source: "approximate" },
        { slot: "D", name: "Fawn", hex: "#b9a488", source: "approximate" },
        { slot: "E", name: "Moorit", hex: "#6b472b", source: "approximate" },
        { slot: "F", name: "Light Grey", hex: "#c2c0ba", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "as-printed",
      name: "As printed",
      brand: "Shetland Wool Week",
      yarn: "the pattern's own greys",
      url: "https://www.shetlandwoolweek.com/",
      shades: [
        { slot: "A", name: "Yarn A", hex: "#ffffff", source: "pattern" },
        { slot: "B", name: "Yarn B", hex: "#636361", source: "pattern" },
        { slot: "C", name: "Yarn C", hex: "#a6a8a8", source: "pattern" },
        { slot: "D", name: "Yarn D", hex: "#878787", source: "pattern" },
        { slot: "E", name: "Yarn E", hex: "#c4c7c7", source: "pattern" },
        { slot: "F", name: "Yarn F", hex: "#3b3b38", source: "pattern" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 136, slot: "A" },
        { type: "chart", chart: "A", rows: [1, 10], repeats: 34 },
        {
          type: "shaping",
          slot: "A",
          to: 168,
          // K5, m1 (k4, m1) to last 7 sts, k7.
          ops: [
            { work: "k", times: 5 },
            { work: "m1" },
            {
              repeat: [{ work: "k", times: 4 }, { work: "m1" }],
              untilRemaining: 7,
            },
            { work: "k", times: 7 },
          ],
        },
      ],
    },
    {
      label: "Body",
      rounds: [{ type: "chart", chart: "B", rows: [1, 35], repeats: 7 }],
    },
    {
      label: "Crown",
      rounds: [
        // Chart C takes the 168 down to 144 on its own first row, and to 12
        // by its last: no separate decrease round in this one.
        { type: "chart", chart: "C", rows: [1, 23], repeats: 6 },
      ],
    },
  ],
};

export default sww21;
