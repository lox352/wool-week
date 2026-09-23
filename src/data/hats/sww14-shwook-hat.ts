import { Chart, HatPattern, Section } from "./types";
import charts from "./sww14-shwook-hat.charts.json";

/**
 * Shetland Wool Week 2014: Hazel Tindall's Shwook Hat.
 *
 * This is the first imported hat whose sizes are genuinely different
 * knitting. Size 1 is deliberately shortened: it starts at Chart B and has
 * 112 -> 140 stitches before the colourwork. Sizes 2 and 3 use the longer
 * A, B, A, C, D sequence and 134 -> 168 stitches. The site therefore keeps
 * Size 1's round script on the size instead of pretending that the needle
 * choice alone changes it.
 *
 * The leaflet says "m1" in its written increase round but defines increasing
 * as knitting into the front and back of the stitch. These are encoded as
 * KFB instructions so the knitting UI says what the pattern tells the knitter
 * to do, while the stitch graph still gets the second loop.
 *
 * Three inconsistencies in the source are retained as provenance rather than
 * hidden: the summary table says Size 3 uses 3.25mm while the detailed needle
 * section and its 31/37 tension use 3.5mm (we use the detailed 3.5mm); Chart
 * D's printed count table twice says 42 (38:48), although the chart and
 * surrounding arithmetic give 42 (48:48); and the generic finishing text says
 * to thread through 8 stitches although Size 1's preceding line leaves 7.
 */
const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const size1Sections: Section[] = [
  {
    label: "Rib",
    rounds: [
      { type: "castOn", count: 112, slot: "A" },
      { type: "rounds", count: 10, slot: "A", sequence: ["k", "p"] },
      {
        type: "shaping", slot: "A", to: 140,
        // The leaflet writes these as m1s but defines every increase as
        // knitting into the front and back of the stitch: 28 KFBs.
        ops: [
          { work: "k", times: 1 }, { work: "kfb" },
          { repeat: [{ work: "k", times: 3 }, { work: "kfb" }], times: 26 },
          { work: "k", times: 2 }, { work: "kfb" }, { work: "k", times: 3 },
        ],
      },
      { type: "rounds", count: 1, slot: "A" },
    ],
  },
  {
    label: "Body",
    rounds: [
      { type: "rounds", count: 1, slot: "C" },
      { type: "chart", chart: "B", rows: [1, 13], repeats: 5 },
      { type: "rounds", count: 1, slot: "C" },
      {
        type: "shaping", slot: "B", to: 138,
        ops: [
          { work: "k", times: 3 },
          { work: "k2tog" },
          { work: "k", times: 131 },
          { work: "k2tog" },
          { work: "k", times: 2 },
        ],
      },
      { type: "chart", chart: "A", rows: [1, 4], repeats: 23 },
      { type: "rounds", count: 1, slot: "B" },
      {
        type: "shaping", slot: "A", to: 120,
        ops: [
          { work: "k", times: 9 },
          { repeat: [{ work: "k2tog" }, { work: "k", times: 5 }], times: 18 },
          { work: "k", times: 3 },
        ],
      },
      { type: "chart", chart: "C", rows: [1, 13], repeats: 5 },
      { type: "rounds", count: 1, slot: "A" },
      {
        type: "shaping", slot: "B", to: 112,
        ops: [
          { work: "k", times: 7 },
          { repeat: [{ work: "k2tog" }, { work: "k", times: 13 }], times: 7 },
          { work: "k2tog" },
          { work: "k", times: 6 },
        ],
      },
      { type: "rounds", count: 1, slot: "B" },
    ],
  },
  {
    label: "Crown",
    rounds: [
      { type: "chart", chart: "D", rows: [1, 13], repeats: 7 },
      { type: "rounds", count: 1, slot: "A" },
      {
        type: "shaping", slot: "A", to: 7,
        ops: [{ repeat: [{ work: "k2tog" }], times: 7 }],
      },
    ],
  },
];
const standardSections: Section[] = [
  {
    label: "Rib",
    rounds: [
      { type: "castOn", count: 134, slot: "A" },
      { type: "rounds", count: 10, slot: "A", sequence: ["k", "p"] },
      {
        type: "shaping", slot: "A", to: 168,
        // 34 KFB increases. The written "m1" notation is defined on page 2
        // as knitting into the front and back of the stitch.
        ops: [
          { work: "k", times: 1 }, { work: "kfb" },
          { repeat: [{ work: "k", times: 3 }, { work: "kfb" }], times: 32 },
          { work: "k", times: 1 }, { work: "kfb" }, { work: "k", times: 2 },
        ],
      },
      { type: "rounds", count: 1, slot: "A" },
      { type: "rounds", count: 2, slot: "B" },
      { type: "chart", chart: "A", rows: [1, 4], repeats: 28 },
      { type: "rounds", count: 2, slot: "B" },
      { type: "rounds", count: 2, slot: "C" },
    ],
  },
  {
    label: "Body",
    rounds: [
      { type: "chart", chart: "B", rows: [1, 13], repeats: 6 },
      { type: "rounds", count: 2, slot: "C" },
      { type: "rounds", count: 2, slot: "B" },
      { type: "chart", chart: "A", rows: [1, 4], repeats: 28 },
      { type: "rounds", count: 2, slot: "B" },
      { type: "rounds", count: 1, slot: "A" },
      {
        type: "shaping", slot: "A", to: 144,
        ops: [
          { work: "k", times: 3 },
          { repeat: [{ work: "k2tog" }, { work: "k", times: 5 }], times: 23 },
          { work: "k2tog" },
          { work: "k", times: 2 },
        ],
      },
      { type: "chart", chart: "C", rows: [1, 13], repeats: 6 },
      { type: "rounds", count: 2, slot: "A" },
      {
        type: "shaping", slot: "B", to: 128,
        ops: [
          { work: "k", times: 4 },
          { repeat: [{ work: "k2tog" }, { work: "k", times: 7 }], times: 15 },
          { work: "k2tog" },
          { work: "k", times: 3 },
        ],
      },
      { type: "rounds", count: 1, slot: "B" },
    ],
  },
  {
    label: "Crown",
    rounds: [
      { type: "chart", chart: "D", rows: [1, 13], repeats: 8 },
      { type: "rounds", count: 1, slot: "A" },
      {
        type: "shaping", slot: "A", to: 8,
        ops: [{ repeat: [{ work: "k2tog" }], times: 8 }],
      },
    ],
  },
];

const sww14: HatPattern = {
  id: "sww14-shwook-hat",
  year: 2014,
  name: "Shwook Hat",
  designer: "Hazel Tindall",
  story:
    "A slouch hat in three sizes and three suggested colour combinations, " +
    "designed by Hazel Tindall for Shetland Wool Week 2014.",
  patternUrl: "https://www.hazeltindall.com",
  credit: "Shwook hat © Hazel Tindall, 2014",
  slots: ["A", "B", "C", "D", "E"],

  sizes: [
    {
      id: "size1",
      label: "Size 1",
      toFitCm: 44,
      circumferenceCm: 37,
      circumferenceLabel: "Unstretched rib circumference",
      lengthCm: 18.5,
      stitchesPer10cm: 33,
      roundsPer10cm: 34,
      needlesMm: 3,
      ribNeedlesMm: 2.5,
      sections: size1Sections,
    },
    {
      id: "size2",
      label: "Size 2",
      toFitCm: 54,
      circumferenceCm: 40,
      circumferenceLabel: "Unstretched rib circumference",
      lengthCm: 23,
      stitchesPer10cm: 33,
      roundsPer10cm: 34,
      needlesMm: 3,
      ribNeedlesMm: 2.5,
    },
    {
      id: "size3",
      label: "Size 3",
      toFitCm: 62,
      circumferenceCm: 46,
      circumferenceLabel: "Unstretched rib circumference",
      lengthCm: 24,
      stitchesPer10cm: 31,
      roundsPer10cm: 37,
      // The page-1 summary says 3.25mm; page 2 says 3.50mm and gives the
      // matching 31 sts / 37 rows tension on 3.50mm, so use the detailed spec.
      needlesMm: 3.5,
      ribNeedlesMm: 2.75,
    },
  ],

  colourways: [
    {
      id: "js-1",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Colour 1",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Moorit", code: "4", hex: "#834f3d",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-4" },
        { slot: "B", name: "Light Fawn", code: "202", hex: "#c9c0a4",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-202" },
        { slot: "C", name: "Dark Grey", code: "54", hex: "#5c5b57",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-54" },
        { slot: "D", name: "Natural White", code: "1A", hex: "#efe8c9",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1a" },
        { slot: "E", name: "Dyed Shetland Black", code: "5", hex: "#614030",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-5" },
      ],
    },
    {
      id: "js-2",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Colour 2",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Medium Green", code: "118", hex: "#5f9251",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-118" },
        { slot: "B", name: "Mustard Yellow", code: "28", hex: "#e5ac35",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-28" },
        { slot: "C", name: "Dark Red", code: "9113", hex: "#ac262e",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-9113" },
        { slot: "D", name: "Natural White", code: "1A", hex: "#efe8c9",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1a" },
        { slot: "E", name: "Navy", code: "21", hex: "#293e6a",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-21" },
      ],
    },
    {
      id: "js-3",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Colour 3",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Light Grey", code: "203", hex: "#a7a89f",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-203" },
        { slot: "B", name: "Medium Green", code: "118", hex: "#5f9251",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-118" },
        { slot: "C", name: "Natural White", code: "1A", hex: "#efe8c9",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1a" },
        { slot: "D", name: "Navy", code: "21", hex: "#293e6a",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-21" },
        { slot: "E", name: "Mustard Yellow", code: "28", hex: "#e5ac35",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-28" },
      ],
    },
    {
      id: "jamiesons-1",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colour 1",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Moorit", code: "108", hex: "#725c49",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-108" },
        { slot: "B", name: "Eesit", code: "105", hex: "#d7cdb3",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-105" },
        { slot: "C", name: "Shaela", code: "102", hex: "#625d54",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-102" },
        { slot: "D", name: "Natural White", code: "104", hex: "#eae5c6",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-104" },
        { slot: "E", name: "Shetland Black", code: "101", hex: "#2d2824",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-101" },
      ],
    },
    {
      id: "jamiesons-2",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colour 2",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Leaf", code: "788", hex: "#2c4828",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-788" },
        { slot: "B", name: "Gold", code: "289", hex: "#cfb151",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-289" },
        { slot: "C", name: "Maroon", code: "595", hex: "#571a22",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-595" },
        { slot: "D", name: "White", code: "304", hex: "#f1f1e7",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-304" },
        { slot: "E", name: "Prussian", code: "726", hex: "#373e59",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-726" },
      ],
    },
    {
      id: "jamiesons-3",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colour 3",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Granite", code: "122", hex: "#c1c1b5",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-122" },
        { slot: "B", name: "Maroon", code: "595", hex: "#571a22",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-595" },
        { slot: "C", name: "White", code: "304", hex: "#f1f1e7",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-304" },
        { slot: "D", name: "Prussian", code: "726", hex: "#373e59",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-726" },
        { slot: "E", name: "Gold", code: "289", hex: "#cfb151",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-289" },
      ],
    }
,
    {
      id: "organic-fawn",
      name: "Organic · Fawn",
      brand: "Shetland Organics",
      yarn: "Organic Jumper Weight",
      url: "https://www.shetlandorganics.com",
      ballGrams: 50,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Moorit", hex: "#4a3930", source: "approximate" },
        { slot: "B", name: "Fawn", hex: "#b9a488", source: "approximate" },
        { slot: "C", name: "Dark Grey", hex: "#605753", source: "approximate" },
        { slot: "D", name: "Flukkra (white)", hex: "#eef0e2", source: "approximate" },
        { slot: "E", name: "Shetland Black", hex: "#352c2c", source: "approximate" },
      ],
    },
    {
      id: "organic-silver",
      name: "Organic · Silver",
      brand: "Shetland Organics",
      yarn: "Organic Jumper Weight",
      url: "https://www.shetlandorganics.com",
      ballGrams: 50,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Moorit", hex: "#4a3930", source: "approximate" },
        { slot: "B", name: "Silver", hex: "#9b9893", source: "approximate" },
        { slot: "C", name: "Dark Grey", hex: "#605753", source: "approximate" },
        { slot: "D", name: "Flukkra (white)", hex: "#eef0e2", source: "approximate" },
        { slot: "E", name: "Shetland Black", hex: "#352c2c", source: "approximate" },
      ],
    },
  ],

  charts: chartsOf(),
  sections: standardSections,
};

export default sww14;
