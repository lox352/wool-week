import { expect, it } from "vitest";
import { hats } from "../data/hats";
import { buildHat } from "./engine";
import { progressBefore, stitchAtPoint } from "./jump";
import { layOut } from "./layout";
import { cellAt } from "./draw-chart";
it("jumps to the requested next stitch and validates bounds", () => {
  const { stitches, rounds } = buildHat(hats[0]);
  expect(progressBefore(stitches, rounds, 1, 1)).toBe(0);
  expect(progressBefore(stitches, rounds, 2, 1)).toBe(rounds[1][0] - 1);
  expect(() => progressBefore(stitches, rounds, 0, 1)).toThrow();
  expect(() => progressBefore(stitches, rounds, 2, 100000)).toThrow();
  expect(() => progressBefore(stitches, rounds, 1.5, 1)).toThrow();
});
it("does not split a KFB action", () => {
  const { stitches, rounds } = buildHat(hats.find(h => h.year === 2018)!, "yw1");
  const id = stitches.find(s => s.type === "kfb")!.id;
  const r = rounds.findIndex(ids => ids.includes(id));
  expect(progressBefore(stitches, rounds, r + 1, rounds[r].indexOf(id + 1) + 1)).toBe(id - 1);
});
it("finds the stitch drawn under a point on the chart", () => {
  const { stitches, rounds } = buildHat(hats[0]);
  const layout = layOut(stitches, rounds);
  const cell = 16;
  for (const id of [rounds[0][0], rounds[3][5], rounds.at(-1)![0]]) {
    const at = layout.cells.get(id)!;
    const { x, y } = cellAt(layout, at.round, at.column, cell);
    expect(stitchAtPoint(layout, rounds, cell, x + cell / 2, y + cell / 2)).toBe(id);
  }
  expect(stitchAtPoint(layout, rounds, cell, -5, 5)).toBeUndefined();
});
