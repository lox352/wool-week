import { Chart, HatPattern } from "./types";
import charts from "./sww19-roadside-beanie.charts.json";

/**
 * SWW 2019, Roadside Beanie: Oliver Henry's sheep and fishing boats,
 * designed and knitted by Sandra Manson, charted by Ella Gordon.
 *
 * Six vector charts extracted by scripts/extract_sww19.py. The detached
 * left column of F contains real decreases, not a second key: together with
 * its staircase it consumes 20 stitches and ends with one per repeat.
 *
 * Preserve the leaflet's measurements as printed. Its 168 body stitches at
 * 32 sts/10cm imply 52.5cm, whereas it gives a finished circumference of
 * 58.5cm. Do not silently change its gauge or stitch counts to reconcile it.
 * It says medium adult without a numerical head measurement.
 *
 * Foula's colours reuse the existing approximate natural-wool palette.
 * Uradale's historic "Forget-me-not" and "Sea Pink" lack an unambiguous
 * match in the current catalogue (which uses Heath/Meal suffixes). Retain
 * their printed names and mark the display colours approximate; Forget-me-not
 * uses the current Heath blue as a stand-in, Sea Pink a muted pink from the
 * leaflet photograph. All other available shades are copied from the library.
 */
const sww19: HatPattern = {
  id: "sww19-roadside-beanie",
  year: 2019,
  name: "Roadside Beanie",
  designer: "Sandra Manson, for Oliver Henry",
  story: "Sheep and fishing boats recall Oliver Henry's life at Roadside, " +
    "his family croft in Hamnavoe on Burra Isle. Created for Shetland Wool " +
    "Week's tenth year, the beanie was designed and knitted by Sandra " +
    "Manson and charted by Ella Gordon.",
  patternUrl: "https://www.ravelry.com/patterns/library/roadside-beanie-2",
  credit: "© Sandra Manson; charted by Ella Gordon; for Oliver Henry",
  hashtag: "#roadsidebeanie",
  // The stitches as this pattern's own abbreviations define them. Its
  // make-one does not say which way the bar is lifted, so it is not leant.
  stitchNotes: {
    m1: {
      how:
        "Use the left needle to lift the bar between stitches, and knit into " +
        "the front of it.",
    },
    k2tog: { how: "Knit 2 stitches together as if they were one." },
  },
  slots: ["A", "B", "C", "D", "E", "F", "G"],
  sizes: [{
    id: "one",
    label: "Medium adult",
    circumferenceCm: 58.5,
    measurementNote: "The leaflet prints 58.5cm, but 168 stitches at its stated 32 sts/10cm imply 52.5cm. Both printed figures are retained; swatch and check fit before starting.",
    lengthCm: 23,
    stitchesPer10cm: 32,
    roundsPer10cm: 28,
    needlesMm: 3,
    ribNeedlesMm: 2.5,
  }],
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
      shades: [
        { slot: "A", name: "Light Marled Blue Green", code: "1280", hex: "#93a092",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1280" },
        { slot: "B", name: "Brown", code: "80", hex: "#452c29",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-80" },
        { slot: "C", name: "Bright Purple Mix", code: "FC56", hex: "#4e3858",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc56" },
        { slot: "D", name: "Light Turquoise", code: "75", hex: "#75bfc7",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-75" },
        { slot: "E", name: "Pale Lemon", code: "96", hex: "#ead293",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-96" },
        { slot: "F", name: "Bleached/Optic White", code: "1", hex: "#f0efe4",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1" },
        { slot: "G", name: "Light Grey Green Mix", code: "FC62", hex: "#839882",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc62" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1 },
    },
    {
      id: "foula",
      name: "Colourway 2",
      brand: "Foula Wool",
      yarn: "Jumper Weight",
      url: "https://www.foulawool.co.uk",
      ballMetres: 90,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Moorit", hex: "#6b472b",
          source: "approximate" },
        { slot: "B", name: "Black", hex: "#2a2724",
          source: "approximate" },
        { slot: "C", name: "Mioget", hex: "#c9a961",
          source: "approximate" },
        { slot: "D", name: "Grey", hex: "#8c8a85",
          source: "approximate" },
        { slot: "E", name: "Light Grey", hex: "#c2c0ba",
          source: "approximate" },
        { slot: "F", name: "White", hex: "#efe9dd",
          source: "approximate" },
        { slot: "G", name: "Fawn", hex: "#b9a488",
          source: "approximate" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1 },
    },
    {
      id: "jamiesons",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colourway 3",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Twilight", code: "175", hex: "#7e8596",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-175" },
        { slot: "B", name: "Grouse", code: "235", hex: "#3c312a",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-235" },
        { slot: "C", name: "Moss", code: "147", hex: "#515e36",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-147" },
        { slot: "D", name: "Dewdrop", code: "720", hex: "#acc0b7",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-720" },
        { slot: "E", name: "Mist", code: "180", hex: "#b1abaf",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-180" },
        { slot: "F", name: "White", code: "304", hex: "#f1f1e7",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-304" },
        { slot: "G", name: "Autumn", code: "998", hex: "#866b3d",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-998" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1 },
    },
    {
      id: "uradale",
      wool: "uradale-yarns-2ply-jumper-weight",
      name: "Colourway 4",
      brand: "Uradale Yarns",
      yarn: "Jumper Weight Organic Yarn",
      url: "https://www.uradale.com",
      ballMetres: 173,
      ballGrams: 50,
      shades: [
        { slot: "A", name: "Forget-me-not", hex: "#90b9e6",
          source: "approximate" },
        { slot: "B", name: "Bilberry Heath", hex: "#564e97",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-bilberry-heath" },
        { slot: "C", name: "Sea Pink", hex: "#d991a2",
          source: "approximate" },
        { slot: "D", name: "Speedwell", hex: "#5fccff",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-speedwell" },
        { slot: "E", name: "Ling Heath", hex: "#ac5284",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-ling-heath" },
        { slot: "F", name: "Flukkra (natural white)", hex: "#eef0e2",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-flukkra-natural-white" },
        { slot: "G", name: "Sundew Heath", hex: "#9ebf72",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-sundew-heath" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1 },
    },
  ],
  charts: charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  })),
  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 132, slot: "A" },
        { type: "chart", chart: "A", rows: [1, 14], repeats: 33 },
        {
          type: "shaping", slot: "A", to: 168,
          ops: [
            { work: "k", times: 2 },
            { repeat: [{ work: "m1" }, { work: "k", times: 3 }], times: 6 },
            { repeat: [{ work: "m1" }, { work: "k", times: 4 }], times: 23 },
            { repeat: [{ work: "m1" }, { work: "k", times: 3 }], times: 6 },
            { work: "m1" },
            { work: "k", times: 2 },
          ],
        },
      ],
    },
    {
      label: "Body",
      rounds: [
        { type: "chart", chart: "B", rows: [1, 3], repeats: 84 },
        { type: "chart", chart: "C", rows: [1, 16], repeats: 6 },
        { type: "chart", chart: "D", rows: [1, 7], repeats: 42 },
        { type: "chart", chart: "E", rows: [1, 12], repeats: 14 },
      ],
    },
    {
      label: "Crown",
      rounds: [
        {
          type: "shaping", slot: "G", to: 140,
          ops: [
            { work: "k", times: 1 }, { work: "k2tog" },
            { repeat: [{ work: "k", times: 4 }, { work: "k2tog" }], untilRemaining: 3 },
            { work: "k", times: 3 },
          ],
        },
        { type: "chart", chart: "F", rows: [1, 20], repeats: 7 },
      ],
    },
  ],
};

export default sww19;
