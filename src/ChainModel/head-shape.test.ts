import { describe, expect, it } from "vitest";
import { headShape, headLift } from "./head-shape";

/** Ramanujan's approximation for the way round an ellipse. */
const wayRound = (a: number, b: number) =>
  Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

describe("the head a hat is drawn on", () => {
  it("goes round the same as the hat that fits it", () => {
    const radius = 51.57;
    const points = headShape(radius, 60);
    let widest = 0;
    let back = 0;
    let front = 0;
    for (let at = 0; at < points.length; at += 3) {
      widest = Math.max(widest, Math.abs(points[at]));
      const z = points[at + 2];
      if (z < 0) back = Math.max(back, -z);
      else front = Math.max(front, z);
    }
    /*
     * An egg rather than an ellipse, so its way round is the mean of the two
     * halves it is made of. Within a couple of percent of the circle of the
     * hat's own radius: a head and a ball hold the same knitting, and differ
     * only in where it has to go.
     */
    const head = wayRound((front + back) / 2, widest);
    expect(head / (2 * Math.PI * radius)).toBeGreaterThan(0.97);
    expect(head / (2 * Math.PI * radius)).toBeLessThan(1.03);
  });

  it("is longer front to back than it is ear to ear", () => {
    const points = headShape(50, 60);
    let widest = 0;
    let deepest = 0;
    for (let at = 0; at < points.length; at += 3) {
      widest = Math.max(widest, Math.abs(points[at]));
      deepest = Math.max(deepest, Math.abs(points[at + 2]));
    }
    expect(deepest).toBeGreaterThan(widest * 1.2);
  });

  it("is fuller at the back of the skull than at the forehead", () => {
    const points = headShape(50, 60);
    let back = 0;
    let front = 0;
    for (let at = 0; at < points.length; at += 3) {
      const z = points[at + 2];
      if (z < 0) back = Math.max(back, -z);
      else front = Math.max(front, z);
    }
    expect(back).toBeGreaterThan(front * 1.05);
  });

  it("is flatter on the vertex than an ellipsoid would be", () => {
    const tall = 60;
    const points = headShape(50, tall);
    // Three quarters of the way up, a skull still has most of its width; an
    // ellipsoid of the same height would be down to two thirds.
    let widest = 0;
    for (let at = 0; at < points.length; at += 3) {
      if (Math.abs(points[at + 1] - tall * 0.75) > tall * 0.04) continue;
      widest = Math.max(widest, Math.abs(points[at]));
    }
    const ellipsoid = Math.sqrt(1 - 0.75 ** 2) * 50 * 0.86;
    expect(widest).toBeGreaterThan(ellipsoid * 1.15);
  });

  it("stands the given height above its widest part", () => {
    const points = headShape(50, 73);
    let top = -Infinity;
    for (let at = 1; at < points.length; at += 3) top = Math.max(top, points[at]);
    expect(top).toBeCloseTo(73, 6);
  });

  it("has narrowed to the rib's width by the time it reaches the rib", () => {
    // A hat whose body is 51.6 round and whose rib is knitted at 41.4.
    const lift = headLift(60, 41.4, 51.6);
    expect(lift).toBeGreaterThan(0);
    // At that height the head is exactly the rib's width again.
    const shrunk = (1 - (lift / 60) ** 2.7) ** (1 / 2.7) * 51.6;
    expect(shrunk).toBeCloseTo(41.4, 6);
  });
});
