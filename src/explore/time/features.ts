/**
 * What each step of a hat asks of a knitter, as countable operations.
 *
 * The unit a cost model prices: a stitch of some type, plus whatever it
 * costs to get to it - a change of yarn, a change between knit and purl,
 * working a round that carries two yarns. Steps (joining, turning, changing
 * needles) are operations of their own.
 */
import { HatPattern } from "../../data/hats/types";
import { buildHat } from "../../knitting/engine";
import { paletteOf, yarnFor } from "../../knitting/palette";
import { Stitch, isFabric, isStep } from "../../types/Stitch";

export const operations = [
  "castOn",
  "knit",
  "purl",
  "tbl",
  "decrease",
  "doubleDecrease",
  "makeOne",
  "kfb",
  "colourChange",
  "knitPurlSwitch",
  "stranded",
  "join",
  "turn",
  "needles",
] as const;
export type Operation = (typeof operations)[number];
export type Counts = Partial<Record<Operation, number>>;

export interface HatFeatures {
  stitches: Stitch[];
  rounds: number[][];
  roundOf: Map<number, number>;
  /** Operations per stitch id; empty for the phantom. */
  ops: Counts[];
  /** Label per round, for warm-up at the start of each chart. */
  labels: string[];
}

const purly = (stitch: Stitch) => stitch.type === "p1";

const base = (stitch: Stitch): Operation | undefined => {
  switch (stitch.type) {
    case "castOn": return "castOn";
    case "k1": return "knit";
    case "p1": return "purl";
    case "k1tbl": return "tbl";
    case "k2tog": case "k2togtbl": return "decrease";
    case "s2kp": case "sk2p": return "doubleDecrease";
    case "m1": return "makeOne";
    case "kfb": return "kfb";
    case "join": return "join";
    case "turn": return "turn";
    case "needles": return "needles";
    default: return undefined;
  }
};

export const featuresOf = (hat: HatPattern, sizeId?: string): HatFeatures => {
  const { stitches, rounds, roundLabels } = buildHat(hat, sizeId);
  const palette = paletteOf(hat.colourways[0], {}, hat.charts);
  const yarn = (stitch: Stitch) => yarnFor(palette, stitch.slot).name;
  const roundOf = new Map<number, number>();
  rounds.forEach((ids, index) => ids.forEach((id) => roundOf.set(id, index + 1)));
  const stranded = rounds.map((ids) => new Set(ids.map((id) => yarn(stitches[id]))).size > 1);

  const ops: Counts[] = stitches.map(() => ({}));
  let previous: Stitch | undefined;
  for (const stitch of stitches) {
    if (stitch.id === 0) continue;
    const counts = ops[stitch.id];
    const op = base(stitch);
    if (op) counts[op] = 1;
    if (isStep(stitch) || !isFabric(stitch)) continue;
    if (previous && stitch.type !== "castOn") {
      if (yarn(previous) !== yarn(stitch)) counts.colourChange = 1;
      if (purly(previous) !== purly(stitch) && previous.type !== "castOn") counts.knitPurlSwitch = 1;
    }
    const round = roundOf.get(stitch.id);
    if (round !== undefined && stranded[round - 1] && stitch.type !== "castOn") counts.stranded = 1;
    previous = stitch;
  }
  return { stitches, rounds, roundOf, ops, labels: roundLabels };
};

export const add = (into: Counts, counts: Counts, times = 1) => {
  for (const [op, n] of Object.entries(counts) as [Operation, number][]) {
    into[op] = (into[op] ?? 0) + n * times;
  }
  return into;
};

/** Operations over the stitches after `from`, up to and including `to`. */
export const countsBetween = (features: HatFeatures, from: number, to: number): Counts => {
  const out: Counts = {};
  for (let id = from + 1; id <= to; id++) add(out, features.ops[id] ?? {});
  return out;
};

export const priced = (counts: Counts, costs: Partial<Record<Operation, number>>) =>
  Object.entries(counts).reduce((sum, [op, n]) => sum + (costs[op as Operation] ?? 0) * (n ?? 0), 0);
