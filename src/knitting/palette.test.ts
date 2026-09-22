import { describe, expect, it } from "vitest";
import { ballsOf, paletteOf, yarnFor } from "./palette";
import { hatById } from "../data/hats";

const colourwayOf = (hatId: string, id: string) => {
  const hat = hatById(hatId)!;
  return { hat, colourway: hat.colourways.find((one) => one.id === id)! };
};

describe("the wool a colourway is knitted in", () => {
  it("counts one ball once, however many yarns it does", () => {
    /*
     * "Five yarns doing the work of eight, so several slots share a shade."
     * Graeff is A, C and G; Glansin is D and H. The pattern asks for two balls
     * of Graeff, recorded against A, and one of everything else - so the
     * group's count is the largest of its slots and not their sum.
     */
    const { colourway } = colourwayOf("sww25-aal-ower-toorie", "shetland-naturals");
    expect(colourway.shades).toHaveLength(8);

    const balls = ballsOf(colourway, "medium");
    expect(balls.map((ball) => ball.slots.join("+"))).toEqual([
      "A+C+G",
      "B",
      "D+H",
      "E",
      "F",
    ]);
    expect(balls[0].yarn.name).toBe("Graeff (Shetland black)");
    expect(balls[0].balls).toBe(2);
    expect(balls[2].balls).toBe(1);
  });

  it("gives a yarn of its own to every yarn that has one", () => {
    const { colourway } = colourwayOf("sww25-aal-ower-toorie", "vintage");
    const balls = ballsOf(colourway, "medium");
    expect(balls).toHaveLength(colourway.shades.length);
    expect(balls.every((ball) => ball.slots.length === 1)).toBe(true);
  });

  it("lists the colourway's yarns, not the pattern's", () => {
    // 2026 is drawn in parts, and its last two colourways use four yarns
    // where its first two use six.
    const { hat, colourway } = colourwayOf("sww26-birsie-beanny", "heddery-hills");
    expect(hat.slots).toHaveLength(6);
    expect(ballsOf(colourway, "medium")).toHaveLength(4);
  });

  it("follows the wool you have put in it, and keeps the count", () => {
    const { hat, colourway } = colourwayOf("sww25-aal-ower-toorie", "shetland-naturals");
    const chosen = {
      wool: "jamieson-s-of-shetland-spindrift-293",
      name: "Port Wine",
      code: "293",
      hex: "#8a3446",
    };
    // The whole of the Graeff group, which is how a row changes.
    const overrides = { A: chosen, C: chosen, G: chosen };

    const balls = ballsOf(colourway, "medium", overrides);
    expect(balls[0].slots).toEqual(["A", "C", "G"]);
    expect(balls[0].yarn.name).toBe("Port Wine");
    expect(balls[0].yarn.approximate).toBe(false);
    expect(balls[0].balls).toBe(2);
    // And the rest of the colourway is untouched.
    expect(balls).toHaveLength(5);
    expect(yarnFor(paletteOf(colourway, overrides, hat.charts), "B").name).toBe(
      "Laebrak (dark grey)",
    );
  });

  it("counts per size, where a colourway counts per size", () => {
    const { colourway } = colourwayOf("sww25-aal-ower-toorie", "shetland-naturals");
    expect(ballsOf(colourway, "small")[0].balls).toBe(2);
    expect(ballsOf(colourway, "large")[0].balls).toBe(2);
  });
});
