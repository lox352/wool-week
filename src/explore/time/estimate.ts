/**
 * Three ways of turning what was recorded into a pace, a time remaining,
 * and a time for each stitch.
 *
 *   flat   - time so far over stitches so far
 *   fitted - a cost per operation, by non-negative least squares over the
 *            observations: each took (its operations x their costs) + a tap
 *   prior  - the same, pulled towards typical costs while there is little
 *            to go on, so that early estimates are not wild
 */
import { HatFeatures, Operation, operations } from "./features";
import { defaultCosts, defaultTap } from "./simulate";
import type { Observation } from "./record";

export const columns = [...operations, "tap"] as const;
export type Column = (typeof columns)[number];
export type Costs = Record<Column, number>;

export const typical: Costs = { ...defaultCosts, tap: defaultTap };

/** Operation counts from stitch 1 up to each id, for counting any span at once. */
export class Prefix {
  private sums: Float64Array[];
  constructor(features: HatFeatures) {
    this.sums = operations.map((op) => {
      const out = new Float64Array(features.ops.length);
      for (let id = 1; id < out.length; id++) out[id] = out[id - 1] + (features.ops[id][op] ?? 0);
      return out;
    });
  }
  counts(from: number, to: number): number[] {
    return this.sums.map((sum) => sum[Math.min(to, sum.length - 1)] - sum[Math.max(from, 0)]);
  }
}

/** Seconds a span should take at these costs, counting one tap for it. */
export const predict = (prefix: Prefix, costs: Costs, from: number, to: number, taps = 1) =>
  prefix.counts(from, to).reduce((sum, n, i) => sum + n * costs[operations[i] as Operation], 0) +
  taps * costs.tap;

/* --------------------------------------------------------------- flat */

export const flatRate = (observations: Observation[], prefix: Prefix) => {
  let ms = 0;
  let stitches = 0;
  for (const o of observations) {
    if (o.ms === undefined) continue;
    ms += o.ms;
    stitches += o.to - o.from;
  }
  return stitches > 0 ? ms / 1000 / stitches : undefined;
  void prefix;
};

/* ------------------------------------------------------------- fitted */

/**
 * Least squares with every cost at least zero (Lawson and Hanson), on the
 * normal equations: a dozen or so unknowns, however many observations.
 */
const nnls = (ata: number[][], atb: number[]): number[] => {
  const n = atb.length;
  const x = new Array(n).fill(0);
  const passive = new Array(n).fill(false);
  const gradient = () => atb.map((b, i) => b - ata[i].reduce((s, a, j) => s + a * x[j], 0));
  const solve = (set: number[]) => {
    const m = set.map((i) => set.map((j) => ata[i][j]));
    const v = set.map((i) => atb[i]);
    // Gaussian elimination with partial pivoting.
    for (let c = 0; c < set.length; c++) {
      let p = c;
      for (let r = c + 1; r < set.length; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
      [m[c], m[p]] = [m[p], m[c]];
      [v[c], v[p]] = [v[p], v[c]];
      const d = m[c][c] || 1e-12;
      for (let r = 0; r < set.length; r++) {
        if (r === c) continue;
        const f = m[r][c] / d;
        for (let k = c; k < set.length; k++) m[r][k] -= f * m[c][k];
        v[r] -= f * v[c];
      }
    }
    return v.map((value, i) => value / (m[i][i] || 1e-12));
  };
  for (let outer = 0; outer < 3 * n; outer++) {
    const w = gradient();
    let best = -1;
    for (let i = 0; i < n; i++) if (!passive[i] && w[i] > 1e-9 && (best < 0 || w[i] > w[best])) best = i;
    if (best < 0) break;
    passive[best] = true;
    for (let inner = 0; inner < 3 * n; inner++) {
      const set = passive.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
      const z = solve(set);
      if (z.every((value) => value > 0)) {
        set.forEach((i, k) => (x[i] = z[k]));
        break;
      }
      let alpha = 1;
      set.forEach((i, k) => {
        if (z[k] <= 0) alpha = Math.min(alpha, x[i] / (x[i] - z[k] || 1e-12));
      });
      set.forEach((i, k) => {
        x[i] += alpha * (z[k] - x[i]);
        if (x[i] <= 1e-12) {
          x[i] = 0;
          passive[i] = false;
        }
      });
    }
  }
  return x;
};

/**
 * Costs per operation, fitted to the observations that were timed. With
 * `strength`, each cost is pulled towards its typical value as if that many
 * extra stitches of it had been seen at exactly that cost.
 */
export const fitCosts = (observations: Observation[], prefix: Prefix, strength = 0): Costs => {
  const n = columns.length;
  const ata = Array.from({ length: n }, () => new Array(n).fill(0));
  const atb = new Array(n).fill(0);
  for (const o of observations) {
    if (o.ms === undefined) continue;
    const row = [...prefix.counts(o.from, o.to), 1];
    const y = o.ms / 1000;
    for (let i = 0; i < n; i++) {
      if (!row[i]) continue;
      atb[i] += row[i] * y;
      for (let j = 0; j < n; j++) ata[i][j] += row[i] * row[j];
    }
  }
  if (strength > 0) {
    columns.forEach((column, i) => {
      ata[i][i] += strength;
      atb[i] += strength * typical[column];
    });
  }
  const x = nnls(ata, atb);
  // An operation never seen keeps its typical cost rather than none.
  return Object.fromEntries(
    columns.map((column, i) => [column, ata[i][i] === 0 ? typical[column] : x[i]]),
  ) as Costs;
};

/* ---------------------------------------------------------- estimates */

export type Estimator = "flat" | "fitted" | "prior" | "scaled";

/**
 * One number for the knitter's pace against typical costs: how much longer
 * or shorter than typical their timed spans took. Remaining time is then the
 * typical cost of what is left, at that pace - so a crown of decreases or a
 * stretch of two-colour rounds still counts for what it is, without asking
 * a sparse record to price every operation separately.
 */
export const speedOf = (observations: Observation[], prefix: Prefix) => {
  let actual = 0;
  let expected = 0;
  for (const o of observations) {
    if (o.ms === undefined) continue;
    actual += o.ms / 1000;
    expected += predict(prefix, typical, o.from, o.to);
  }
  return expected > 0 ? actual / expected : 1;
};

/**
 * Caps each timed gap at what its stitches should take, and half as much
 * again, and two minutes: a gap longer than that had a break in it, which
 * no tap tells apart from knitting. Fitted twice, so the cap uses a pace
 * the breaks have already been taken out of.
 */
export const clamp = (observations: Observation[], prefix: Prefix): Observation[] => {
  let out = observations;
  for (let pass = 0; pass < 2; pass++) {
    const speed = speedOf(out, prefix);
    out = observations.map((o) =>
      o.ms === undefined
        ? o
        : { ...o, ms: Math.min(o.ms, 1000 * (1.5 * speed * predict(prefix, typical, o.from, o.to) + 120)) },
    );
  }
  return out;
};

/** Seconds of knitting left after `progress`, by each estimator. */
export const remaining = (
  estimator: Estimator,
  observations: Observation[],
  prefix: Prefix,
  progress: number,
  last: number,
): number => {
  if (estimator === "scaled") {
    const timed = observations.filter((o) => o.ms !== undefined);
    const perTap = timed.reduce((s, o) => s + (o.to - o.from), 0) / Math.max(timed.length, 1);
    return speedOf(observations, prefix) * predict(prefix, typical, progress, last, (last - progress) / Math.max(perTap, 1));
  }
  if (estimator === "flat") {
    const rate = flatRate(observations, prefix) ?? 3;
    return rate * (last - progress);
  }
  const costs = fitCosts(observations, prefix, estimator === "prior" ? 400 : 0);
  // As many taps again as this knitter makes per stitch.
  const timed = observations.filter((o) => o.ms !== undefined);
  const perTap = timed.reduce((s, o) => s + (o.to - o.from), 0) / Math.max(timed.length, 1);
  return predict(prefix, costs, progress, last, (last - progress) / Math.max(perTap, 1));
};

/**
 * How long each stitch took: each observation's time shared among its
 * stitches in proportion to what each should cost, or evenly.
 */
export const perStitch = (
  observations: Observation[],
  features: HatFeatures,
  prefix: Prefix,
  costs: Costs | undefined,
): Float64Array => {
  const out = new Float64Array(features.ops.length).fill(NaN);
  for (const o of observations) {
    if (o.ms === undefined) continue;
    const weights: number[] = [];
    for (let id = o.from + 1; id <= o.to; id++) {
      weights.push(costs ? predict(prefix, costs, id - 1, id, 0) : 1);
    }
    const total = weights.reduce((s, w) => s + w, 0) || 1;
    weights.forEach((w, k) => (out[o.from + 1 + k] = (o.ms! * w) / total));
  }
  return out;
};
