import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";

/**
 * Where you are in a hat, and what to work next.
 *
 * Progress is the id of the last stitch worked, so the next one is the one
 * after it. A percentage is no use with needles in your hands; what you need
 * is the round, the stitch within it, and how many of this stitch in this
 * colour to work before either changes.
 *
 * The rounds come from the pattern rather than being recovered from the
 * stitch graph, so the round a knitter is told they are on is the round the
 * pattern prints.
 */

export interface RoundIndex {
  rounds: number[][];
  /** Round number, 1-based, for each stitch id. */
  roundOf: Map<number, number>;
  /**
   * Every worked stitch's id, ascending.
   *
   * Kept so that "how many have been worked" is a binary search rather than a
   * walk of the whole hat. It used to be `rounds.flat().filter(...)`, which
   * allocated two ten-thousand element arrays every time a stitch was worked.
   */
  worked: number[];
  labels: string[];
  totalRounds: number;
}

export const indexRounds = (
  rounds: number[][],
  labels: string[] = [],
): RoundIndex => {
  const roundOf = new Map<number, number>();
  const worked: number[] = [];
  rounds.forEach((round, index) =>
    round.forEach((id) => {
      roundOf.set(id, index + 1);
      worked.push(id);
    }),
  );
  return { rounds, roundOf, worked, labels, totalRounds: rounds.length };
};

/** How many of an ascending list are at or below a value. */
const countUpTo = (ascending: number[], value: number): number => {
  let low = 0;
  let high = ascending.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (ascending[middle] <= value) low = middle + 1;
    else high = middle;
  }
  return low;
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

export interface Run {
  slot: string;
  type: StitchType;
  length: number;
  startId: number;
  endId: number;
}

/**
 * What a knitter calls one of these.
 *
 * The one-for-one stitches are counted as stitches - "purl 2" - and the rest
 * as repetitions of themselves, because that is how a pattern writes them:
 * you do not work three stitches of k2tog, you work k2tog three times.
 */
const words: Record<
  StitchType,
  { said: string; after?: string; perStitch: boolean }
> = {
  k1: { said: "knit", perStitch: true },
  p1: { said: "purl", perStitch: true },
  // The count goes in the middle, as a pattern writes it: "knit 2 tbl".
  k1tbl: { said: "knit", after: "tbl", perStitch: true },
  m1: { said: "m1", perStitch: false },
  k2tog: { said: "k2tog", perStitch: false },
  s2kp: { said: "s2kp", perStitch: false },
  sk2p: { said: "sk2p", perStitch: false },
  // Never worked: the seam that closes the cast-on round. See below.
  join: { said: "knit", perStitch: true },
};

/** "knit", "purl", "knit tbl", "k2tog". */
export const stitchWord = (type: StitchType): string =>
  [words[type].said, words[type].after].filter(Boolean).join(" ");

/**
 * The instruction a run is: "Knit 6", "Purl 2", "K2tog x 3".
 *
 * Which is the whole point of breaking runs on the stitch as well as the
 * yarn. A round of twisted rib is one colour from end to end, and telling
 * somebody to work 126 of it says nothing about the four different stitches
 * it is made of.
 */
export const runInstruction = (run: Run): string => {
  const { said, after, perStitch } = words[run.type];
  const phrase = perStitch
    ? [said, run.length, after].filter(Boolean).join(" ")
    : run.length === 1
      ? said
      : `${said} x ${run.length}`;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
};

/*
 * The seam that closes the cast-on round is not a stitch anybody works - see
 * workable - so it must not break the run it sits in. Reading it as a knit
 * does that, and costs nothing: a cast-on round is knits and one seam.
 */
const typeOf = (stitch: Stitch): StitchType =>
  stitch.type === "join" ? "k1" : stitch.type;

/**
 * The run of one yarn and one stitch starting at the next stitch.
 *
 * This is the instruction that matters in Fair Isle: work this many of this
 * stitch in this colour, then change. A run stops at the end of a round,
 * because that is where a knitter's attention resets.
 */
export const currentRun = (
  stitches: Stitch[],
  progress: number,
  index: RoundIndex,
): Run | undefined => {
  /*
   * Stitches are made in order and never reordered, so a stitch's id is its
   * place in the list and it can simply be looked up. This used to build a
   * map of ten thousand entries to find one stitch, three times over per
   * stitch worked, which was most of what made the knitting page slow.
   */
  const startId = progress + 1;
  const first = stitches[startId];
  if (!first) return undefined;

  const round = index.roundOf.get(startId);
  const type = typeOf(first);
  let endId = startId;
  for (let id = startId + 1; ; id++) {
    const candidate = stitches[id];
    if (!candidate) break;
    if (candidate.slot !== first.slot) break;
    if (typeOf(candidate) !== type) break;
    if (index.roundOf.get(id) !== round) break;
    endId = id;
  }

  return { slot: first.slot, type, length: endId - startId + 1, startId, endId };
};

export const upcomingRuns = (
  stitches: Stitch[],
  progress: number,
  index: RoundIndex,
  count = 3,
): Run[] => {
  const runs: Run[] = [];
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
  const total = index.worked.length;
  const done = countUpTo(index.worked, Math.max(progress, 0));
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
