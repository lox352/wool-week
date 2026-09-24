import { Chart, HatPattern } from "./types";
import charts from "./sww16-crofthoose-hat.charts.json";

/**
 * Shetland Wool Week 2016: Ella Gordon's Crofthoose Hat.
 *
 * The leaflet prints the main chart four times, one per sample colourway, and
 * a separate fancy crown. Rows 1-8 are the corrugated rib; row 9 is the
 * written increase round; rows 10-41 form the crofthouse body.
 *
 * It gives a 22-inch head size and gauge but no finished circumference or
 * length. The dimensions below are therefore the pattern's own arithmetic:
 * 168 body stitches / 26 sts per 10cm = 64.6cm, and 64 worked rounds /
 * 26 rounds per 10cm = 24.6cm. They are not measurements added from elsewhere.
 *
 * Shetland Organics and the naturally dyed Spindrift Crafts set are retained
 * as historical sample colourways. Their display colours come from their
 * printed chart versions because there is no current catalogue entry to match.
 */
const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const sww16: HatPattern = {
  id: "sww16-crofthoose-hat",
  year: 2016,
  name: "Crofthoose Hat",
  designer: "Ella Gordon",
  story:
    "Ella Gordon's official Shetland Wool Week 2016 hat turns the traditional " +
    "Shetland crofthouse into a contemporary Fair Isle motif, worked with " +
    "corrugated ribbing, two-colour Fair Isle and a patterned crown.",
  patternUrl: "https://www.ravelry.com/patterns/library/crofthoose-hat",
  credit: "© 2016 Ella Gordon Designs",
  hashtag: "#crofthoosehat",
  slots: ["A", "B", "C", "D", "E"],

  sizes: [
    {
      id: "one",
      label: "Average adult",
      toFitCm: 55.9,
      circumferenceCm: 64.6,
      lengthCm: 24.6,
      lengthEstimated: true,
      circumferenceEstimated: true,
      measurementNote: "Body circumference and length are calculated from stitch/round counts and tension, not measured finished dimensions. Swatch and check fit before starting.",
      stitchesPer10cm: 26,
      roundsPer10cm: 26,
      needlesMm: 3.5,
      ribNeedlesMm: 3,
    },
  ],

  colourways: [
    {
      id: "jamieson-smith",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Colourway 1",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Marled Brown Mix", code: "FC58", hex: "#886555",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc58" },
        { slot: "B", name: "Blue Mix", code: "FC39", hex: "#40778e",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc39" },
        { slot: "C", name: "Bright Grass Green", code: "FC11", hex: "#678322",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc11" },
        { slot: "D", name: "Grey Fawn", code: "2", hex: "#ebd8b6",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-2" },
        { slot: "E", name: "Light Fawn", code: "202", hex: "#c9c0a4",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-202" },
      ],
    },
    {
      id: "shetland-organics",
      name: "Colourway 2",
      brand: "Shetland Organics",
      yarn: "Shetland Organic Jumper Weight",
      url: "https://www.shetlandorganics.com",
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Shetland Black", hex: "#443721", source: "approximate" },
        { slot: "B", name: "Moorit", hex: "#60441b", source: "approximate" },
        { slot: "C", name: "Fawn", hex: "#9a7f55", source: "approximate" },
        { slot: "D", name: "Mid Grey", hex: "#9b9186", source: "approximate" },
        { slot: "E", name: "White", hex: "#e1d4bf", source: "approximate" },
      ],
    },
    {
      id: "jamiesons",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colourway 3",
      brand: "Jamieson's of Shetland",
      yarn: "Shetland Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Purple Heather", code: "239", hex: "#5f323a",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-239" },
        { slot: "B", name: "Osprey", code: "238", hex: "#7d6965",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-238" },
        { slot: "C", name: "Titanic", code: "151", hex: "#5d7477",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-151" },
        { slot: "D", name: "Dewdrop", code: "720", hex: "#acc0b7",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-720" },
        { slot: "E", name: "Pebble", code: "127", hex: "#d2cfbb",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-127" },
      ],
    },
    {
      id: "naturally-dyed",
      name: "Colourway 4",
      brand: "Spindrift Crafts",
      yarn: "Naturally dyed 2ply Jumper Weight",
      url: "https://www.spindriftcrafts.com",
      ballGrams: 25,
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
      shades: [
        { slot: "A", name: "Woad and Marigold", hex: "#7d8897", source: "approximate" },
        { slot: "B", name: "Madder 1", hex: "#cc4a2b", source: "approximate" },
        { slot: "C", name: "Madder 2", hex: "#f48e58", source: "approximate" },
        { slot: "D", name: "Woad", hex: "#786551", source: "approximate" },
        { slot: "E", name: "Willow Bark", hex: "#d6d9d8", source: "approximate" },
      ],
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 120, slot: "A" },
        { type: "chart", chart: "A", rows: [1, 8], repeats: 10 },
        {
          type: "shaping",
          slot: "A",
          to: 168,
          ops: [
            {
              repeat: [
                { work: "k", times: 3 },
                { work: "m1" },
                { work: "k", times: 2 },
                { work: "m1" },
              ],
              times: 24,
            },
          ],
        },
      ],
    },
    {
      label: "Body",
      rounds: [
        { type: "chart", chart: "A", rows: [10, 41], repeats: 14 },
      ],
    },
    {
      label: "Crown",
      rounds: [
        {
          type: "shaping",
          slot: "A",
          to: 144,
          ops: [
            { work: "k", times: 3 },
            {
              repeat: [
                { work: "k2tog" },
                { work: "k", times: 5 },
              ],
              times: 23,
            },
            { work: "k2tog" },
            { work: "k", times: 2 },
          ],
        },
        { type: "chart", chart: "B", rows: [2, 22], repeats: 6 },
        {
          type: "shaping",
          slot: "A",
          to: 6,
          ops: [{ repeat: [{ work: "k2tog" }], times: 6 }],
        },
      ],
    },
  ],
};

export default sww16;
