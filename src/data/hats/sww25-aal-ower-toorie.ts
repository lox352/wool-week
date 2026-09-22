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
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Vintage",
      brand: "Jamieson's of Shetland",
      yarn: "2ply Jumper Weight (Spindrift)",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 1 },
      shades: [
        { slot: "A", name: "Moorit", code: "108", hex: "#544437", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-108" },
        { slot: "B", name: "Eesit", code: "105", hex: "#c0b7a1", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-105" },
        { slot: "C", name: "Sapphire", code: "676", hex: "#375e82", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-676" },
        { slot: "D", name: "Daffodil", code: "390", hex: "#d1b645", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-390" },
        { slot: "E", name: "Madder", code: "587", hex: "#6c181d", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-587" },
        { slot: "F", name: "Natural White", code: "104", hex: "#dbd6bb", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-104" },
        { slot: "G", name: "Moss", code: "147", hex: "#384127", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-147" },
        { slot: "H", name: "Nutmeg", code: "1200", hex: "#b26044", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-1200" },
      ],
    },
    {
      id: "kaleyard",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Kaleyard",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1, H: 1 },
      shades: [
        { slot: "A", name: "Bright Purple Mix", code: "FC56", hex: "#2c1f32",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc56" },
        { slot: "B", name: "Mustard Yellow", code: "28", hex: "#a77c27", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-28" },
        { slot: "C", name: "Light Purple Mix", code: "FC9", hex: "#382b38",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc9" },
        { slot: "D", name: "Medium Yellow", code: "66", hex: "#c6b05a", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-66" },
        { slot: "E", name: "Bright Pink Mix", code: "FC22", hex: "#71364d",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc22" },
        { slot: "F", name: "Pale Lemon", code: "96", hex: "#b9a774", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-96" },
        { slot: "G", name: "Dark Green", code: "82", hex: "#233735", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-82" },
        { slot: "H", name: "Dark Teal", code: "141", hex: "#3f5e58", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-141" },
      ],
    },
    {
      id: "shetland-naturals",
      wool: "uradale-yarns-2ply-jumper-weight",
      name: "Shetland Naturals",
      brand: "Uradale",
      yarn: "2ply Jumper Weight, organic",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      // Five yarns doing the work of eight, so several slots share a shade.
      balls: { A: { small: 2, medium: 2, large: 2 }, B: 1, D: 1, E: 1, F: 1 },
      shades: [
        { slot: "A", name: "Graeff (Shetland black)", hex: "#352f30", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-graeff-shetland-black" },
        { slot: "B", name: "Laebrak (dark grey)", hex: "#71869a", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-laebrak-dark-grey" },
        { slot: "C", name: "Graeff (Shetland black)", hex: "#352f30", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-graeff-shetland-black" },
        { slot: "D", name: "Glansin (light grey)", hex: "#c2c2c1", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-glansin-light-grey" },
        { slot: "E", name: "Moorit (Shetland brown)", hex: "#565352", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-moorit-shetland-brown" },
        { slot: "F", name: "Flukkra (natural white)", hex: "#cdcfc1", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-flukkra-natural-white" },
        { slot: "G", name: "Graeff (Shetland black)", hex: "#352f30", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-graeff-shetland-black" },
        { slot: "H", name: "Glansin (light grey)", hex: "#c2c2c1", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-glansin-light-grey" },
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
