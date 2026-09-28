/**
 * Scores every way of recording against every way of estimating, on
 * simulated knitters whose true times are known.
 */
import { HatFeatures, operations } from "./features";
import { Action, Scenario, Simulation, simulate } from "./simulate";
import { Log, Observation, PauseRule, Recorder, Sessions, Stamps, fixedPause, relativePause } from "./record";
import { Costs, Estimator, Prefix, clamp, columns, fitCosts, perStitch, predict, remaining, typical, windowed, workingOrder } from "./estimate";

export const recorders = {
  stamps: (size: number) => new Stamps(size),
  log: () => new Log(),
  sessions: () => new Sessions(),
} satisfies Record<string, (size: number) => Recorder>;
export type RecorderName = keyof typeof recorders;

export const rules: Record<string, PauseRule> = {
  "fixed 10 min": fixedPause(10 * 60_000),
  relative: relativePause,
};

const replay = (name: RecorderName, actions: Action[], size: number) => {
  const recorder = recorders[name](size);
  actions.forEach((a) => recorder.record(a));
  return recorder;
};

/** Active time the recorder would report: timed gaps, plus the untimed at a fitted pace. */
export const activeMs = (observations: Observation[], otherMs: number, prefix: Prefix, costs: Costs) =>
  observations.reduce(
    (sum, o) => sum + (o.ms ?? predict(prefix, costs, o.from, o.to) * 1000),
    otherMs,
  );

const pearson = (a: number[], b: number[]) => {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db || 1);
};

export interface Run {
  hat: string;
  scenario: string;
  seed: number;
  truthActiveH: number;
  actions: number;
  bytes: Record<RecorderName, number>;
  /** Relative error in total active time, by recorder and pause rule. */
  activeError: Record<string, number>;
  /** Relative error in time remaining at each checkpoint, by recorder / estimator. */
  eta: Record<string, Record<string, number>>;
  /** Fitted cost / true cost, per operation, from the log with the prior. */
  costRatio: Record<string, number>;
  /** How well each stitch's time is recovered: correlation with the truth. */
  heat: Record<string, { stitch: number; round: number }>;
  /**
   * Running averages over n stitches: correlation with each stitch's true
   * time, and with the true running average over the same window; and the
   * share of stitches that came in a single tap longer than the window.
   */
  windows: Record<string, { raw: number; smoothed: number; coarse: number }>;
}

export const checkpoints = [0.1, 0.25, 0.5, 0.75];

export const scoreRun = (features: HatFeatures, hat: string, scenario: Scenario, seed: number): Run => {
  const sim: Simulation = simulate(features, scenario, seed);
  const size = features.ops.length;
  const last = size - 1;
  const prefix = new Prefix(features);
  const expectTypical = (from: number, to: number) => predict(prefix, typical, from, to) * 1000;

  const bytes = {} as Record<RecorderName, number>;
  const activeError: Record<string, number> = {};
  for (const name of Object.keys(recorders) as RecorderName[]) {
    const recorder = replay(name, sim.actions, size);
    for (const [ruleName, rule] of Object.entries(rules)) {
      const derived = recorder.derive(rule, expectTypical);
      bytes[name] = derived.bytes;
      const costs = fitCosts(derived.observations, prefix, 400);
      const est = activeMs(derived.observations, derived.otherMs, prefix, costs);
      activeError[`${name} · ${ruleName}`] = (est - sim.truth.activeMs) / sim.truth.activeMs;
      if (ruleName === "relative") {
        const clamped = clamp(derived.observations, prefix);
        const c = fitCosts(clamped, prefix, 400);
        const e = activeMs(clamped, derived.otherMs, prefix, c);
        activeError[`${name} · relative, clamped`] = (e - sim.truth.activeMs) / sim.truth.activeMs;
      }
    }
  }

  const eta: Record<string, Record<string, number>> = {};
  for (const f of checkpoints) {
    const i = sim.actions.findIndex((a) => a.to >= f * last);
    if (i < 0) continue;
    const seen = sim.actions.slice(0, i + 1);
    const progress = seen[i].to;
    const truthLeft = (sim.truth.activeMs - sim.truth.activeAt[i]) / 1000;
    for (const name of Object.keys(recorders) as RecorderName[]) {
      const derived = replay(name, seen, size).derive(relativePause, expectTypical);
      for (const estimator of ["flat", "fitted", "prior", "scaled"] as Estimator[]) {
        const est = remaining(estimator, derived.observations, prefix, progress, last);
        (eta[`${name} · ${estimator}`] ??= {})[String(f)] = (est - truthLeft) / truthLeft;
      }
      const clamped = clamp(derived.observations, prefix);
      for (const estimator of ["flat", "prior", "scaled"] as Estimator[]) {
        const est = remaining(estimator, clamped, prefix, progress, last);
        (eta[`${name} · ${estimator}, clamped`] ??= {})[String(f)] = (est - truthLeft) / truthLeft;
      }
    }
  }

  // Operation costs, from everything the log knows at the end.
  const logged = replay("log", sim.actions, size).derive(relativePause, expectTypical);
  const fitted = fitCosts(clamp(logged.observations, prefix), prefix, 400);
  const unclamped = fitCosts(logged.observations, prefix, 400);
  const costRatio: Record<string, number> = {};
  for (const op of columns) {
    const truth = op === "tap" ? sim.knitter.tap : sim.knitter.costs[op as (typeof operations)[number]];
    costRatio[op] = fitted[op] / truth;
    costRatio[`${op} (unclamped)`] = unclamped[op] / truth;
  }

  // The heat map: each stitch's time, and each round's, against the truth.
  const heat: Record<string, { stitch: number; round: number }> = {};
  const truthStitch = Array.from(sim.truth.perStitchMs);
  for (const name of ["log", "stamps"] as RecorderName[]) {
    const derived = replay(name, sim.actions, size).derive(relativePause, expectTypical);
    const clamped = clamp(derived.observations, prefix);
    const costs = fitCosts(clamped, prefix, 400);
    for (const [how, c] of [["by cost", costs], ["evenly", undefined]] as const) {
      const est = perStitch(clamped, features, prefix, c);
      const ids = features.stitches.map((s) => s.id).filter((id) => id > 0 && !Number.isNaN(est[id]) && truthStitch[id] > 0);
      const byRound = (values: ArrayLike<number>) =>
        features.rounds.map((round) => round.reduce((s, id) => s + (Number.isNaN(values[id]) ? 0 : values[id]), 0));
      heat[`${name} · ${how}`] = {
        stitch: pearson(ids.map((id) => est[id]), ids.map((id) => truthStitch[id])),
        round: pearson(byRound(est), byRound(truthStitch)),
      };
    }
  }

  const windows: Record<string, { raw: number; smoothed: number; coarse: number }> = {};
  {
    const derived = replay("log", sim.actions, size).derive(relativePause, expectTypical);
    const clamped = clamp(derived.observations, prefix);
    const costs = fitCosts(clamped, prefix, 400);
    const est = perStitch(clamped, features, prefix, costs);
    const order = workingOrder(features);
    const span = new Float64Array(size).fill(Infinity);
    for (const o of clamped) if (o.ms !== undefined) for (let id = o.from + 1; id <= o.to; id++) span[id] = o.to - o.from;
    const ids = order.filter((id) => Number.isFinite(est[id]) && truthStitch[id] > 0);
    const r = (a: ArrayLike<number>, b: ArrayLike<number>) => pearson(ids.map((id) => a[id]), ids.map((id) => b[id]));
    windows["1 (no window)"] = { raw: r(est, truthStitch), smoothed: r(est, truthStitch), coarse: 0 };
    for (const n of [10, 30, 60]) {
      for (const centred of [false, true]) {
        const smooth = windowed(est, order, n, centred);
        const truth = windowed(truthStitch, order, n, centred);
        windows[`${n} ${centred ? "centred" : "trailing"}`] = {
          raw: r(smooth, truthStitch),
          smoothed: r(smooth, truth),
          coarse: ids.filter((id) => span[id] > n).length / ids.length,
        };
      }
    }
  }

  return {
    windows,
    hat,
    scenario: scenario.name,
    seed,
    truthActiveH: sim.truth.activeMs / 3.6e6,
    actions: sim.actions.length,
    bytes,
    activeError,
    eta,
    costRatio,
    heat,
  };
};

export const scenarios: Scenario[] = [
  { name: "run by run", style: "runs" },
  { name: "end of round only", style: "rounds" },
  { name: "mixed", style: "mixed" },
  { name: "catching up by the picker", style: "catchup" },
  { name: "run by run, messy", style: "runs", messy: true },
  { name: "mixed, messy, clock jump", style: "mixed", messy: true, clockJump: true },
];

export { simulate };
