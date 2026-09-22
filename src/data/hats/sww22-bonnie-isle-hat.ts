import { Chart, HatPattern } from "./types";
import charts from "./sww22-bonnie-isle-hat.charts.json";

/**
 * Shetland Wool Week 2022: the Bonnie Isle Hat.
 *
 * Like the Islesburgh Toorie, this pattern prints its charts in plain greys,
 * one per yarn slot, and leaves the colour to the materials list. So there is
 * no colour in the file to read, and every shade below comes out of the yarn
 * library instead - see data/yarns. It is the widest spread of spinners here:
 * five colourways from five different mills, all of them in the library.
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
      wool: "jamieson-s-of-shetland-spindrift",
      name: "Colourway 1",
      brand: "Jamieson's of Shetland",
      yarn: "Spindrift",
      url: "https://www.jamiesonsofshetland.co.uk",
      ballMetres: 105,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Granite", code: "122", hex: "#c1c1b5", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-122" },
        { slot: "B", name: "Stonewash", code: "677", hex: "#41565b", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-677" },
        { slot: "C", name: "Dove", code: "630", hex: "#707476", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-630" },
        { slot: "D", name: "Oxford", code: "123", hex: "#4b4a47", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-123" },
        { slot: "E", name: "Natural White", code: "104", hex: "#eae5c6", source: "library",
          wool: "jamieson-s-of-shetland-spindrift-104" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "jamieson-smith",
      wool: "jamieson-smith-2ply-jumper-weight",
      name: "Colourway 2",
      brand: "Jamieson & Smith",
      yarn: "2ply Jumper Weight",
      url: "https://www.shetlandwoolbrokers.co.uk",
      ballMetres: 115,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Dark Teal Blue", code: "FC41", hex: "#1b4159",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-fc41" },
        { slot: "B", name: "Egg Yolk Yellow", code: "91", hex: "#db8c00", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-91" },
        { slot: "C", name: "Marled Peachy Orange", code: "1281", hex: "#b48958",
          source: "library", wool: "jamieson-smith-2ply-jumper-weight-1281" },
        { slot: "D", name: "Pale Lemon", code: "96", hex: "#ead293", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-96" },
        { slot: "E", name: "Dark Red", code: "9113", hex: "#ac262e", source: "library",
          wool: "jamieson-smith-2ply-jumper-weight-9113" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
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
        // Uradale's wool is undyed, and the 2025 pattern prints these same
        // shades in colour, so Flukkra and Aetmeal are read from there.
        { slot: "A", name: "Aetmeal (light fawn)", hex: "#f6efe3", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-aetmeal-light-fawn" },
        { slot: "B", name: "Roanberry Meal", hex: "#ff5425", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-roanberry-meal" },
        { slot: "C", name: "Roanberry Heath", hex: "#fa7657", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-roanberry-heath" },
        { slot: "D", name: "Graeff (Shetland black)", hex: "#5f5555", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-graeff-shetland-black" },
        { slot: "E", name: "Flukkra (natural white)", hex: "#eef0e2", source: "library",
          wool: "uradale-yarns-2ply-jumper-weight-flukkra-natural-white" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "laxdale",
      wool: "laxdale-yarn-2ply-jumper-weight",
      name: "Colourway 4",
      brand: "Laxdale Yarn",
      yarn: "2ply Jumper Weight",
      url: "https://www.laxdaleyarn.com",
      ballMetres: 90,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Fern", hex: "#3b4533", source: "library",
          wool: "laxdale-2ply-fern" },
        { slot: "B", name: "Lichen", hex: "#ffcc5b", source: "library",
          wool: "laxdale-2ply-lichen" },
        { slot: "C", name: "Buttermilk", hex: "#fdcd6d", source: "library",
          wool: "laxdale-2ply-buttermilk" },
        { slot: "D", name: "Winter Sky", hex: "#e6f5ff", source: "library",
          wool: "laxdale-2ply-winter-sky" },
        { slot: "E", name: "Artichoke", hex: "#888367", source: "library",
          wool: "laxdale-2ply-artichoke" },
      ],
      balls: { A: 2, B: 1, C: 1, D: 1, E: 1 },
    },
    {
      id: "aister-oo",
      wool: "aister-oo-2ply-jumper-weight",
      name: "Colourway 5",
      brand: "Aister Oo",
      yarn: "2ply Jumper Weight",
      url: "https://www.mackenziesfarmshop.co.uk",
      ballMetres: 71,
      ballGrams: 25,
      shades: [
        { slot: "A", name: "Moonshine", hex: "#e5f5d9", source: "library",
          wool: "aister-oo-2ply-jumper-weight-moonshine" },
        { slot: "B", name: "Cluve", hex: "#f6c9cc", source: "library",
          wool: "aister-oo-2ply-jumper-weight-cluve" },
        { slot: "C", name: "Holsas", hex: "#904d7f", source: "library",
          wool: "aister-oo-2ply-jumper-weight-holsas" },
        { slot: "D", name: "Midsetter", hex: "#4055b4", source: "library",
          wool: "aister-oo-2ply-jumper-weight-midsetter" },
        { slot: "E", name: "Blinnd Moorie", hex: "#c6d2d4", source: "library",
          wool: "aister-oo-2ply-jumper-weight-blinnd-moorie" },
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
