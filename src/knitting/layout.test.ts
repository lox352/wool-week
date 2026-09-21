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

  it("a decrease sits on the middle of the stitches it took together", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { stitches, cells } = laid(hat);
      const decreases = stitches.filter(
        (stitch) => consumption[stitch.type] > 1,
      );
      expect(decreases.length).toBeGreaterThan(0);

      for (const stitch of decreases) {
        const columns = stitch.links
          .slice(0, consumption[stitch.type])
          .map((id) => cells.get(id)!.column)
          .sort((a, b) => a - b);
        const half = Math.floor(columns.length / 2);
        // The middle counted by stitch: the middle one of an odd number of
        // them, and half way between the two middle ones of an even number.
        const middle =
          columns.length % 2 === 1
            ? columns[half]
            : (columns[half - 1] + columns[half]) / 2;
        expect(cells.get(stitch.id)!.column).toBe(middle);
      }
    }
  });

  it("a k2tog sits half way between the two columns that produced it", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { stitches, cells } = laid(hat);
      const taken = stitches.filter((stitch) => stitch.type === "k2tog");
      expect(taken.length).toBeGreaterThan(0);
      for (const stitch of taken) {
        const [left, right] = stitch.links
          .slice(0, 2)
          .map((id) => cells.get(id)!.column);
        expect(cells.get(stitch.id)!.column).toBe((left + right) / 2);
      }
    }
  });

  it("a centred double decrease keeps the middle stitch of its three", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { stitches, cells } = laid(hat);
      const centred = stitches.filter((stitch) => stitch.type === "s2kp");
      expect(centred.length).toBeGreaterThan(0);
      for (const stitch of centred) {
        expect(cells.get(stitch.id)!.column).toBe(
          cells.get(stitch.links[1])!.column,
        );
      }
    }
  });

  it("a decrease line runs straight up the chart rather than wandering", () => {
    // The crown closes on nine decrease lines on one hat and six on the
    // other. Each is one column of the chart from the body to the very top:
    // taking the middle of three stitches literally, rather than settling on
    // the middle one, moved each decrease a fraction of a column per round
    // and the line came out visibly wobbly.
    for (const [hat, lines] of [
      ["sww25-aal-ower-toorie", 9],
      ["sww24-islesburgh-toorie", 6],
    ] as const) {
      const { stitches, cells } = laid(hat);
      const columns = new Set(
        stitches
          .filter((stitch) => stitch.type === "s2kp")
          .map((stitch) => cells.get(stitch.id)!.column),
      );
      expect(columns.size).toBe(lines);
    }
  });

  it("keeps every stitch on the chart's columns or half way between two", () => {
    // Nothing ever lands on an arbitrary fraction of a column: a stitch
    // either inherits a column outright or splits the difference between two
    // of them. That is what lets a stack run straight and gives the heavy
    // every-fifth-column rules an edge to be drawn on.
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { cells } = laid(hat);
      for (const cell of cells.values()) expect(cell.column % 0.5).toBe(0);
    }
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
