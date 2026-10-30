import type { Stitch } from "../types/Stitch";
import type { ChartLayout } from "./layout";
import { type RowIndex, indexRows } from "./column-window";
import { type Join, markAt } from "./chart-marks";
import type { Mark } from "../helpers/stitch-marks";
import type { MarkerLine } from "./markers";
import type { Break } from "./breaks";

/** Every fifth round and column is counted by: numbered down the edge, and ruled heavier. */
export const emphasis = 5;

/**
 * Which rounds get a number down the right-hand edge.
 *
 * Every fifth, the first and the last - and both rounds a turn or a change of
 * needles falls between, so the line across the chart can be named in words
 * and found by eye.
 */
export const numberedRounds = (layout: ChartLayout, turns: number[] = [], needleChanges: number[] = []): number[] => {
  const named = new Set<number>();
  [...turns, ...needleChanges].forEach((round) => {
    named.add(round);
    named.add(round + 1);
  });
  const out: number[] = [];
  for (let round = 1; round <= layout.rounds; round++) {
    if (round % emphasis === 0 || round === 1 || round === layout.rounds || named.has(round)) out.push(round);
  }
  return out;
};

/**
 * Everything the chart draws, gathered once for a layout, so that any piece
 * of it can be painted on its own: a tile of the chart as it scrolls into
 * view, at whatever place the columns have been given. See chart-painter.
 *
 * Built afresh when the layout or the knitting changes, and never as you
 * knit: what changes then - how much is done - is read at the time of
 * painting.
 */
export interface ChartScene {
  layout: ChartLayout;
  index: RowIndex;
  stitches: Stitch[];
  rounds: number[][];
  /** Where each stitch is on the chart, by id: its round, or 0 where it is not drawn, and its column. */
  rowOf: Int32Array;
  columnOf: Int32Array;
  /** The yarn slot of each stitch in the index, by its place there. */
  slotAt: Uint16Array;
  slots: string[];
  /** The rounds numbered down the edge. */
  numbered: number[];
  /** 1 for each stitch in the index whose mark is a fork across two loops, by its place there. */
  forkAt: Uint8Array;
  /** The furthest a fork reaches from its own column, to the stitch below or its second loop, in columns. */
  forkReach: number;
  /** The rounds after which the needles are changed. */
  needleRules: number[];
  /** The rounds after which the work is turned inside out. */
  wraps: number[];
  join?: Join;
  /** Which way the round before the join and the round after it run across the chart: -1 leftwards. */
  joinWays: [number, number];
  /** The start of the round's marker, a line up the chart for each stretch between turns. */
  markers: MarkerLine[];
  /** A hat's chart is never torn apart: see breaks. */
  breaks: Break[];
  makeOneLean?: "left" | "right";
  /**
   * A stitch's mark. A fork across the two loops of a KFB reaches to the
   * stitch below and the loop it makes, wherever their columns have been
   * put, so it is worked out from `centre`, each column's middle across the
   * chart; any other mark sits in its own cell, and is worked out once.
   */
  markOf(id: number, centre: (column: number) => number, cell: number): Mark | undefined;
}

export const sceneOf = (
  layout: ChartLayout,
  stitches: Stitch[],
  rounds: number[][],
  options: {
    needleRules?: number[];
    wraps?: number[];
    join?: Join;
    markers?: MarkerLine[];
    makeOneLean?: "left" | "right";
  } = {},
): ChartScene => {
  const { needleRules = [], wraps = [], join, markers = [], makeOneLean } = options;
  const index = indexRows(layout);
  const size = stitches.length;
  const rowOf = new Int32Array(size);
  const columnOf = new Int32Array(size);
  layout.cells.forEach((at, id) => {
    if (id < 0 || id >= size) return;
    rowOf[id] = at.round;
    columnOf[id] = Math.round(at.column);
  });

  const slots: string[] = [];
  const slotIndex = new Map<string, number>();
  const slotAt = new Uint16Array(index.id.length);
  const forkAt = new Uint8Array(index.id.length);
  let forkReach = 0;
  index.id.forEach((id, k) => {
    if (stitches[id]?.type === "kfb") {
      forkAt[k] = 1;
      for (const other of [stitches[id].links[0], id + 1]) {
        if (rowOf[other]) forkReach = Math.max(forkReach, Math.abs(columnOf[other] - columnOf[id]));
      }
    }
    const slot = stitches[id]?.slot ?? "";
    if (!slotIndex.has(slot)) {
      slotIndex.set(slot, slots.length);
      slots.push(slot);
    }
    slotAt[k] = slotIndex.get(slot)!;
  });

  // Which way a round runs across the chart, from its first two stitches: -1 leftwards, as most do.
  const wayOf = (ids: number[] | undefined) => {
    const [a, b] = [ids?.[0], ids?.[1]];
    if (a === undefined || b === undefined || !rowOf[a] || !rowOf[b]) return -1;
    return columnOf[b] < columnOf[a] ? 1 : -1;
  };
  const joinWays: [number, number] = join ? [wayOf(rounds[join.after - 1]), wayOf(rounds[join.after])] : [-1, -1];

  const byId = { get: (id: number) => stitches[id] } as Map<number, Stitch>;
  const fixed = new Map<number, Mark | undefined>();
  const markOf = (id: number, centre: (column: number) => number, cell: number): Mark | undefined => {
    const stitch = stitches[id];
    if (!stitch) return undefined;
    if (stitch.type !== "kfb") {
      if (!fixed.has(id)) fixed.set(id, markAt(stitch, byId, layout, makeOneLean));
      return fixed.get(id);
    }
    /*
     * markAt measures a fork by how many columns its ends are from the
     * stitch's own, so it is given columns that are where each is drawn:
     * a cell's width a column, counted the chart's way, leftwards.
     */
    const placed = {
      ...layout,
      cells: {
        get: (one: number) => {
          const at = layout.cells.get(one);
          return at && { ...at, column: -centre(Math.round(at.column)) / cell };
        },
      },
    } as unknown as ChartLayout;
    return markAt(stitch, byId, placed, makeOneLean);
  };

  return {
    layout,
    index,
    stitches,
    rounds,
    rowOf,
    columnOf,
    slotAt,
    slots,
    numbered: numberedRounds(layout, wraps, needleRules),
    forkAt,
    forkReach,
    needleRules,
    wraps,
    join,
    joinWays,
    markers,
    breaks: [],
    makeOneLean,
    markOf,
  };
};
