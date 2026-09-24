import { Chart, HatPattern } from "./types";
import charts from "./sww23-buggiflooer-beanie.charts.json";

/**
 * Shetland Wool Week 2023: Alison Rendall's Buggiflooer Beanie.
 *
 * "Buggiflooer" is the Shetland word for sea campion, the coastal flower that
 * gives the design its large six-petalled motifs. The published charts are
 * shown in the Uradale colourway and name a main colour and contrast colour
 * beside every row; the chart JSON keeps those yarn letters, not sampled
 * display colours.
 *
 * Two of the five published colourways use only three physical yarns. Their
 * charts still use slots A-F, exactly as printed, but C-E point back to yarn B
 * and the shopping list counts that yarn only once. Aister 'oo's current shop
 * lists Mellishon under its 2ply Lambswool Jumper Weight while the 2023 pattern
 * calls the whole colourway 2ply Jumper Weight; the shade itself is therefore
 * linked to the current Mellishon library entry without rewriting the pattern.
 */
const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const sww23: HatPattern = {
  id: "sww23-buggiflooer-beanie",
  year: 2023,
  name: "Buggiflooer Beanie",
  designer: "Alison Rendall",
  story:
    "Buggiflooer is the Shetland word for sea campion, which grows in " +
    "abundance around the Shetland coast and inspired Alison Rendall's " +
    "Shetland Wool Week 2023 hat. She chose the name as part of her practice " +
    "of keeping Shetland words for birds, plants and places in everyday use.",
  patternUrl: "https://www.ravelry.com/patterns/library/buggiflooer-beanie",
  credit: "Design and pattern © Alison Rendall 2023",
  hashtag: "#alisonrendall",
  slots: ["A", "B", "C", "D", "E", "F"],

  sizes: [
    {
      id: "one",
      label: "One size",
      // The pattern gives no numerical head measurement, only the finished
      // brim/body circumferences; use the body circumference here.
      circumferenceCm: 50,
      lengthCm: 19,
      stitchesPer10cm: 34,
      roundsPer10cm: 38,
      needlesMm: 3,
    },
  ],

  colourways: [
    {
      id: "jamieson-smith",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Jamieson & Smith",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
      shades: [
        { slot: "A", name: "Dyed Black", code: "77", hex: "#1e1e1e",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-77" },
        { slot: "B", name: "Light Orangey Yellow", code: "90", hex: "#fda038",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-90" },
        { slot: "C", name: "Bright Turquoise Mix", code: "FC34", hex: "#5eb0b8",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc34" },
        { slot: "D", name: "Light Blue", code: "14", hex: "#9ac4de",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-14" },
        { slot: "E", name: "Pale Lemon", code: "96", hex: "#ead293",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-96" },
        { slot: "F", name: "Orangey Red", code: "9097", hex: "#c32c2c",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-9097" },
      ],
    },
    {
      id: "uradale",
      wool: "uradale-yarns-2ply-jumper-weight",
      name: "Uradale Yarns",
      brand: "Uradale Yarns",
      yarn: "2ply Jumper Weight, organic",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
      shades: [
        { slot: "A", name: "Graeff (Shetland black)", hex: "#352c2c",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-graeff-shetland-black" },
        { slot: "B", name: "Sea Pink Meal", hex: "#fea5d4",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-sea-pink-meal" },
        { slot: "C", name: "Laebrak (dark grey)", hex: "#605753",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-laebrak-dark-grey" },
        { slot: "D", name: "Beremeal (mid fawn)", hex: "#dfd4d5",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-beremeal-mid-fawn" },
        { slot: "E", name: "Flukkra (natural white)", hex: "#eef0e2",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-flukkra-natural-white" },
        { slot: "F", name: "Forget-Me-Not Heath", hex: "#90b9e6",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-forget-me-not-heath" },
      ],
    },
    {
      id: "jamiesons",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Jamieson's of Shetland",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1, F: 1 },
      shades: [
        { slot: "A", name: "Cashew", code: "342", hex: "#c9a975",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-342" },
        { slot: "B", name: "Ivy", code: "815", hex: "#56643e",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-815" },
        { slot: "C", name: "Sunrise", code: "187", hex: "#5a2425",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-187" },
        { slot: "D", name: "Rust", code: "578", hex: "#9c2726",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-578" },
        { slot: "E", name: "Ginger", code: "462", hex: "#c32321",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-462" },
        { slot: "F", name: "Mustard", code: "425", hex: "#d99221",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-425" },
      ],
    },
    {
      id: "aister-oo",
      wool: "aister-oo-2ply-jumper-weight",
      name: "Aister Oo",
      brand: "Aister Oo",
      yarn: "2ply Jumper Weight",
      url: "https://www.lodgeshetland.co.uk",
      ballMetres: 142,
      ballGrams: 50,
      // C-E use yarn B in the published three-colour version.
      balls: { A: 1, B: 1, F: 1 },
      shades: [
        { slot: "A", name: "Mellishon", hex: "#343639",
          source: "library", wool: "aister-oo-2ply-lambswool-jumper-weight-mellishon" },
        { slot: "B", name: "Moonshine", hex: "#e5f5d9",
          source: "library", wool: "aister-oo-2ply-jumper-weight-moonshine" },
        { slot: "C", name: "Moonshine", hex: "#e5f5d9",
          source: "library", wool: "aister-oo-2ply-jumper-weight-moonshine" },
        { slot: "D", name: "Moonshine", hex: "#e5f5d9",
          source: "library", wool: "aister-oo-2ply-jumper-weight-moonshine" },
        { slot: "E", name: "Moonshine", hex: "#e5f5d9",
          source: "library", wool: "aister-oo-2ply-jumper-weight-moonshine" },
        { slot: "F", name: "Froad", hex: "#ffba83",
          source: "library", wool: "aister-oo-2ply-jumper-weight-froad" },
      ],
    },
    {
      id: "laxdale",
      wool: "laxdale-yarn-2ply-jumper-weight",
      name: "Laxdale Yarn",
      brand: "Laxdale Yarn",
      yarn: "2ply Jumper Weight",
      url: "https://laxdaleyarn.com",
      ballMetres: 90,
      ballGrams: 25,
      // C-E use yarn B in the published three-colour version.
      balls: { A: 2, B: 2, F: 1 },
      shades: [
        { slot: "A", name: "Ruby Red", hex: "#4e0e1e",
          source: "library", wool: "laxdale-2ply-ruby-red" },
        { slot: "B", name: "Lichen", hex: "#ffcc5b",
          source: "library", wool: "laxdale-2ply-lichen" },
        { slot: "C", name: "Lichen", hex: "#ffcc5b",
          source: "library", wool: "laxdale-2ply-lichen" },
        { slot: "D", name: "Lichen", hex: "#ffcc5b",
          source: "library", wool: "laxdale-2ply-lichen" },
        { slot: "E", name: "Lichen", hex: "#ffcc5b",
          source: "library", wool: "laxdale-2ply-lichen" },
        { slot: "F", name: "Begonia", hex: "#ff893a",
          source: "library", wool: "laxdale-2ply-begonia" },
      ],
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 152, slot: "A" },
        { type: "chart", chart: "A", rows: [1, 10], repeats: 38 },
        { type: "rounds", count: 1, slot: "A" },
        {
          type: "shaping",
          slot: "A",
          to: 168,
          // K4, [KFB, K8] to last 4 sts, K4. KFB is kept as an
          // instruction-level op and expanded to its two resulting stitches.
          ops: [
            { work: "k", times: 4 },
            { repeat: [{ work: "kfb" }, { work: "k", times: 8 }], untilRemaining: 4 },
            { work: "k", times: 4 },
          ],
        },
      ],
    },
    {
      label: "Body",
      rounds: [
        { type: "chart", chart: "B", rows: [1, 4], repeats: 42 },
        {
          type: "shaping",
          slot: "A",
          to: 170,
          // [KFB, K83] twice.
          ops: [
            { repeat: [{ work: "kfb" }, { work: "k", times: 83 }], times: 2 },
          ],
        },
        { type: "chart", chart: "C", rows: [1, 25], repeats: 5 },
        {
          type: "shaping",
          slot: "A",
          to: 168,
          // [K2tog, K83] twice.
          ops: [
            { repeat: [{ work: "k2tog" }, { work: "k", times: 83 }], times: 2 },
          ],
        },
        { type: "chart", chart: "D", rows: [1, 4], repeats: 42 },
      ],
    },
    {
      label: "Crown",
      rounds: [
        { type: "rounds", count: 1, slot: "A" },
        {
          type: "shaping",
          slot: "A",
          to: 154,
          // [K10, K2tog] to end: fourteen repeats.
          ops: [
            { repeat: [{ work: "k", times: 10 }, { work: "k2tog" }], times: 14 },
          ],
        },
        { type: "chart", chart: "E", rows: [1, 26], repeats: 7 },
        {
          type: "shaping",
          slot: "D",
          to: 7,
          // The pattern moves the first unknitted stitch to the end of the
          // previous round before working K2tog tbl all the way round. That
          // is a property of this round, not of K2tog tbl in general.
          borrow: -1,
          ops: [{ repeat: [{ work: "k2togtbl" }], times: 7 }],
        },
      ],
    },
  ],
};

export default sww23;
