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
 * Its charts are printed in plain greys, like 2022's and 2024's, so there is
 * no colour in the file to read; the shades come out of the yarn library
 * instead - see data/yarns. Two of its five colourways are not in the
 * library, because neither Foula Wool nor the handspun sells online in a form
 * that can be read, and those keep considered stand-ins.
 *
 * Its second colourway is the only one on the site knitted in two yarns at
 * once: yarn A is Jamieson & Smith's Shetland Supreme, B to F their ordinary
 * 2ply Jumper Weight, which is how the pattern prints it.
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
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colourway 1",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Eclipse", code: "707", hex: "#1f1e2b", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-707" },
        { slot: "B", name: "Fjord", code: "170", hex: "#5b5f71", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-170" },
        { slot: "C", name: "Twilight", code: "175", hex: "#646a76", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-175" },
        { slot: "D", name: "Pacific", code: "763", hex: "#424b56", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-763" },
        { slot: "E", name: "Blueberry", code: "294", hex: "#342632", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-294" },
        { slot: "F", name: "Mist", code: "180", hex: "#999396", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-180" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "jamieson-smith",
      wool: "jamieson-smith-2ply-jumper-weight",
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
        { slot: "A", name: "Shetland Black", code: "2005", hex: "#2c2623",
          source: "library", wool: "jamieson-smith-shetland-supreme-jumper-weight-2005" },
        { slot: "B", name: "Dark Green Grey", code: "FC46", hex: "#3b382c",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc46" },
        { slot: "C", name: "Dark Mixed Orange", code: "122", hex: "#5c2913",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-122" },
        { slot: "D", name: "Orange Rust Mix", code: "FC38", hex: "#602211",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc38" },
        { slot: "E", name: "Dark Green", code: "82", hex: "#233735", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-82" },
        { slot: "F", name: "Bright Tan", code: "32", hex: "#864212", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-32" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
    },
    {
      id: "uradale",
      wool: "uradale-yarns-2ply-jumper-weight",
      name: "Colourway 3",
      brand: "Uradale Yarns",
      yarn: "2ply Jumper Weight",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      shades: [
        // Uradale's wool is undyed and the 2025 pattern prints Moorit and
        // Flukkra in colour, so those two are read from there.
        { slot: "A", name: "Aetmeal (light fawn)", hex: "#c0b9af", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-aetmeal-light-fawn" },
        { slot: "B", name: "Tormentil Heath", hex: "#8e7236", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-tormentil-heath" },
        { slot: "C", name: "Moss Heath", hex: "#817b5c", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-moss-heath" },
        { slot: "D", name: "Moorit (Shetland brown)", hex: "#565352", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-moorit-shetland-brown" },
        { slot: "E", name: "Flukkra (natural white)", hex: "#cdcfc1", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-flukkra-natural-white" },
        { slot: "F", name: "Moss", hex: "#989b5c", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-moss" },
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
