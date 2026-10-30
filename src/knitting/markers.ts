import { type Stitch, isFabric } from "../types/Stitch";
import type { ChartLayout } from "./layout";

/**
 * The marker at the start of the round, as a line up the chart.
 *
 * A hat is knitted in the round from a marker slipped at the start of every
 * round, and on the chart that marker stands beside each round's first
 * stitch: on the chart's right-hand edge, where a round begins, until the
 * work is turned inside out, after which the rounds run the other way across
 * the chart and begin at its left-hand edge. It is drawn in three tenses, as
 * the sweater site draws its markers: grey where it has been, heavy beside the
 * round being worked, and dashed up the rounds still to come.
 */

/** A marker in one row: the column it stands to the left of, and the stitch it is reached after. */
export interface MarkerRow {
  row: number;
  after: number;
  passed: number;
  /** The round's first stitch. */
  start: number;
}

/** A stitch marker, up the chart: between two columns, from the row it is placed in to the row it comes off in. */
export interface MarkerLine {
  marker: string;
  /** The column it stands to the left of, counted from the chart's right-hand edge, where it is placed. */
  after: number;
  from: number;
  to: number;
  /** The steps placing it and taking it off, where it comes off. */
  placed: number;
  off?: number;
  /** Row by row, up from the row it is placed in: see MarkerRow. */
  route: MarkerRow[];
  /** A marker at the start of the round, beside each round's first stitch. */
  atStart?: boolean;
}

const fabricBefore = (stitches: Stitch[], id: number): number => {
  let at = id;
  while (at > 0 && !isFabric(stitches[at])) at--;
  return at;
};

/**
 * The start of the round's marker, from the round after the join - it is
 * placed as the knitting is joined - or the first round, with no join to
 * place it. One line for each stretch between turns, each up one boundary:
 * to the right of the rightmost first stitch of a stretch worked leftwards,
 * to the left of the leftmost of one worked rightwards.
 */
export const startOfRound = (
  stitches: Stitch[],
  rounds: number[][],
  layout: ChartLayout,
  /** The join step, if the hat has one. */
  joined?: { after: number; step: number },
): MarkerLine[] => {
  const columnOf = (id: number) => Math.round(layout.cells.get(id)?.column ?? 0);
  const stretches: { leftwards: boolean; route: MarkerRow[] }[] = [];
  let leftwards = true;
  for (let index = joined?.after ?? 0; index < rounds.length; index++) {
    const round = rounds[index];
    const first = round[0];
    if (first === undefined || !layout.cells.has(first)) continue;
    // Columns rise leftwards: a round run the other way has its second stitch to the right of its first.
    if (round.length > 1) leftwards = columnOf(round[1]) > columnOf(first);
    const row = {
      row: layout.cells.get(first)!.round,
      after: leftwards ? columnOf(first) - 1 : columnOf(first),
      passed: index === (joined?.after ?? 0) ? (joined?.step ?? 0) : fabricBefore(stitches, first - 1),
      start: first,
    };
    const last = stretches[stretches.length - 1];
    if (last && last.leftwards === leftwards) last.route.push(row);
    else stretches.push({ leftwards, route: [row] });
  }
  return stretches.map(({ leftwards, route }, k) => {
    const afters = route.map((row) => row.after);
    const after = leftwards ? Math.min(...afters) : Math.max(...afters);
    const next = stretches[k + 1]?.route[0];
    return {
      marker: "start",
      after,
      from: route[0].row,
      to: route[route.length - 1].row,
      placed: route[0].passed,
      ...(next ? { off: next.passed } : {}),
      route: route.map((row) => ({ ...row, after })),
      atStart: true,
    };
  });
};

/** The lines turned over with the chart, left for right: see mirrorLayout. */
export const mirrorLines = (lines: MarkerLine[], columns: number): MarkerLine[] =>
  lines.map((line) => ({
    ...line,
    after: columns - line.after,
    route: line.route.map((row) => ({ ...row, after: columns - row.after })),
  }));
