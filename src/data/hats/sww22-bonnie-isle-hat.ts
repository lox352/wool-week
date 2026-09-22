import { Chart, HatPattern } from "./types";
import charts from "./sww22-bonnie-isle-hat.charts.json";

/**
 * Shetland Wool Week 2022: the Bonnie Isle Hat.
 *
 * Like the Islesburgh Toorie, this pattern prints its charts in plain greys,
 * one per yarn slot, and leaves the colour to the materials list. So the
 * shade names and numbers below are exactly as published and the colours are
 * considered stand-ins, marked "approximate" and open to correction; the
 * pattern's own greys are offered as a sixth colourway and those are exact.
 * Two Uradale shades are exact because the 2025 pattern draws the same undyed
 * wool in colour.
 *
 * Its crown decrease is sk2p rather than the centred s2kp the other years
 * use - slip one, knit two together, pass the slipped stitch over - so the
 * decrease leans instead of standing straight, and the chart draws it as a
 * chevron without a middle leg.
 *
 * One discrepancy worth recording: the written instructions say to work until
 * all 14 rows of chart A are complete, and chart A has 13 rows. The other
 * four charts' row counts match their instructions exactly, so this is read
 * as a slip in the text rather than a missing row, and the brim is worked
 * from the chart as drawn. Nothing hangs on it but the depth of the rib: no
 * stitch count changes in chart A.
 */

const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const sww22: HatPattern = {
  id: "sww22-bonnie-isle-hat",
  year: 2022,
  name: "Bonnie Isle Hat",
  designer: "Linda Shearer",
  story:
    "Linda lives on Whalsay, whose nickname - the Bonnie Isle - gave the hat " +
    "its name. The sea is never far away on an island, and all the men in her " +
    "family have worked on or near it, so the hat is nautical: the chain in " +
    "the rib stands for the link between everyone during Wool Week, and the " +
    "anchor, a common motif in Fair Isle knitting, for keeping grounded and " +
    "connected to what matters. The circle at the crown is a spinning wheel, " +
    "a tribute to her mother Ina Irvine, a prolific spinner and knitter.",
  patternUrl: "https://www.shetlandwoolweek.com/",
  credit: "© Linda Shearer",
  hashtag: "#BonnieIsleHat",
  slots: ["A", "B", "C", "D", "E"],

  sizes: [
    {
      id: "small",
      label: "Small",
      toFitCm: 51,
      circumferenceCm: 49,
      lengthCm: 21,
      stitchesPer10cm: 32,
      roundsPer10cm: 36,
      needlesMm: 2.75,
      ribNeedlesMm: 2.5,
    },
    {
      id: "medium",
      label: "Medium",
      toFitCm: 54,
      circumferenceCm: 52,
      lengthCm: 22,
      stitchesPer10cm: 30,
      roundsPer10cm: 34,
      needlesMm: 3.0,
      ribNeedlesMm: 2.75,
    },
    {
      id: "large",
      label: "Large",
      toFitCm: 58,
      circumferenceCm: 56,
      lengthCm: 23.5,
      stitchesPer10cm: 28,
      roundsPer10cm: 32,
      needlesMm: 3.25,
      ribNeedlesMm: 3.0,
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
        { slot: "A", name: "Granite", code: "122", hex: "#7d8894", source: "approximate" },
        { slot: "B", name: "Stonewash", code: "677", hex: "#6f8ba4", source: "approximate" },
        { slot: "C", name: "Dove", code: "630", hex: "#b7bbbd", source: "approximate" },
        { slot: "D", name: "Oxford", code: "123", hex: "#3a414d", source: "approximate" },
        { slot: "E", name: "Natural White", code: "104", hex: "#f2efe9", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "jamieson-smith",
      name: "Colourway 2",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Shade FC41", code: "FC41", hex: "#4f7ea3", source: "approximate" },
        { slot: "B", name: "Shade 091", code: "091", hex: "#efece3", source: "approximate" },
        { slot: "C", name: "Shade 1281 mix", code: "1281", hex: "#9aa1a7", source: "approximate" },
        { slot: "D", name: "Shade 096", code: "096", hex: "#23293a", source: "approximate" },
        { slot: "E", name: "Shade 9113", code: "9113", hex: "#dfa62c", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
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
        // Uradale's wool is undyed, and the 2025 pattern prints these same
        // shades in colour, so Flukkra and Aetmeal are read from there.
        { slot: "A", name: "Aetmeal", hex: "#c9bfa6", source: "approximate" },
        { slot: "B", name: "Roanberry Meal", hex: "#a8897c", source: "approximate" },
        { slot: "C", name: "Roanberry Heath", hex: "#7d5a4f", source: "approximate" },
        { slot: "D", name: "Graeff", hex: "#8b8a85", source: "approximate" },
        { slot: "E", name: "Flukkra", hex: "#ffffff", source: "pattern" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "laxdale",
      name: "Colourway 4",
      brand: "Laxdale Yarn",
      yarn: "2ply Jumper Weight",
      url: "https://www.laxdaleyarn.com",
      ballMetres: 90,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Fern", hex: "#4a5f42", source: "approximate" },
        { slot: "B", name: "Lichen", hex: "#9aa45f", source: "approximate" },
        { slot: "C", name: "Buttermilk", hex: "#ead9a8", source: "approximate" },
        { slot: "D", name: "Winter Sky", hex: "#8fa0ad", source: "approximate" },
        { slot: "E", name: "Artichoke", hex: "#6f7f55", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "aister-oo",
      name: "Colourway 5",
      brand: "Aister Oo",
      yarn: "2ply Jumper Weight",
      url: "https://www.mackenziesfarmshop.co.uk",
      ballMetres: 71,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Moonshine", hex: "#d4cfc6", source: "approximate" },
        { slot: "B", name: "Cluve", hex: "#b0477f", source: "approximate" },
        { slot: "C", name: "Holsas", hex: "#8c6ea0", source: "approximate" },
        { slot: "D", name: "Midsetter", hex: "#2e3350", source: "approximate" },
        { slot: "E", name: "Blinnd Moorie", hex: "#f5f2ec", source: "approximate" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "as-printed",
      name: "As printed",
      brand: "Shetland Wool Week",
      yarn: "the pattern's own greys",
      url: "https://www.shetlandwoolweek.com/",
      ballMetres: 105,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Yarn A", hex: "#d1d4d6", source: "pattern" },
        { slot: "B", name: "Yarn B", hex: "#a3a6ab", source: "pattern" },
        { slot: "C", name: "Yarn C", hex: "#787a80", source: "pattern" },
        { slot: "D", name: "Yarn D", hex: "#525457", source: "pattern" },
        { slot: "E", name: "Yarn E", hex: "#ffffff", source: "pattern" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 140, slot: "A" },
        // Row 1 of chart A is the rib worked flat before the round is joined.
        { type: "chart", chart: "A", rows: [1, 13], repeats: 14 },
        {
          type: "shaping",
          slot: "A",
          to: 156,
          /*
           * K9, kfb, [k7, kfb] to last 10 sts, k to end.
           *
           * A kfb knits into a stitch twice, so it is the knit that consumes
           * the stitch below and a make-one for the loop that comes out of
           * nothing - which is the same pair the chart lays out as one stitch
           * becoming two.
           */
          ops: [
            { work: "k", times: 9 },
            { work: "k", times: 1 },
            { work: "m1" },
            {
              repeat: [
                { work: "k", times: 7 },
                { work: "k", times: 1 },
                { work: "m1" },
              ],
              untilRemaining: 10,
            },
            { work: "k", times: 10 },
          ],
        },
      ],
    },
    {
      label: "Body",
      rounds: [
        { type: "chart", chart: "B", rows: [1, 14], repeats: 13 },
        { type: "chart", chart: "C", rows: [1, 13], repeats: 12 },
        { type: "chart", chart: "D", rows: [1, 14], repeats: 13 },
      ],
    },
    {
      label: "Crown",
      rounds: [
        {
          type: "shaping",
          slot: "A",
          to: 128,
          // [K4, k2tog, k3, k2tog] to last 2 sts, k2.
          ops: [
            {
              repeat: [
                { work: "k", times: 4 },
                { work: "k2tog" },
                { work: "k", times: 3 },
                { work: "k2tog" },
              ],
              untilRemaining: 2,
            },
            { work: "k", times: 2 },
          ],
        },
        { type: "chart", chart: "E", rows: [1, 19], repeats: 8 },
      ],
    },
  ],
};

export default sww22;
