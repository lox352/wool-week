import { describe, expect, it } from "vitest";
import { buildHat, roundHeightFor } from "../knitting/engine";
import { hatById } from "../data/hats";
import { bodyBand, measureGauge } from "./gauge";
import { adjacentStitchDistance } from "../constants";

const wantedFor = (id: string) => {
  const hat = hatById(id)!;
  const size = hat.sizes[Math.floor(hat.sizes.length / 2)];
  return size.roundsPer10cm / size.stitchesPer10cm;
};

describe("measuring a hat's tension", () => {
  it("measures a band of the plain body, clear of the rib and the crown", () => {
    const hat = hatById("sww25-aal-ower-toorie")!;
    const { rounds } = buildHat(hat);
    const [from, to] = bodyBand(rounds);
    const widest = Math.max(...rounds.map((round) => round.length));
    for (let round = from; round <= to; round++) {
      expect(rounds[round - 1].length).toBe(widest);
    }
    expect(to).toBeGreaterThan(from);
  });

  it("finds the pattern's own tension in the hat as it is built", () => {
    for (const id of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const hat = hatById(id)!;
      const { stitches, rounds } = buildHat(hat);
      const at = stitches.map((stitch) => stitch.position);
      const gauge = measureGauge(stitches, rounds, at, wantedFor(id));

      // A stitch is built one stitch wide and one round tall, so the ratio
      // out has to be the ratio in.
      expect(gauge.across).toBeCloseTo(adjacentStitchDistance, 3);
      expect(gauge.up).toBeCloseTo(roundHeightFor(hat), 6);
      expect(gauge.ratio).toBeCloseTo(gauge.wanted, 3);
      // Built on a circle, so a round is exactly as long as the circle it
      // encloses: nothing is rippling yet.
      expect(gauge.frill).toBeCloseTo(1, 3);
    }
  });

  it("counts a round that wanders in and out as longer than its circle", () => {
    const hat = hatById("sww25-aal-ower-toorie")!;
    const { stitches, rounds } = buildHat(hat);
    // Pull every other stitch of the body inwards, which keeps the stitches
    // the same distance apart while the round encloses far less.
    const at = stitches.map((stitch, index) => {
      if (index % 2 === 1) return stitch.position;
      const pull = 0.85;
      return { ...stitch.position, x: stitch.position.x * pull, z: stitch.position.z * pull };
    });
    const gauge = measureGauge(stitches, rounds, at, wantedFor("sww25-aal-ower-toorie"));
    expect(gauge.frill).toBeGreaterThan(1.2);
    expect(gauge.radius).toBeLessThan(51.57);
  });
});
