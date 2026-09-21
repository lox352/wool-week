import { Stitch } from "../types/Stitch";
import { SlotId } from "../data/hats/types";

/**
 * Where you are in a hat, and what to work next.
 *
 * Progress is the id of the last stitch worked, so the next one is the one
 * after it. A percentage is no use with needles in your hands; what you need
 * is the round, the stitch within it, and how many of this colour to work
 * before you change.
 *
 * The rounds come from the pattern rather than being recovered from the
 * stitch graph, so the round a knitter is told they are on is the round the
 * pattern prints.
 */

export interface RoundIndex {
  rounds: number[][];
  /** Round number, 1-based, for each stitch id. */
  roundOf: Map<number, number>;
  labels: string[];
  totalRounds: number;
}

export const indexRounds = (
  rounds: number[][],
  labels: string[] = [],
): RoundIndex => {
  const roundOf = new Map<number, number>();
  rounds.forEach((round, index) =>
    round.forEach((id) => roundOf.set(id, index + 1)),
  );
  return { rounds, roundOf, labels, totalRounds: rounds.length };
};

export interface Position {
  round: number;
  totalRounds: number;
  label?: string;
  stitchInRound: number;
  stitchesInRound: number;
  nextStitchId?: number;
  finished: boolean;
}

export const positionOf = (
  stitches: Stitch[],
  progress: number,
  index: RoundIndex,
): Position => {
  const lastId = stitches.length > 0 ? stitches[stitches.length - 1].id : 0;
  const nextStitchId = progress >= lastId ? undefined : progress + 1;
  const reference = nextStitchId ?? progress;
  const round = index.roundOf.get(reference) ?? index.totalRounds;
  const ids = index.rounds[round - 1] ?? [];

  return {
    round,
    totalRounds: index.totalRounds,
    label: index.labels[round - 1],
    stitchInRound: Math.max(ids.indexOf(reference) + 1, 1),
    stitchesInRound: ids.length,
    nextStitchId,
    finished: nextStitchId === undefined,
  };
};

export interface ColourRun {
  slot: SlotId;
  length: number;
  startId: number;
  endId: number;
}

/**
 * The run of one yarn starting at the next stitch.
 *
 * This is the instruction that matters in Fair Isle: work this many in this
 * colour, then change. A run stops at the end of a round, because that is
 * where a knitter's attention resets.
 */
export const currentRun = (
  stitches: Stitch[],
  progress: number,
  index: RoundIndex,
): ColourRun | undefined => {
  const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));
  const startId = progress + 1;
  const first = byId.get(startId);
  if (!first) return undefined;

  const round = index.roundOf.get(startId);
  let endId = startId;
  for (let id = startId + 1; ; id++) {
    const candidate = byId.get(id);
    if (!candidate) break;
    if (candidate.slot !== first.slot) break;
    if (index.roundOf.get(id) !== round) break;
    endId = id;
  }

  return { slot: first.slot, length: endId - startId + 1, startId, endId };
};

export const upcomingRuns = (
  stitches: Stitch[],
  progress: number,
  index: RoundIndex,
  count = 3,
): ColourRun[] => {
  const runs: ColourRun[] = [];
  let at = progress;
  for (let i = 0; i < count; i++) {
    const run = currentRun(stitches, at, index);
    if (!run) break;
    runs.push(run);
    at = run.endId;
  }
  return runs;
};

/** Stitch ids that are worked, so the phantom and the seam are excluded. */
export const workable = (stitches: Stitch[]): Stitch[] =>
  stitches.filter((stitch) => stitch.id !== 0 && stitch.type !== "join");

export const totals = (
  index: RoundIndex,
  progress: number,
): { worked: number; total: number; remaining: number; percent: number } => {
  const total = index.rounds.reduce((sum, round) => sum + round.length, 0);
  const last = index.rounds[index.rounds.length - 1];
  const lastId = last ? last[last.length - 1] : 0;
  const worked = Math.min(Math.max(progress, 0), lastId);
  const done = index.rounds
    .flat()
    .filter((id) => id <= worked).length;
  return {
    worked: done,
    total,
    remaining: total - done,
    percent: total === 0 ? 0 : (100 * done) / total,
  };
};

/** Id of the last stitch of the round holding `progress + 1`. */
export const endOfRound = (
  progress: number,
  index: RoundIndex,
): number | undefined => {
  const round = index.roundOf.get(progress + 1);
  if (round === undefined) return undefined;
  const ids = index.rounds[round - 1];
  return ids?.[ids.length - 1];
};
