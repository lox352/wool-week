import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";
import { ChartLayout } from "./layout";
import { Palette, inkOn, yarnFor } from "./palette";
import { markFor } from "../helpers/stitch-marks";
import { SlotId } from "../data/hats/types";

/**
 * The chart as paths.
 *
 * A chart of ten thousand stitches cannot be ten thousand elements - that was
 * the CSS grid this replaced, and it cost about six hundred milliseconds a
 * stitch. But it does not have to be. The hat on the same page draws ten
 * thousand stitches in one call by instancing them, and the equivalent here is
 * that a chart is mostly long runs of one colour: merge each run into a
 * rectangle, and every rectangle of a given yarn into one path, and the whole
 * chart is eight paths and a couple for the rules.
 *
 * Which keeps it vector, so it stays sharp at any pixel ratio and when zoomed
 * or printed - where the canvas it replaces was capped at 2048 pixels a side
 * and so drew at a third of native resolution on a phone.
 */

/** Every nth line is drawn heavier, to make counting easier. */
const emphasis = 5;

export const cellAt = (
  layout: ChartLayout,
  round: number,
  column: number,
  cell: number,
) => ({
  // The cast-on belongs at the bottom, and stitch 1 at the right.
  x: (layout.columns - column) * cell,
  y: (layout.rounds - round) * cell,
});

/** Room to the right of the chart for the round numbers. */
export const gutter = (cell: number) => Math.round(cell * 2.2);

export const chartSize = (layout: ChartLayout, cell: number) => ({
  width: layout.columns * cell + gutter(cell),
  height: layout.rounds * cell,
});

const rect = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y}h${w}v${h}h${-w}z`;

/**
 * One filled path per yarn.
 *
 * Runs of a colour along a round become a single rectangle, which on Fair Isle
 * takes tens of thousands of cells down to a few thousand rectangles across
 * eight paths.
 */
export const fillPaths = (
  stitches: Stitch[],
  layout: ChartLayout,
  cell: number,
): { slot: SlotId; d: string }[] => {
  const byRound = new Map<number, { column: number; slot: SlotId }[]>();
  for (const stitch of stitches) {
    const at = layout.cells.get(stitch.id);
    if (!at) continue;
    const row = byRound.get(at.round) ?? [];
    row.push({ column: at.column, slot: stitch.slot });
    byRound.set(at.round, row);
  }

  const paths = new Map<SlotId, string[]>();
  for (const [round, cells] of byRound) {
    // Columns count from the right, so ascending column runs leftwards.
    cells.sort((a, b) => a.column - b.column);
    let start = 0;
    for (let i = 1; i <= cells.length; i++) {
      const ends =
        i === cells.length ||
        cells[i].slot !== cells[start].slot ||
        cells[i].column !== cells[i - 1].column + 1;
      if (!ends) continue;
      const from = cells[start];
      const to = cells[i - 1];
      const left = cellAt(layout, round, to.column, cell);
      const width = (to.column - from.column + 1) * cell;
      const run = paths.get(from.slot) ?? [];
      run.push(rect(left.x, left.y, width, cell));
      paths.set(from.slot, run);
      start = i;
    }
  }

  return [...paths].map(([slot, parts]) => ({ slot, d: parts.join("") }));
};

/**
 * The rules between cells, as two paths: the hairlines, and the heavier ones
 * that fall after every fifth stitch and every fifth round.
 *
 * Collinear segments are merged, so a chart's worth of cell edges comes out as
 * a few hundred lines rather than one per cell.
 */
export const gridPaths = (
  layout: ChartLayout,
  cell: number,
): { light: string; heavy: string } => {
  const filled = new Set<string>();
  layout.cells.forEach((at) => filled.add(`${at.round},${at.column}`));
  const has = (round: number, column: number) =>
    filled.has(`${round},${column}`);

  const light: string[] = [];
  const heavy: string[] = [];

  // Horizontal rules: for each round boundary, the runs of columns that need one.
  for (let round = 0; round <= layout.rounds; round++) {
    let start: number | null = null;
    for (let column = 1; column <= layout.columns + 1; column++) {
      const needed =
        column <= layout.columns && (has(round, column) || has(round + 1, column));
      if (needed && start === null) start = column;
      if (!needed && start !== null) {
        const left = cellAt(layout, round, column - 1, cell);
        const width = (column - 1 - start + 1) * cell;
        const line = `M${left.x} ${left.y}h${width}`;
        (round !== 0 && round % emphasis === 0 ? heavy : light).push(line);
        start = null;
      }
    }
  }

  // And vertical rules, the same way down the columns.
  for (let column = 0; column <= layout.columns; column++) {
    let start: number | null = null;
    for (let round = 1; round <= layout.rounds + 1; round++) {
      const needed =
        round <= layout.rounds && (has(round, column) || has(round, column + 1));
      if (needed && start === null) start = round;
      if (!needed && start !== null) {
        const top = cellAt(layout, round - 1, column, cell);
        const height = (round - 1 - start + 1) * cell;
        const line = `M${top.x} ${top.y}v${height}`;
        (column !== 0 && column % emphasis === 0 ? heavy : light).push(line);
        start = null;
      }
    }
  }

  return { light: light.join(""), heavy: heavy.join("") };
};

/**
 * The knitting symbols, grouped by the ink they need.
 *
 * A mark has to read on whatever yarn is under it, so it is drawn in dark ink
 * on a pale wool and pale ink on a dark one - which is two paths, not two
 * thousand.
 */
export const markPaths = (
  stitches: Stitch[],
  layout: ChartLayout,
  palette: Palette,
  cell: number,
): { ink: string; strokes: string; dots: string }[] => {
  const groups = new Map<string, { strokes: string[]; dots: string[] }>();

  for (const stitch of stitches) {
    const mark = markFor(stitch.type as StitchType);
    if (!mark) continue;
    const at = layout.cells.get(stitch.id);
    if (!at) continue;
    const { x, y } = cellAt(layout, at.round, at.column, cell);
    const ink = inkOn(yarnFor(palette, stitch.slot).hex);
    const group = groups.get(ink) ?? { strokes: [], dots: [] };

    for (const stroke of mark.strokes ?? []) {
      group.strokes.push(
        stroke
          .map(
            ([px, py], i) =>
              `${i === 0 ? "M" : "L"}${(x + px * cell).toFixed(1)} ${(
                y +
                py * cell
              ).toFixed(1)}`,
          )
          .join(""),
      );
    }
    if (mark.dot) {
      const cx = x + mark.dot.x * cell;
      const cy = y + mark.dot.y * cell;
      const r = mark.dot.r * cell;
      // A circle as a path, so every dot of one ink is one element.
      group.dots.push(
        `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`,
      );
    }
    groups.set(ink, group);
  }

  return [...groups].map(([ink, group]) => ({
    ink,
    strokes: group.strokes.join(""),
    dots: group.dots.join(""),
  }));
};

/**
 * One rectangle per round covering what has been knitted.
 *
 * Columns only ever increase across a round, so the stitches worked so far are
 * a run rather than a scatter: the whole of the finished knitting veils with
 * one rectangle per round instead of one per stitch, which is what keeps a
 * stitch costing the same on a ten thousand stitch hat as on a small one.
 */
export const progressPath = (
  layout: ChartLayout,
  rounds: number[][],
  progress: number,
  cell: number,
): string => {
  const parts: string[] = [];
  for (let index = 0; index < rounds.length; index++) {
    const ids = rounds[index];
    if (ids.length === 0 || ids[0] > progress) break;
    let last = ids.length - 1;
    while (last >= 0 && ids[last] > progress) last--;
    if (last < 0) break;
    const from = layout.cells.get(ids[0])?.column;
    const to = layout.cells.get(ids[last])?.column;
    if (from === undefined || to === undefined) continue;
    const left = cellAt(layout, index + 1, to, cell);
    const right = cellAt(layout, index + 1, from, cell);
    parts.push(rect(left.x, left.y, right.x - left.x + cell, cell));
  }
  return parts.join("");
};

/** Which rounds get a number down the right-hand edge. */
export const numberedRounds = (layout: ChartLayout): number[] => {
  const out: number[] = [];
  for (let round = 1; round <= layout.rounds; round++) {
    if (round % emphasis === 0 || round === 1 || round === layout.rounds) {
      out.push(round);
    }
  }
  return out;
};
