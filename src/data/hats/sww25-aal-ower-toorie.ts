import { Chart, HatPattern } from "./types";
import charts from "./sww25-aal-ower-toorie.charts.json";

/**
 * Shetland Wool Week 2025: the Aal Ower Toorie.
 *
 * Every colour here was read out of the pattern's own charts, which are
 * printed three times over, once per colourway. The third uses five yarns
 * where the first two use eight, so several slots share a shade - that is the
 * colourway's doing, not a mistake.
 */

const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    numberFrom: chart.id === "B" ? 46 : 1,
    rows: chart.rows as Chart["rows"],
  }));

const sww25: HatPattern = {
  id: "sww25-aal-ower-toorie",
  year: 2025,
  name: "Aal Ower Toorie",
  designer: "Rachel Hunter, for the Shetland Guild of Spinners, Knitters, Weavers and Dyers",
  story:
    "The Guild took its toorie from a 1930s pattern in their own publication, " +
    "A Shetlander's Fair Isle Graph Book, after seeing the Chris Morphet " +
    "photographs at the Shetland Museum and Archives. It is built on a " +
    "diamond grid, so the design runs on horizontally, vertically and " +
    "diagonally - aal ower - and the name is a nod to Guild members, who " +
    "come from all over Shetland.",
  patternUrl: "https://www.shetlandwoolweek.com/",
  credit: "© Shetland Guild of Spinners, Knitters, Weavers and Dyers",
  hashtag: "#AalOwerToorie",
  slots: ["A", "B", "C", "D", "E", "F", "G", "H"],

  sizes: [
    {
      id: "small",
      label: "Small",
      toFitCm: 47.5,
      circumferenceCm: 47.5,
      lengthCm: 19.5,
      stitchesPer10cm: 34,
      roundsPer10cm: 36,
      ribNeedlesMm: 2.25,
      needlesMm: 2.75,
    },
    {
      id: "medium",
      label: "Medium",
      toFitCm: 52,
      circumferenceCm: 52,
      lengthCm: 20.5,
      stitchesPer10cm: 31,
      roundsPer10cm: 34,
      ribNeedlesMm: 2.5,
      needlesMm: 3.0,
    },
    {
      id: "large",
      label: "Large",
      toFitCm: 56,
      circumferenceCm: 56,
      lengthCm: 22,
      stitchesPer10cm: 29,
      roundsPer10cm: 32,
      ribNeedlesMm: 2.75,
      needlesMm: 3.25,
    },
  ],

  colourways: [
    {
      id: "vintage",
      name: "Vintage",
      brand: "Jamieson's of Shetland",
      yarn: "2ply Jumper Weight (Spindrift)",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 1 },
      shades: [
        { slot: "A", name: "Moorit", code: "108", hex: "#684524", source: "pattern" },
        { slot: "B", name: "Eesit", code: "105", hex: "#b4ab92", source: "pattern" },
        { slot: "C", name: "Sapphire", code: "676", hex: "#4967a4", source: "pattern" },
        { slot: "D", name: "Daffodil", code: "390", hex: "#d2c434", source: "pattern" },
        { slot: "E", name: "Madder", code: "587", hex: "#b6302d", source: "pattern" },
        { slot: "F", name: "Natural White", code: "104", hex: "#ffffff", source: "pattern" },
        { slot: "G", name: "Moss", code: "147", hex: "#2c5f39", source: "pattern" },
        { slot: "H", name: "Nutmeg", code: "1200", hex: "#ef774d", source: "pattern" },
      ],
    },
    {
      id: "kaleyard",
      name: "Kaleyard",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 1 },
      shades: [
        { slot: "A", name: "Shade FC56", code: "FC56", hex: "#3d243d", source: "pattern" },
        { slot: "B", name: "Shade 28", code: "28", hex: "#c4ba29", source: "pattern" },
        { slot: "C", name: "Shade FC9", code: "FC9", hex: "#733b7d", source: "pattern" },
        { slot: "D", name: "Shade 66", code: "66", hex: "#e8e330", source: "pattern" },
        { slot: "E", name: "Shade FC22", code: "FC22", hex: "#eb3b7d", source: "pattern" },
        { slot: "F", name: "Shade 96", code: "96", hex: "#f5f099", source: "pattern" },
        { slot: "G", name: "Shade 82", code: "82", hex: "#1f3d1c", source: "pattern" },
        { slot: "H", name: "Shade 141", code: "141", hex: "#33b0ad", source: "pattern" },
      ],
    },
    {
      id: "shetland-naturals",
      name: "Shetland Naturals",
      brand: "Uradale",
      yarn: "2ply Jumper Weight, organic",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      // Five yarns doing the work of eight, so several slots share a shade.
      balls: { A: { small: 2, medium: 2, large: 2 }, B: 1, D: 1, E: 1, F: 1 },
      shades: [
        { slot: "A", name: "Grall", hex: "#4f4a40", source: "pattern" },
        { slot: "B", name: "Laebrakk", hex: "#82807a", source: "pattern" },
        { slot: "C", name: "Grall", hex: "#4f4a40", source: "pattern" },
        { slot: "D", name: "Glansin", hex: "#bdbdba", source: "pattern" },
        { slot: "E", name: "Moorit", hex: "#6b472b", source: "pattern" },
        { slot: "F", name: "Flukkra", hex: "#ffffff", source: "pattern" },
        { slot: "G", name: "Grall", hex: "#4f4a40", source: "pattern" },
        { slot: "H", name: "Glansin", hex: "#bdbdba", source: "pattern" },
      ],
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 130, slot: "A" },
        { type: "rounds", count: 10, slot: "A", sequence: ["k1tbl", "p"] },
        {
          type: "shaping",
          slot: "A",
          to: 162,
          // K2, m1, k5, [m1, k4] x 29, m1, k5, m1, k2.
          ops: [
            { work: "k", times: 2 },
            { work: "m1" },
            { work: "k", times: 5 },
            { repeat: [{ work: "m1" }, { work: "k", times: 4 }], times: 29 },
            { work: "m1" },
            { work: "k", times: 5 },
            { work: "m1" },
            { work: "k", times: 2 },
          ],
        },
      ],
    },
    {
      label: "Body",
      rounds: [
        { type: "chart", chart: "A", rows: [1, 16], repeats: 9, passes: 2 },
        { type: "chart", chart: "A", rows: [1, 13], repeats: 9 },
      ],
    },
    {
      label: "Crown",
      rounds: [{ type: "chart", chart: "B", rows: [1, 16], repeats: 9 }],
    },
  ],
};

export default sww25;
