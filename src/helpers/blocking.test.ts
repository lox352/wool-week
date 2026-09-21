import { describe, expect, it } from "vitest";
import { buildHat } from "../knitting/engine";
import { hatById } from "../data/hats";
import { blockHat } from "./blocking";
import { measureGauge } from "./gauge";
import { adjacentStitchDistance } from "../constants";

/** A settled hat, near enough: rounds that keep their gaps but ripple. */
const rippled = (hat: string) => {
  const { stitches, rounds } = buildHat(hatById(hat)!);
  const at = stitches.map((stitch, index) => {
    const pull = index % 2 === 0 ? 0.8 : 1;
    return { ...stitch.position, x: stitch.position.x * pull, z: stitch.position.z * pull };
  });
  return { stitches, rounds, at };
};

describe("blocking a hat out to its measurements", () => {
  it("pulls every round out to the circle its own stitches make", () => {
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

  it("keeps the crown's taper, because a round is only as wide as its stitches", () => {
    const { rounds, at } = rippled("sww25-aal-ower-toorie");
    const blocked = blockHat(rounds, at);
    const width = (ids: number[]) =>
      Math.hypot(blocked[ids[0]].x, blocked[ids[0]].z);
    expect(width(rounds[rounds.length - 1])).toBeLessThan(width(rounds[30]) / 5);
  });

  it("leaves every stitch at the height the settle gave it", () => {
    const { rounds, at } = rippled("sww24-islesburgh-toorie");
    const blocked = blockHat(rounds, at);
    blocked.forEach((point, id) => expect(point.y).toBe(at[id].y));
  });

  it("takes the ripple out, so a round encloses the width it should", () => {
    const { stitches, rounds, at } = rippled("sww25-aal-ower-toorie");
    const before = measureGauge(stitches, rounds, at, 1.0968);
    const after = measureGauge(stitches, rounds, blockHat(rounds, at), 1.0968);
    expect(before.frill).toBeGreaterThan(1.2);
    expect(after.frill).toBeCloseTo(1, 2);
    expect(after.radius).toBeGreaterThan(before.radius);
  });

  it("does half of it for a hat only patted into shape", () => {
    const { rounds, at } = rippled("sww25-aal-ower-toorie");
    const half = blockHat(rounds, at, 0.5);
    const full = blockHat(rounds, at, 1);
    const id = rounds[30][0];
    const way = (point: { x: number; z: number }) => Math.hypot(point.x, point.z);
    expect(way(half[id])).toBeCloseTo((way(at[id]) + way(full[id])) / 2, 6);
  });
});
