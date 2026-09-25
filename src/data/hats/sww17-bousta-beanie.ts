import { Chart, HatPattern } from "./types";
import charts from "./sww17-bousta-beanie.charts.json";

/**
 * Shetland Wool Week 2017: Gudrun Johnston's Bousta Beanie.
 *
 * The three-colour motif was inspired by the changing palette of the Shetland
 * landscape: sea blues, mossy greens and browns, and the brighter colours of
 * wildflowers and heather. The long, slouchy shape is deliberate so it can be
 * pulled down over the ears in wind and cold.
 *
 * Uradale's 2017 sample calls its natural shades Oatmeal, Fawn and Moorit.
 * The current range calls the corresponding light-oat shade Aetmeal (the
 * Shetland form of "oatmeal") and its medium fawn Beremeal; those current
 * library entries are used here so the same wool has one colour across hats.
 */
const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const sww17: HatPattern = {
  id: "sww17-bousta-beanie",
  year: 2017,
  name: "Bousta Beanie",
  designer: "Gudrun Johnston",
  story:
    "Gudrun Johnston took the Bousta Beanie's three-colour Fair Isle motif " +
    "from the changing colours of Shetland: the blues of the sea, mossy " +
    "greens and browns of the hills, and bright summer wildflowers and " +
    "heather. Its slouchy shape can be pulled down over the ears in cold, " +
    "windy weather.",
  patternUrl:
    "https://www.shetlandwoolweek.com/wp-content/uploads/2017/10/Bousta-Beanie-hat-pattern.pdf",
  credit: "© Gudrun Johnston",
  hashtag: "#boustabeanie",
  // The stitches as this pattern's own abbreviations define them.
  stitchNotes: {
    m1: {
      lean: "left",
      how:
        "Lift the strand between stitches from front to back onto the left " +
        "needle, and knit this loop through the back.",
    },
    k2tog: { how: "Knit the next 2 stitches together." },
  },
  slots: ["A", "B", "C"],

  sizes: [
    {
      id: "one",
      label: "Average adult",
      // The leaflet gives only a descriptive head size, not a measurement.
      circumferenceCm: 46.5,
      lengthCm: 25,
      stitchesPer10cm: 31,
      roundsPer10cm: 31,
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
      balls: { A: 2, B: 1, C: 1 },
      shades: [
        { slot: "A", name: "Blue Mix", code: "FC39", hex: "#40778e",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc39" },
        { slot: "B", name: "Dark Azure Blue", code: "142", hex: "#1e68a0",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-142" },
        { slot: "C", name: "Dark Teal Blue", code: "FC41", hex: "#1b4159",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc41" },
      ],
    },
    {
      id: "jamiesons",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colourway 2",
      brand: "Jamieson's of Shetland",
      yarn: "Shetland Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      balls: { A: 2, B: 1, C: 1 },
      shades: [
        { slot: "A", name: "Mirry Dancers", code: "1400", hex: "#232321",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-1400" },
        { slot: "B", name: "Wren", code: "246", hex: "#998266",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-246" },
        { slot: "C", name: "Burnt Ochre", code: "423", hex: "#b68f49",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-423" },
      ],
    },
    {
      id: "uradale",
      wool: "uradale-yarns-2ply-jumper-weight",
      name: "Colourway 3",
      brand: "Uradale Yarns",
      yarn: "Organic Jumper Weight, undyed",
      url: "https://www.uradale.com",
      ballMetres: 173,
      ballGrams: 50,
      balls: { A: 1, B: 1, C: 1 },
      shades: [
        // Printed in 2017 as "Oatmeal".
        { slot: "A", name: "Aetmeal (light fawn)", hex: "#f6efe3",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-aetmeal-light-fawn" },
        // Printed in 2017 simply as "Fawn"; the current medium-fawn natural
        // shade is Beremeal.
        { slot: "B", name: "Beremeal (mid fawn)", hex: "#dfd4d5",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-beremeal-mid-fawn" },
        { slot: "C", name: "Moorit (Shetland brown)", hex: "#4a3930",
          source: "library", wool: "uradale-yarns-2ply-jumper-weight-moorit-shetland-brown" },
      ],
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 120, slot: "C" },
        { type: "rounds", count: 1, slot: "A" },
        // Round 2 establishes K2, P2 rib and is repeated eleven more times.
        { type: "rounds", count: 12, slot: "A", sequence: ["k", "k", "p", "p"] },
        {
          type: "shaping",
          slot: "A",
          to: 144,
          // Round 14, exactly as its 20-stitch repeat is written. Each repeat
          // makes four new stitches while preserving the rib's knits/purls.
          ops: [
            {
              repeat: [
                { work: "k", times: 1 },
                { work: "m1" },
                { work: "k", times: 1 },
                { work: "p", times: 2 },
                { work: "k", times: 2 },
                { work: "p", times: 2 },
                { work: "k", times: 1 },
                { work: "m1" },
                { work: "k", times: 1 },
                { work: "p", times: 2 },
                { work: "k", times: 1 },
                { work: "m1" },
                { work: "k", times: 1 },
                { work: "p", times: 2 },
                { work: "k", times: 1 },
                { work: "m1" },
                { work: "k", times: 1 },
                { work: "p", times: 2 },
              ],
              times: 6,
            },
          ],
        },
      ],
    },
    {
      label: "Body",
      rounds: [
        // Rounds 1-14 three times, then rounds 1-7 once more.
        { type: "chart", chart: "A", rows: [1, 14], repeats: 36, passes: 3 },
        { type: "chart", chart: "A", rows: [1, 7], repeats: 36 },
      ],
    },
    {
      label: "Crown",
      rounds: [
        { type: "chart", chart: "B", rows: [1, 10], repeats: 12 },
        {
          type: "shaping",
          slot: "B",
          to: 48,
          // Before round 11 the marker is removed, one stitch is slipped
          // purlwise and the marker replaced: the new round therefore begins
          // one stitch after the old opening and wraps its last decrease over
          // the old first stitch.
          borrow: -1,
          ops: [
            {
              repeat: [
                { work: "k", times: 1 },
                { work: "k2tog" },
              ],
              times: 24,
            },
          ],
        },
        { type: "rounds", count: 1, slot: "B" },
        {
          type: "shaping",
          slot: "B",
          to: 24,
          ops: [{ repeat: [{ work: "k2tog" }], times: 24 }],
        },
        { type: "rounds", count: 1, slot: "B" },
        {
          type: "shaping",
          slot: "B",
          to: 12,
          ops: [{ repeat: [{ work: "k2tog" }], times: 12 }],
        },
      ],
    },
  ],
};

export default sww17;
