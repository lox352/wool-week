import { expect, it } from "vitest";
import { hats } from "../data/hats";
import { buildHat } from "./engine";
import { progressBefore } from "./jump";
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
