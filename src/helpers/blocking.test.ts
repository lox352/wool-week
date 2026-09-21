import { describe, expect, it } from "vitest";
import { buildHat } from "../knitting/engine";
import { hatById } from "../data/hats";
import { blockHat } from "./blocking";
import { measureGauge } from "./gauge";
import { adjacentStitchDistance } from "../constants";

/**
 * A settled hat, near enough.
 *
 * Rounds that wander in and out on their way round in a few long waves,
 * which is what a settled one does: the stitch gaps stay near their full
 * width and the round encloses much less than it should. A sawtooth from one
 * stitch to the next would not do - that pulls the gaps themselves open, and
 * is a different complaint.
 */
const rippled = (hat: string, depth = 0.3, waves = 8) => {
  const { stitches, rounds } = buildHat(hatById(hat)!);
  const at = stitches.map((stitch) => ({ ...stitch.position }));
  for (const ids of rounds) {
    ids.forEach((id, position) => {
      const wave = Math.cos((2 * Math.PI * waves * position) / ids.length);
      const pull = 1 - (depth * (1 + wave)) / 2;
      at[id].x *= pull;
      at[id].z *= pull;
    });
  }
  return { stitches, rounds, at };
};

describe("blocking a hat out to its measurements", () => {
  it("puts each round on the circle its own stitches make", () => {
    const { rounds, at } = rippled("sww25-aal-ower-toorie");
    const blocked = blockHat(rounds, at);
    for (const ids of rounds) {
      if (ids.length < 3) continue;
      const wanted = (ids.length * adjacentStitchDistance) / (2 * Math.PI);
      for (const id of ids) {
        expect(Math.hypot(blocked[id].x, blocked[id].z)).toBeCloseTo(wanted, 6);
      }
    }
  });

  it("brings a round that was pulled too wide back in", () => {
    const { stitches, rounds } = buildHat(hatById("sww25-aal-ower-toorie")!);
    const at = stitches.map((stitch) => ({
      ...stitch.position,
      x: stitch.position.x * 1.3,
      z: stitch.position.z * 1.3,
    }));
    const id = rounds[20][0];
    expect(Math.hypot(...[blockHat(rounds, at)[id]].map((p) => Math.hypot(p.x, p.z)))).toBeLessThan(
      Math.hypot(at[id].x, at[id].z),
    );
  });

  it("keeps the crown's taper, because a round is only as wide as its stitches", () => {
    const { rounds, at } = rippled("sww25-aal-ower-toorie");
    const blocked = blockHat(rounds, at);
    const width = (ids: number[]) => Math.hypot(blocked[ids[0]].x, blocked[ids[0]].z);
    expect(width(rounds[rounds.length - 1])).toBeLessThan(width(rounds[30]) / 5);
  });

  it("keeps the height the settle gave each round, which is the hat's profile", () => {
    const { rounds, at } = rippled("sww24-islesburgh-toorie");
    const blocked = blockHat(rounds, at);
    for (const ids of rounds) {
      const settled = ids.reduce((total, id) => total + at[id].y, 0) / ids.length;
      const after = ids.reduce((total, id) => total + blocked[id].y, 0) / ids.length;
      expect(after).toBeCloseTo(settled, 6);
    }
  });

  it("gives the fabric back the tension the pattern asks for", () => {
    for (const [hat, wanted] of [
      ["sww25-aal-ower-toorie", 1.0968],
      ["sww24-islesburgh-toorie", 1.1667],
    ] as const) {
      const { stitches, rounds, at } = rippled(hat);
      const before = measureGauge(stitches, rounds, at, wanted);
      const after = measureGauge(stitches, rounds, blockHat(rounds, at), wanted);
      expect(before.frill).toBeGreaterThan(1.1);
      // Round, level and as wide as its stitches: the gaps come back to a
      // stitch's width, and the way round to the circle it encloses.
      expect(after.across).toBeCloseTo(adjacentStitchDistance, 2);
      expect(after.frill).toBeCloseTo(1, 3);
      expect(after.ratio).toBeCloseTo(after.wanted, 2);
      expect(after.radius).toBeGreaterThan(before.radius);
    }
  });

  it("does half of it for a hat only patted into shape", () => {
    const { rounds, at } = rippled("sww25-aal-ower-toorie");
    const way = (point: { x: number; z: number }) => Math.hypot(point.x, point.z);
    const id = rounds[30][0];
    const half = way(blockHat(rounds, at, 0.5)[id]);
    const full = way(blockHat(rounds, at, 1)[id]);
    expect(half).toBeCloseTo((way(at[id]) + full) / 2, 6);
  });
});
