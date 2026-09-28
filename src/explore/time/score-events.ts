/**
 * What the page's own events add: every way of reading the timeline, on
 * knitters with different habits with the X and with their phone's screen.
 */
import { HatFeatures } from "./features";
import { ExitHabit, Scenario, Screen, Style, simulate } from "./simulate";
import { Log, Recorder, Timeline, Uses, relativePause } from "./record";
import { Prefix, clamp, fitCosts, perStitch, predict, remaining, typical, windowed, workingOrder } from "./estimate";
import { activeMs, checkpoints } from "./score";

export const readings: Record<string, Uses | undefined> = {
  "taps only": undefined,
  "+ X and opening": { exits: true },
  "+ X, opening and loads": { exits: true, loads: true },
  "+ X, opening and out of sight (screen kept awake)": { exits: true, hidden: true },
  "+ everything": { exits: true, loads: true, hidden: true },
};

export interface EventRun {
  hat: string;
  style: Style;
  exits: ExitHabit;
  screen: Screen;
  seed: number;
  events: Record<string, number>;
  /** By reading: error in total time, in time left at each checkpoint, heat per round and per 30. */
  scores: Record<string, { active: number; eta: Record<string, number>; round: number; window: number; bytes: number }>;
}

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

export const scoreEvents = (features: HatFeatures, hat: string, scenario: Scenario, seed: number): EventRun => {
  const sim = simulate(features, scenario, seed);
  const last = features.ops.length - 1;
  const prefix = new Prefix(features);
  const expect = (from: number, to: number) => predict(prefix, typical, from, to) * 1000;
  const replay = (uses: Uses | undefined, upTo = sim.actions.length) => {
    const recorder: Recorder & { note?: Timeline["note"] } = uses ? new Timeline(uses, scenario.screen === "on") : new Log();
    sim.actions.slice(0, upTo).forEach((a) => recorder.record(a));
    if (recorder instanceof Timeline) sim.page.filter((e) => e.seq < upTo).forEach((e) => recorder.note(e));
    return recorder.derive(relativePause, expect);
  };
  const truth = Array.from(sim.truth.perStitchMs);
  const order = workingOrder(features);
  const truth30 = windowed(truth, order, 30, true);
  const byRound = (values: ArrayLike<number>) =>
    features.rounds.map((round) => round.reduce((s, id) => s + (Number.isNaN(values[id]) ? 0 : values[id]), 0));

  const scores: EventRun["scores"] = {};
  for (const [name, uses] of Object.entries(readings)) {
    const derived = replay(uses);
    const clamped = clamp(derived.observations, prefix);
    const costs = fitCosts(clamped, prefix, 400);
    const active = (activeMs(clamped, derived.otherMs, prefix, costs) - sim.truth.activeMs) / sim.truth.activeMs;
    const eta: Record<string, number> = {};
    for (const f of checkpoints) {
      const i = sim.actions.findIndex((a) => a.to >= f * last);
      if (i < 0) continue;
      const seen = clamp(replay(uses, i + 1).observations, prefix);
      const left = (sim.truth.activeMs - sim.truth.activeAt[i]) / 1000;
      const w = Math.min(1, Math.max(0, (f - 0.25) / 0.5));
      const est = (1 - w) * remaining("flat", seen, prefix, sim.actions[i].to, last) + w * remaining("prior", seen, prefix, sim.actions[i].to, last);
      eta[String(f)] = (est - left) / left;
    }
    const est = perStitch(clamped, features, prefix, costs);
    const ids = order.filter((id) => Number.isFinite(est[id]) && truth[id] > 0);
    const est30 = windowed(est, order, 30, true);
    scores[name] = {
      active,
      eta,
      round: pearson(byRound(est), byRound(truth)),
      window: pearson(ids.map((id) => est30[id]), ids.map((id) => truth30[id])),
      bytes: derived.bytes,
    };
  }
  const events: Record<string, number> = { taps: sim.actions.length };
  for (const e of sim.page) events[e.kind] = (events[e.kind] ?? 0) + 1;
  return {
    hat,
    style: scenario.style,
    exits: scenario.exits ?? "never",
    screen: scenario.screen ?? "locks",
    seed,
    events,
    scores,
  };
};
