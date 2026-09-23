import { describe, expect, it } from "vitest";
import { hatById } from "../data/hats";
import { consumes } from "../data/hats/types";
import { buildHat } from "./engine";

const hat = hatById("sww16-crofthoose-hat")!;

describe("Crofthoose Hat reconciles with the 2016 leaflet", () => {
  it("follows every printed stitch count from 120 to the final 6", () => {
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    expect(sizes.slice(0, 9)).toEqual(Array(9).fill(120));
    expect(sizes.slice(9, 42)).toEqual(Array(33).fill(168));
    expect(sizes.slice(42)).toEqual([
      144, 132, 132, 120, 120, 108, 108, 96, 96, 84, 84, 72,
      72, 60, 60, 48, 48, 36, 36, 24, 24, 12, 6,
    ]);
    expect(sizes).toHaveLength(65);
  });

  it("preserves all 41 rows of the printed body chart and its corrugated rib", () => {
    const chart = hat.charts.find((candidate) => candidate.id === "A")!;
    expect(chart.rows.map((row) => row.map((cell) => cell.slot).join("")))
      .toEqual(["AAAAAAAAAAAA","ABABABABABAB","ACACACACACAC","ADADADADADAD","AEAEAEAEAEAE","ADADADADADAD","ACACACACACAC","ABABABABABAB","AAAAAAAAAAAA","AEAEAEAEAEAE","EEEEEEEEEEEE","EBBBEBBBEEBE","EBEBEBEBEBEB","EBBBBBBBEEEE","ECCCCCCCEECE","ECCCCCCCECEC","EBBEEEBBEEEE","EBBEEEBBEEBE","EEEEEEEEEEEE","DEDEDEDEDEDE","DDDDDDDDDDDD","AADDADDAAADA","DADADADADADA","AADDDDDAAAAA","BBDDBDDBBBBB","BBDBDBDBBBBB","AADDDDDAADDD","AADDADDAADDD","DDDDDDDDDDDD","DEDEDEDEDEDE","EEEEEEEEEEEE","EBBBEBBBEEBE","EBEBEBEBEBEB","EBBBBBBBEEEE","ECCCCCCCEECE","ECCCCCCCECEC","EBBEEEBBEEEE","EBBEEEBBEEBE","EEEEEEEEEEEE","AEAEAEAEAEAE","AAAAAAAAAAAA"]);
    expect(chart.rows).toHaveLength(41);
    expect(chart.rows.every((row) => row.length === 12)).toBe(true);

    chart.rows.slice(0, 8).forEach((row) => {
      expect(row.flatMap((cell, i) => cell.symbol === "purl" ? [i + 1] : []))
        .toEqual([1, 3, 5, 7, 9, 11]);
    });
    expect(
      chart.rows.flat().filter((cell) => cell.symbol === "purl"),
    ).toHaveLength(48);
    expect(chart.rows[8].every((cell) => cell.slot === "A" && !cell.symbol))
      .toBe(true);
  });

  it("preserves the fancy crown and every centred double decrease", () => {
    const crown = hat.charts.find((candidate) => candidate.id === "B")!;
    expect(crown.rows.map((row) => row.map((cell) => cell.slot).join("")))
      .toEqual(["AAAAAAAAAAAAAAAAAAAAAAAA","ADADADADADAAADADADADAD","ADADDDDADDDDDDDADDDDAD","ADDADDAAADADAAADDADD","ADDDADDADDDDDADDADDD","BBEEEBEEEBEEEBEEEB","CECEEECEEEEECEEECE","BEEBEEEBBBEEEBEE","ADDDADDDDDDDADDD","AADDDADADADDDA","ADADDDADADDDAD","BEEBEEBEEBEE","CCEECEEECEEC","BEBEEBEEBE","ADDADDDADD","AADDADDA","ADADDDAD","BEEBEE","CCEEEC","BEBE","ADDD","AA"]);
    expect(crown.rows.map((row) => row.length)).toEqual([
      24, 22, 22, 20, 20, 18, 18, 16, 16, 14, 14,
      12, 12, 10, 10, 8, 8, 6, 6, 4, 4, 2,
    ]);
    expect(
      crown.rows.flatMap((row, i) =>
        row.some((cell) => cell.symbol === "s2kp") ? [i + 1] : [],
      ),
    ).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
    expect(
      crown.rows.flat().filter((cell) => cell.symbol === "s2kp"),
    ).toHaveLength(11);

    let previous = crown.rows[0].length;
    crown.rows.slice(1).forEach((row) => {
      expect(row.reduce((n, cell) => n + consumes(cell), 0)).toBe(previous);
      previous = row.length;
    });
    expect(previous).toBe(2);
  });

  it("models the written increase and first crown decrease independently of the chart", () => {
    const { stitches, rounds } = buildHat(hat);
    const increase = rounds[9].map((id) => stitches[id]);
    expect(increase).toHaveLength(168);
    expect(increase.filter((stitch) => stitch.type === "m1")).toHaveLength(48);

    const firstCrown = rounds[42].map((id) => stitches[id]);
    expect(firstCrown).toHaveLength(144);
    expect(firstCrown.filter((stitch) => stitch.type === "k2tog"))
      .toHaveLength(24);
  });

  it("keeps all four sample colourways without inventing current matches", () => {
    expect(hat.colourways.map((colourway) => colourway.brand)).toEqual([
      "Jamieson & Smith",
      "Shetland Organics",
      "Jamieson's of Shetland",
      "Spindrift Crafts",
    ]);
    expect(hat.colourways.every((colourway) =>
      Object.values(colourway.balls).every((balls) => balls === 1),
    )).toBe(true);

    for (const id of ["shetland-organics", "naturally-dyed"]) {
      const colourway = hat.colourways.find((candidate) => candidate.id === id)!;
      expect(colourway.shades.every((shade) =>
        shade.source === "approximate" && shade.wool === undefined,
      )).toBe(true);
    }
  });

  it("records only dimensions supported by the leaflet or its arithmetic", () => {
    const size = hat.sizes[0];
    expect(size.toFitCm).toBeCloseTo(22 * 2.54, 1);
    expect(size.stitchesPer10cm).toBe(26);
    expect(size.roundsPer10cm).toBe(26);
    expect(size.circumferenceCm).toBeCloseTo((168 / 26) * 10, 1);
    expect(size.lengthCm).toBeCloseTo((64 / 26) * 10, 1);
    expect(size.needlesMm).toBe(3.5);
    expect(size.ribNeedlesMm).toBe(3);
  });
});
