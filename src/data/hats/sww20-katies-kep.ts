import { Chart, HatPattern } from "./types";
import charts from "./sww20-katies-kep.charts.json";

/**
 * Shetland Wool Week 2020: Katie's Kep.
 *
 * The first of Wilma Malcolmson's two keps here, and Da Crofter's Kep the
 * year after is built on the same skeleton: cast on 136, a four-stitch
 * corrugated rib, the same increase round to 168, a twenty-four stitch body
 * repeated seven times, and a crown chart that does its own first decrease -
 * worked over twenty-eight stitches a repeat and leaving twenty-four, so the
 * 168 the body carries becomes the 144 the pattern prints on row 1 rather
 * than in a round of its own. 2021 changed the charts and kept the frame.
 *
 * One size, which is the only hat here that is: 168 stitches at the thirty
 * to ten centimetres the pattern asks for is fifty-six round, which is the
 * fifty-six it prints.
 *
 * Its charts are drawn in five greys rather than in colour, and the key on
 * the page names them Yarn A to Yarn E, so the greys are the yarn letters
 * and the colours come out of the yarn library - see data/yarns. Every row
 * also carries its contrast yarn as a letter down the right-hand edge, which
 * is a check on the greys rather than a decoration: all seventy-one rows of
 * the three charts agree with it, and the written instructions agree too
 * where they name a yarn ("join in yarn B" at chart A, "join in yarn D" at
 * chart C). The background is yarn A throughout, which is why A is the only
 * slot that takes two balls.
 *
 * Reading it needed one change to scripts/extract_chart.py. This leaflet
 * prints its charts on a tinted panel, and a panel is one big rectangle: read
 * as a run of cells the way a word processor's shading has to be, it came out
 * as three thousand stitches and buried every swatch in the key. Runs are now
 * only read where the chart is a table, which is what --ruled already meant.
 * That fixed 2021's page too, which is the same leaflet design and had
 * stopped extracting; every chart already committed still comes out of the
 * tool cell for cell.
 */

const chartsOf = (): Chart[] =>
  charts.charts.map((chart) => ({
    id: chart.id,
    rows: chart.rows as Chart["rows"],
  }));

const sww20: HatPattern = {
  id: "sww20-katies-kep",
  year: 2020,
  name: "Katie's Kep",
  designer: "Wilma Malcolmson",
  story:
    "Wilma named this kep after her mother Katie, who taught her these " +
    "patterns when she was a peerie lass because they were the ones Katie " +
    "liked best. Katie was one of that large body of professional knitters " +
    "without whom Shetland's colour work and lace might not have come down " +
    "to us as alive as they are, and the hat is Wilma's tribute to all of " +
    "them - the designers and artists of Shetland whose names are known, and " +
    "the many more whose names are not.",
  patternUrl: "https://www.ravelry.com/patterns/library/katies-kep",
  credit: "© Wilma Malcolmson",
  hashtag: "#katieskep",
  // The stitches as this pattern's own abbreviations define them.
  stitchNotes: {
    m1: {
      lean: "right",
      how:
        "Pick up the strand between stitches with the left needle from back " +
        "to front, and knit it.",
      note:
        "Picked up from back to front and knitted through the front, this " +
        "make-one leans to the right, unlike the front-to-back one many " +
        "patterns use.",
    },
    k2tog: { how: "Knit 2 stitches together as if they were one stitch." },
    sk2p: {
      how: "Slip 1, knit 2 stitches together, then pass the slipped stitch over.",
    },
  },
  slots: ["A", "B", "C", "D", "E"],

  sizes: [
    {
      id: "one",
      label: "One size",
      toFitCm: 56,
      circumferenceCm: 56,
      lengthCm: 20,
      stitchesPer10cm: 30,
      roundsPer10cm: 32,
      needlesMm: 3.25,
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
      shades: [
        // The pattern writes this one "001", which is how Jamieson & Smith
        // print their white; the library has it under its bare number.
        { slot: "A", name: "Bleached/Optic White", code: "1", hex: "#f0efe4",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1" },
        { slot: "B", name: "Cool Mid Purple", code: "123", hex: "#ac5c97",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-123" },
        { slot: "C", name: "Bright Green Mix", code: "1282", hex: "#779669",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1282" },
        { slot: "D", name: "Mid Purple Blue", code: "FC37", hex: "#394574",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc37" },
        { slot: "E", name: "Mid Marled Pink", code: "1283", hex: "#d28184",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1283" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "uradale",
      wool: "uradale-yarns-2ply-jumper-weight",
      name: "Colourway 2",
      brand: "Uradale Yarns",
      yarn: "2ply Jumper Weight",
      url: "https://www.uradale.com",
      ballMetres: 86,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Juniper Heath", hex: "#4061b1", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-juniper-heath" },
        { slot: "B", name: "Speedwell", hex: "#5fccff", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-speedwell" },
        { slot: "C", name: "Tormentil Heath", hex: "#d3a94e", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-tormentil-heath" },
        { slot: "D", name: "Speedwell Heath", hex: "#83c0e6", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-speedwell-heath" },
        { slot: "E", name: "Moss", hex: "#d1d67c", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-moss" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "shetland-handspun",
      name: "Colourway 3",
      brand: "Shetland Handspun",
      // Sold as a kit measured in metres rather than in balls - 137 for the
      // ground and 27 of each contrast - so there is no ball to describe.
      yarn: "Handspun 2ply, sold as a kit by the metre",
      url: "https://www.shetlandhandspun.com",
      shades: [
        // Naturally dyed and not in the library, so these are read off the
        // pattern's own photograph and from what each dye gives: onion skin
        // with cochineal is a warm rust, logwood a slate purple-grey, and
        // logwood over onion the olive between them. Moorit is undyed brown.
        { slot: "A", name: "Silver", hex: "#d6d0c4", source: "approximate" },
        { slot: "B", name: "Onion/Cochineal", hex: "#b5702f", source: "approximate" },
        { slot: "C", name: "Logwood", hex: "#7d8894", source: "approximate" },
        { slot: "D", name: "Moorit", hex: "#6b4a30", source: "approximate" },
        { slot: "E", name: "Logwood/Onion", hex: "#7d7449", source: "approximate" },
      ],
      balls: { A: 1, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "jamiesons",
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colourway 4",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Cosmos", code: "1340", hex: "#222325",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-1340" },
        { slot: "B", name: "Spice", code: "526", hex: "#c63d45",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-526" },
        { slot: "C", name: "Pacific", code: "763", hex: "#576375",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-763" },
        { slot: "D", name: "Madder", code: "587", hex: "#891e25",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-587" },
        { slot: "E", name: "Foxglove", code: "273", hex: "#875373",
          source: "library", wool: "jamieson-s-of-shetland-spindrift-273" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
  ],

  charts: chartsOf(),

  sections: [
    {
      label: "Brim",
      rounds: [
        { type: "castOn", count: 136, slot: "A" },
        { type: "chart", chart: "A", rows: [1, 8], repeats: 34 },
        {
          type: "shaping",
          slot: "A",
          to: 168,
          // Inc round: K5, m1, (k4, m1) to last 7 sts, k7.
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
      rounds: [{ type: "chart", chart: "B", rows: [1, 40], repeats: 7 }],
    },
    {
      label: "Crown",
      rounds: [
        // Chart C takes the 168 to 144 on its own first row and to 12 by its
        // last, so there is no separate decrease round in this one either.
        { type: "chart", chart: "C", rows: [1, 23], repeats: 6 },
      ],
    },
  ],
};

export default sww20;
