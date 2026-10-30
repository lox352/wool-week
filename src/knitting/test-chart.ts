import type { Stitch } from "../types/Stitch";
import type { ChartLayout } from "./layout";

/**
 * A small chart for testing the tiles with, of the shape they were built
 * against on the sweater site, where they began: drawn here row by row, the
 * top row first and column 1 at the right, as a chart reads. A rib of
 * stitches spread out under the make-ones that fill it in, blocks of columns
 * that open and close on both sides of a box as the rounds in view change,
 * and rounds at the top with gaps in, so that rounds close up too.
 *
 * A hat's chart has all of these, but never all in so few stitches: its
 * crown closes columns up, and only its very top closes rounds.
 */
const shape = [
  "############............####################............########",
  "##############.######.########################.######.##########",
  "##############.######.########################.######.##########",
  "################################################################",
  "################################################################",
  "########......########..################......########..########",
  "########......########..################......########..########",
  "########......########..################......########..########",
  ".#.#.#.#.......#.#.#.#...#.#.#.#.#.#.#.#.......#.#.#.#...#.#.#.#",
  ".#.#.#.#.......#.#.#.#...#.#.#.#.#.#.#.#.......#.#.#.#...#.#.#.#",
  ".#.#.#.#.......#.#.#.#...#.#.#.#.#.#.#.#.......#.#.#.#...#.#.#.#",
];

/** The chart's stitches, a round of it to each row, worked right to left; its layout; and its rounds. */
export const testChart = (): { stitches: Stitch[]; rounds: number[][]; layout: ChartLayout } => {
  const columns = shape[0].length;
  const stitches: Stitch[] = [{ id: 0, position: { x: 0, y: 0, z: 0 }, links: [], fixed: true, type: "castOn", slot: "A" }];
  const rounds: number[][] = [];
  const cells: ChartLayout["cells"] = new Map();
  [...shape].reverse().forEach((row, below) => {
    const round: number[] = [];
    for (let column = 1; column <= columns; column++) {
      if (row[columns - column] !== "#") continue;
      const id = stitches.length;
      stitches.push({
        id,
        position: { x: 0, y: 0, z: 0 },
        links: [],
        fixed: false,
        type: below === 0 ? "castOn" : "k1",
        slot: (column + below) % 3 === 0 ? "B" : "A",
      });
      cells.set(id, { round: below + 1, column, index: round.length + 1 });
      round.push(id);
    }
    rounds.push(round);
  });
  return { stitches, rounds, layout: { cells, rounds: shape.length, columns } };
};
