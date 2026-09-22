import { describe, expect, it } from "vitest";
import { buildHat } from "./engine";
import { hatById } from "../data/hats";
import { layOut } from "./layout";
import { gridPaths, numberedRounds } from "./chart-paths";

const cell = 13;

const chartOf = (id: string) => {
  const hat = hatById(id)!;
  const { stitches, rounds, turns } = buildHat(hat);
  return { layout: layOut(stitches, rounds), turns };
};

/**
 * The rule across the chart where the work is turned inside out.
 *
 * It is drawn in place of that boundary's counting line rather than over it,
 * because it is not a counting line: the rounds either side of it are worked
 * on opposite faces of the tube and so read the other way about the hat.
 */
describe("the turn's rule on the chart", () => {
  it("takes the boundary out of the counting lines and keeps it", () => {
    const { layout, turns } = chartOf("sww26-birsie-beanny");
    const [turn] = turns;
    const y = (layout.rounds - turn) * cell;

    const marked = gridPaths(layout, cell, turns);
    expect(marked.turn).not.toBe("");
    // Every stroke of it is that one boundary, and horizontal.
    marked.turn
      .split("M")
      .filter(Boolean)
      .forEach((stroke) => {
        expect(stroke).toMatch(/h/);
        expect(Number(stroke.split(" ")[1].split("h")[0])).toBe(y);
      });

    // And the line it replaced has gone from the greys.
    const plain = gridPaths(layout, cell);
    expect(plain.turn).toBe("");
    const at = (d: string) => (d.match(new RegExp(`M[\\d.]+ ${y}h`, "g")) ?? []).length;
    expect(at(plain.light) + at(plain.heavy)).toBe(at(marked.turn));
    expect(at(marked.light) + at(marked.heavy)).toBe(0);
  });

  it("changes nothing else about the grid", () => {
    const { layout, turns } = chartOf("sww26-birsie-beanny");
    const plain = gridPaths(layout, cell);
    const marked = gridPaths(layout, cell, turns);
    // The turn's boundary happens not to fall on a fifth round, so the heavy
    // lines are untouched; the light ones lose exactly that one rule.
    expect(marked.heavy).toBe(plain.heavy);
    expect(marked.light.length).toBeLessThan(plain.light.length);
  });

  it("is absent from a hat that is never turned", () => {
    const { layout, turns } = chartOf("sww15-baa-ble-hat");
    expect(turns).toEqual([]);
    expect(gridPaths(layout, cell, turns)).toEqual(gridPaths(layout, cell));
  });

  it("numbers both rounds the turn falls between, so it can be named", () => {
    const { layout, turns } = chartOf("sww26-birsie-beanny");
    const [turn] = turns;
    const numbers = numberedRounds(layout, turns);
    expect(numbers).toContain(turn);
    expect(numbers).toContain(turn + 1);
    // Ascending, with no round counted twice.
    expect(numbers).toEqual([...new Set(numbers)].sort((a, b) => a - b));
    // And nothing else is numbered that was not numbered before.
    const before = numberedRounds(layout);
    expect(numbers.filter((round) => !before.includes(round))).toEqual(
      [turn, turn + 1].filter((round) => !before.includes(round)),
    );
  });
});
