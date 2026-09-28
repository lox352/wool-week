/**
 * Simulated timings for a project, for the presentation prototypes only.
 *
 * Switched on by `timeExplore` in the address: `?timeExplore=1` for the
 * figures, `=cells` or `=rounds` for the two heat maps, `=finish` for the
 * report a finished hat gets. Nothing is stored: a knitter is simulated for
 * the whole hat, and what the site would have recorded up to the project's
 * progress is taken from it, through the recorder and estimators the
 * findings recommend (the log, a relative pause rule with the clamp, the
 * flat rate early and the fitted costs late).
 */
import { HatPattern } from "../../data/hats/types";
import { HatFeatures, featuresOf } from "./features";
import { simulate } from "./simulate";
import { Log, relativePause } from "./record";
import { Costs, Prefix, clamp, fitCosts, perStitch, predict, remaining, typical, windowed, workingOrder } from "./estimate";
import { activeMs } from "./score";

export const exploreMode = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const query = window.location.hash.split("?")[1] ?? window.location.search.slice(1);
  return new URLSearchParams(query).get("timeExplore") ?? undefined;
};

/** Which simulated knitter the demo shows: `?knitter=run` for one who taps every run. */
const knitterStyle = (): "mixed" | "runs" => {
  if (typeof window === "undefined") return "mixed";
  const query = window.location.hash.split("?")[1] ?? window.location.search.slice(1);
  return new URLSearchParams(query).get("knitter") === "run" ? "runs" : "mixed";
};

export interface Session {
  start: number;
  end: number;
  stitches: number;
}

export interface DemoTiming {
  progress: number;
  last: number;
  activeMs: number;
  /** Seconds left: likely, and the range the findings support at this point. */
  remaining: { low: number; mid: number; high: number };
  sessions: Session[];
  /** Seconds per stitch, estimated; NaN where not reached. */
  perStitch: Float64Array;
  /** The simulated knitter's true seconds per stitch, for comparison. */
  truth: Float64Array;
  /** How many stitches the tap each stitch came in covered. */
  tapSpan: Float64Array;
  /** A running average of `values` over `size` stitches in knitting order. */
  window: (values: Float64Array, size: number) => Float64Array;
  /** Seconds per round, and what it should have taken at this pace. */
  perRound: { actual: number; expected: number }[];
  costs: Costs;
  /** When each stitch was reached, ms since the epoch. */
  reachedAt: Float64Array;
  /** The observation each stitch was reached in. */
  spanOf: Int32Array;
  spans: { from: number; to: number; ms?: number }[];
  /** Seconds the rest of the round in hand should take. */
  roundLeft: number;
  /** How many of each operation were in spans with a time: what the costs rest on. */
  seen: Partial<Record<string, number>>;
  /** The session in hand, if the knitter is in one, in ms. */
  sessionMs: number;
  features: HatFeatures;
}

const features = new Map<string, HatFeatures>();
const cache = new Map<string, DemoTiming>();

/** How far out the estimate of time left tends to be, from the findings. */
const spread = (fraction: number) => (fraction < 0.2 ? 0.15 : fraction < 0.4 ? 0.1 : fraction < 0.7 ? 0.07 : 0.05);

export const demoTiming = (hat: HatPattern, sizeId: string, progress: number): DemoTiming => {
  const key = `${hat.id}:${sizeId}:${hat.lettering?.text ?? ""}`;
  let f = features.get(key);
  if (!f) {
    f = featuresOf(hat, sizeId);
    features.set(key, f);
  }
  const style = knitterStyle();
  const memo = `${key}:${progress}:${style}`;
  const known = cache.get(memo);
  if (known) return known;

  const last = f.ops.length - 1;
  const seed = [...hat.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const sim = simulate(f, { name: "demo", style, messy: true }, seed);
  const upTo = sim.actions.findIndex((a) => a.to > progress);
  const seen = upTo < 0 ? sim.actions : sim.actions.slice(0, upTo);
  const prefix = new Prefix(f);
  const log = new Log();
  seen.forEach((a) => log.record(a));
  const derived = log.derive(relativePause, (from, to) => predict(prefix, typical, from, to) * 1000);
  const observations = clamp(derived.observations, prefix);
  const costs = fitCosts(observations, prefix, 400);
  const fraction = progress / last;

  // Flat early, the fitted costs late, as the findings found best.
  const flat = remaining("flat", observations, prefix, progress, last);
  const fitted = remaining("prior", observations, prefix, progress, last);
  const w = Math.min(1, Math.max(0, (fraction - 0.25) / 0.5));
  const mid = (1 - w) * flat + w * fitted;
  const e = spread(fraction);

  const sessions: Session[] = [];
  for (const a of seen) {
    const open = sessions.at(-1);
    if (!open || a.t - open.end > 30 * 60_000) sessions.push({ start: a.t, end: a.t, stitches: Math.max(0, a.to - a.from) });
    else {
      open.end = a.t;
      if (a.kind === "work" || a.kind === "jump") open.stitches += Math.max(0, a.to - a.from);
    }
  }

  const per = perStitch(observations, f, prefix, costs);
  const secs = Float64Array.from(per, (ms) => ms / 1000);
  const speed = costs.knit / typical.knit;
  const perRound = f.rounds.map((ids) => {
    let actual = 0;
    for (const id of ids) actual += Number.isNaN(secs[id]) ? 0 : secs[id];
    const expected = predict(prefix, costs, ids[0] - 1, ids.at(-1)!, 0);
    return { actual, expected };
  });

  const reachedAt = new Float64Array(f.ops.length).fill(NaN);
  const spanOf = new Int32Array(f.ops.length).fill(-1);
  observations.forEach((o, n) => {
    for (let id = o.from + 1; id <= o.to; id++) spanOf[id] = n;
  });
  for (const a of seen) {
    if (a.kind === "undo") continue;
    for (let id = a.from + 1; id <= a.to; id++) reachedAt[id] = a.t;
  }

  const round = f.roundOf.get(progress + 1);
  const roundEnd = round ? f.rounds[round - 1].at(-1)! : progress;
  const roundLeft = predict(prefix, costs, progress, roundEnd, 1);
  const now = seen.at(-1)?.t ?? 0;
  const current = sessions.at(-1);
  void speed;

  const seenCounts: Record<string, number> = { tap: 0 };
  for (const o of observations) {
    if (o.ms === undefined) continue;
    seenCounts.tap++;
    prefix.counts(o.from, o.to).forEach((n, i) => {
      const op = Object.keys(typical)[i];
      seenCounts[op] = (seenCounts[op] ?? 0) + n;
    });
  }

  const truth = Float64Array.from(sim.truth.perStitchMs, (ms, id) => (id <= progress && ms > 0 ? ms / 1000 : NaN));
  const tapSpan = new Float64Array(f.ops.length).fill(NaN);
  for (const o of observations) for (let id = o.from + 1; id <= o.to; id++) tapSpan[id] = o.to - o.from;
  const order = workingOrder(f);

  const timing: DemoTiming = {
    truth,
    tapSpan,
    window: (values, size) => windowed(values, order, size),
    seen: seenCounts,
    progress,
    last,
    activeMs: activeMs(observations, derived.otherMs, prefix, costs),
    remaining: { low: mid * (1 - e), mid, high: mid * (1 + e) },
    sessions,
    perStitch: secs,
    perRound,
    costs,
    reachedAt,
    spanOf,
    spans: observations,
    roundLeft,
    sessionMs: current ? now - current.start : 0,
    features: f,
  };
  cache.set(memo, timing);
  return timing;
};

/** "12 h 40 min", "38 min", "45 s". */
export const duration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return "–";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

/** "about 9 h", "8–11 h": time left, as a range where it is wide enough to matter. */
export const range = ({ low, high }: { low: number; high: number }): string => {
  const lo = Math.round(low / 3600);
  const hi = Math.round(high / 3600);
  if (hi >= 2 && lo !== hi) return `${lo}–${hi} h`;
  return duration((low + high) / 2);
};
