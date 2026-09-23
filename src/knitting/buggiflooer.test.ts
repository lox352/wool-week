import { describe, expect, it } from "vitest";
import { hatById } from "../data/hats";
import { consumes } from "../data/hats/types";
import { buildHat } from "./engine";

const hat = hatById("sww23-buggiflooer-beanie")!;

describe("Buggiflooer Beanie reconciles with the 2023 pattern", () => {
  it("follows every printed stitch count from 152 to the final 7", () => {
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    expect(sizes.slice(0, 12)).toEqual(Array(12).fill(152));
    expect(sizes[12]).toBe(168);
    expect(sizes.slice(12, 17)).toEqual(Array(5).fill(168));
    expect(sizes[17]).toBe(170);
    expect(sizes.slice(17, 43)).toEqual(Array(26).fill(170));
    expect(sizes.slice(43, 49)).toEqual(Array(6).fill(168));
    expect(sizes[49]).toBe(154);
    expect(sizes.slice(50, 76)).toEqual([
      154, 154, 154, 154, 154, 154, 154,
      140, 140, 126, 126, 112, 112, 98, 98, 84, 84,
      70, 70, 56, 56, 42, 42, 28, 28, 14,
    ]);
    expect(sizes[76]).toBe(7);
    expect(sizes).toHaveLength(77);
  });

  it("reads the five printed charts with their symbols and row colours", () => {
    const chart = (id: string) => hat.charts.find((c) => c.id === id)!;
    expect(chart("A").rows).toHaveLength(10);
    expect(chart("B").rows).toHaveLength(4);
    expect(chart("C").rows).toHaveLength(25);
    expect(chart("D").rows).toHaveLength(4);
    expect(chart("E").rows).toHaveLength(26);

    expect(chart("A").rows.every((row) => row.length === 4)).toBe(true);
    expect(chart("B").rows.every((row) => row.length === 4)).toBe(true);
    expect(chart("C").rows.every((row) => row.length === 34)).toBe(true);
    expect(chart("D").rows.every((row) => row.length === 4)).toBe(true);

    const purls = chart("A").rows.flat().filter((cell) => cell.symbol === "purl");
    expect(purls).toHaveLength(18);

    const e = chart("E").rows;
    expect(e.map((row) => row.length)).toEqual([
      22, 22, 22, 22, 22, 22, 22,
      20, 20, 18, 18, 16, 16, 14, 14, 12, 12,
      10, 10, 8, 8, 6, 6, 4, 4, 2,
    ]);
    const decreases = e.flatMap((row, index) =>
      row.some((cell) => cell.symbol === "s2kp") ? [index + 1] : [],
    );
    expect(decreases).toEqual([8, 10, 12, 14, 16, 18, 20, 22, 24, 26]);

    const cContrast = [..."CCCCCCDDDEEEFEEEDDDDCCCCC"];
    chart("C").rows.forEach((row, i) => {
      expect(new Set(row.map((cell) => cell.slot))).toEqual(
        new Set(["A", cContrast[i]]),
      );
    });

    const eContrast = [..."CCCCCCFEEEEEEDDDDDDDDDDDDD"];
    chart("E").rows.forEach((row, i) => {
      expect(new Set(row.map((cell) => cell.slot))).toEqual(
        new Set(["A", eContrast[i]]),
      );
    });
  });

  it("chains every crown row by consumption, not just by drawn width", () => {
    const crown = hat.charts.find((c) => c.id === "E")!;
    crown.rows.slice(1).forEach((row, i) => {
      expect(row.reduce((n, cell) => n + consumes(cell), 0)).toBe(
        crown.rows[i].length,
      );
    });
  });

  it("keeps the two three-colour versions as three physical yarns", () => {
    for (const id of ["aister-oo", "laxdale"]) {
      const colourway = hat.colourways.find((c) => c.id === id)!;
      const shade = (slot: string) =>
        colourway.shades.find((candidate) => candidate.slot === slot)!;
      expect(shade("C").wool).toBe(shade("B").wool);
      expect(shade("D").wool).toBe(shade("B").wool);
      expect(shade("E").wool).toBe(shade("B").wool);
      expect(Object.keys(colourway.balls).sort()).toEqual(["A", "B", "F"]);
    }
  });

  it("models the final shifted K2tog-tbl round at the middle of chart E", () => {
    const { stitches, rounds } = buildHat(hat);
    const previous = rounds.at(-2)!;
    const final = rounds.at(-1)!;

    expect(final).toHaveLength(7);
    final.forEach((id) => expect(stitches[id].type).toBe("k2togtbl"));
    expect(stitches[final[0]].links.slice(0, 2)).toEqual([
      previous[1],
      previous[2],
    ]);
    expect(stitches[final[6]].links.slice(0, 2)).toEqual([
      previous[13],
      previous[0],
    ]);
  });

  it("preserves the pattern's one-size measurements without inventing a head size", () => {
    expect(hat.sizes).toHaveLength(1);
    expect(hat.sizes[0].toFitCm).toBeUndefined();
    expect(hat.sizes[0].circumferenceCm).toBe(50);
    expect(hat.sizes[0].lengthCm).toBe(19);
    expect(hat.sizes[0].stitchesPer10cm).toBe(34);
    expect(hat.sizes[0].roundsPer10cm).toBe(38);
  });
});
