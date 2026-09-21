import { Stitch } from "../types/Stitch";

export interface Cell {
  /** 1-based, counting up from the cast-on. */
  round: number;
  /** 1-based, counting from the right-hand edge, where stitch 1 is. */
  column: number;
}

export interface ChartLayout {
  cells: Map<number, Cell>;
  rounds: number;
  columns: number;
}

/**
 * Lay the tube out flat as a chart.
 *
 * A stitch sits above the first stitch it was worked into, so a round lines up
 * with the round below it and the motif stays square. Where two or three
 * stitches were taken together the ones that went into the decrease leave a
 * gap, which is what draws the crown's decrease lines spiralling up the chart,
 * and where a stitch was made out of nothing everything after it shifts along
 * to make room.
 *
 * The cursor is what keeps those two rules from fighting: a stitch never lands
 * left of the one before it, so an increase pushes the rest of its round along
 * instead of landing on top of its neighbour.
 */
export const layOut = (stitches: Stitch[], rounds: number[][]): ChartLayout => {
  const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));
  const columnOf = new Map<number, number>();
  const cells = new Map<number, Cell>();
  let columns = 0;

  rounds.forEach((round, index) => {
    let cursor = 0;
    round.forEach((id) => {
      const stitch = byId.get(id);
      // Every link but the last is a stitch in the round below; the last is
      // the stitch before this one in its own round.
      const parent = stitch?.links.slice(0, -1)[0];
      const wanted = parent === undefined ? cursor : columnOf.get(parent) ?? cursor;
      const column = Math.max(wanted, cursor);
      cursor = column + 1;
      columnOf.set(id, column);
      cells.set(id, { round: index + 1, column: column + 1 });
      columns = Math.max(columns, column + 1);
    });
  });

  return { cells, rounds: rounds.length, columns };
};

/** The stitches to draw. Stitch 0 is the phantom start of the helix. */
export const chartedStitches = (stitches: Stitch[]): Stitch[] =>
  stitches.filter((stitch) => stitch.id !== 0);
