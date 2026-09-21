import { describe, expect, it } from "vitest";
import { layOut } from "./layout";
import { buildHat } from "./engine";
import { hatById } from "../data/hats";
import { consumption } from "../types/StitchType";

const laid = (id: string) => {
  const hat = hatById(id)!;
  const { stitches, rounds } = buildHat(hat);
  const layout = layOut(stitches, rounds);
  return { stitches, rounds, cells: layout.cells, columns: layout.columns };
};

describe("the chart hangs every stitch over what it was worked into", () => {
  it("a plain knit keeps its column exactly, so colourwork stacks up", () => {
    const { stitches, rounds, cells } = laid("sww25-aal-ower-toorie");
    const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));

    // Two body rounds, worked over the same stitch count with no shaping.
    const [below, above] = [rounds[20], rounds[21]];
    expect(below.length).toBe(above.length);
    above.forEach((id) => {
      expect(byId.get(id)!.type).toBe("k1");
      const parent = byId.get(id)!.links[0];
      expect(cells.get(id)!.column).toBe(cells.get(parent)!.column);
    });
  });

  it("a decrease sits over the middle of what it took together", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { stitches, cells } = laid(hat);
      const decreases = stitches.filter(
        (stitch) => consumption[stitch.type] > 1,
      );
      expect(decreases.length).toBeGreaterThan(0);

      for (const stitch of decreases) {
        const taken = stitch.links.slice(0, consumption[stitch.type]);
        const columns = taken.map((id) => cells.get(id)!.column);
        const middle =
          columns.reduce((total, at) => total + at, 0) / columns.length;
        expect(cells.get(stitch.id)!.column).toBeCloseTo(middle, 9);
      }
    }
  });

  it("a k2tog lands on a half column, and the crown carries it up", () => {
    const { stitches, rounds, cells } = laid("sww24-islesburgh-toorie");
    const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));

    // The round that takes 160 stitches to 144, on sixteen k2tog.
    const shaped = rounds.find(
      (round) => round.some((id) => byId.get(id)!.type === "k2tog"),
    )!;
    const taken = shaped.filter((id) => byId.get(id)!.type === "k2tog");
    expect(taken.length).toBe(16);
    for (const id of taken) {
      expect(cells.get(id)!.column % 1).toBe(0.5);
    }

    // And the rounds above inherit it, rather than snapping back to whole
    // columns and sliding the colourwork sideways.
    const above = rounds[rounds.indexOf(shaped) + 1];
    expect(
      above.filter((id) => cells.get(id)!.column % 1 !== 0).length,
    ).toBeGreaterThan(0);
  });

  it("a stitch that becomes two sits between the two it becomes", () => {
    const { stitches, rounds, cells } = laid("sww25-aal-ower-toorie");
    const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));

    // The round that takes the 130 stitch rib to a 162 stitch body, on 32
    // make-ones. A make-one is worked into nothing, so it belongs to the
    // stitch beside it: one rib stitch, two stitches above.
    const grown = rounds.find((round) =>
      round.some((id) => byId.get(id)!.type === "m1"),
    )!;
    const made = grown.filter((id) => byId.get(id)!.type === "m1");
    expect(made.length).toBe(32);

    for (const id of made) {
      const beside = grown[grown.indexOf(id) - 1];
      const parent = byId.get(beside)!.links[0];
      // Half a column in from each of them, rather than under one of the two.
      expect(cells.get(parent)!.column).toBeCloseTo(
        (cells.get(beside)!.column + cells.get(id)!.column) / 2,
        9,
      );
      expect(cells.get(parent)!.column % 1).toBe(0.5);
    }
  });

  it("an increase leaves a gap in the rounds below rather than bunching", () => {
    const { rounds, cells } = laid("sww25-aal-ower-toorie");

    // The rib is 130 stitches under a 162 stitch body, and used to sit
    // against one edge of the chart with dead space beside it. Now it spans
    // the full width, with half a column of slack either side of each of the
    // 32 stitches an increase is about to be made beside.
    const rib = rounds[0];
    expect(rib.length).toBe(130);
    expect(cells.get(rib[0])!.column).toBe(1);
    expect(cells.get(rib[rib.length - 1])!.column).toBe(162);

    const slack = rib
      .slice(1)
      .filter(
        (id, index) =>
          cells.get(id)!.column - cells.get(rib[index])!.column > 1,
      );
    expect(slack.length).toBe(64);
  });

  it("stays inside its own width, which is its widest round", () => {
    for (const [hat, width] of [
      ["sww25-aal-ower-toorie", 162],
      ["sww24-islesburgh-toorie", 160],
    ] as const) {
      const { rounds, cells, columns } = laid(hat);
      expect(columns).toBe(Math.max(...rounds.map((round) => round.length)));
      expect(columns).toBe(width);
      const all = [...cells.values()].map((cell) => cell.column);
      expect(Math.min(...all)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...all)).toBeLessThanOrEqual(columns);
    }
  });

  it("never lets two stitches of a round overlap", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { rounds, cells } = laid(hat);
      for (const round of rounds) {
        for (let index = 1; index < round.length; index++) {
          const step =
            cells.get(round[index])!.column -
            cells.get(round[index - 1])!.column;
          expect(step).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});
