/**
 * A simulated knitter, so every way of recording and estimating time can be
 * scored against a truth nobody could otherwise know.
 *
 * It works a real hat stitch by stitch at a cost per operation, taps the
 * site the way people do - after each run, only at the end of each round, or
 * catching up with the chart picker after knitting a while without it -
 * puts the knitting down, comes back the next day, and makes the mistakes
 * the site has to survive: a run tapped twice and undone, a jump to the
 * wrong stitch, a round frogged and knitted again, the phone's clock moving.
 */
import { HatFeatures, Operation, priced } from "./features";
import { endOfRound, currentRun, indexRounds, RoundIndex } from "../../knitting/progress";
import { isStep } from "../../types/Stitch";

/** Seconds per operation for a typical knitter. See the report for sources. */
export const defaultCosts: Record<Operation, number> = {
  castOn: 5.5,
  knit: 2.2,
  purl: 2.9,
  tbl: 2.8,
  decrease: 3.8,
  doubleDecrease: 5.0,
  makeOne: 6.0,
  kfb: 5.0,
  colourChange: 2.5,
  knitPurlSwitch: 1.2,
  stranded: 0.6,
  join: 45,
  turn: 60,
  needles: 40,
};
/** Seconds between finishing an action and tapping for it. */
export const defaultTap = 1.5;

export type Style = "runs" | "rounds" | "mixed" | "catchup";

export interface Scenario {
  name: string;
  style: Style;
  /** Taps twice and undoes, jumps wrongly and undoes, frogs rounds. */
  messy?: boolean;
  /** The phone's clock goes back an hour partway through. */
  clockJump?: boolean;
}

export type ActionKind = "work" | "undo" | "jump";
export interface Action {
  /** When, as the device's clock says, in ms since the epoch. */
  t: number;
  from: number;
  to: number;
  kind: ActionKind;
}

export interface Knitter {
  /** This knitter's own seconds per operation. */
  costs: Record<Operation, number>;
  tap: number;
}

export interface Simulation {
  knitter: Knitter;
  actions: Action[];
  truth: {
    /** Time spent knitting (and tapping), pauses excluded, frogged work included. */
    activeMs: number;
    /** Time the stitch took, the last time it was knitted. */
    perStitchMs: Float64Array;
    /** Active time so far at each action. */
    activeAt: number[];
  };
}

/** A small seeded generator, so a scenario comes out the same every run. */
export const random = (seed: number) => {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => Math.sqrt(-2 * Math.log(next() || 1e-12)) * Math.cos(2 * Math.PI * next());
  /** Mean-one multiplicative noise. */
  const lognormal = (sd: number) => Math.exp(sd * normal() - (sd * sd) / 2);
  return { next, normal, lognormal };
};

export const knitterFor = (seed: number): Knitter => {
  const r = random(seed * 7919 + 1);
  const speed = r.lognormal(0.25);
  const costs = Object.fromEntries(
    Object.entries(defaultCosts).map(([op, cost]) => [op, cost * speed * r.lognormal(0.2)]),
  ) as Record<Operation, number>;
  return { costs, tap: defaultTap * r.lognormal(0.3) };
};

export const simulate = (
  features: HatFeatures,
  scenario: Scenario,
  seed: number,
  knitter = knitterFor(seed),
): Simulation => {
  const r = random(seed);
  const { stitches, rounds, labels } = features;
  const index: RoundIndex = indexRounds(rounds, labels);
  const last = stitches.length - 1;
  const perStitchMs = new Float64Array(stitches.length);
  const actions: Action[] = [];
  const activeAt: number[] = [];

  let clock = Date.UTC(2026, 8, 20, 18, 0, 0);
  let skew = 0;
  let active = 0;
  let sessionLeft = 60 * 60 * 1000 * r.lognormal(0.4);
  /** Where the knitting is, and where the site has been told it is. */
  let progress = 0;
  let site = 0;
  let catchingUp = 0;
  let mixedRound = -1;
  let activeAtLastTap = 0;
  let mixedByRun = true;
  const clockJumpAt = scenario.clockJump ? Math.floor(last * (0.3 + 0.4 * r.next())) : -1;

  // Warm-up: the first rounds of a new chart go slower while it is learned.
  const warmth = (id: number) => {
    const round = features.roundOf.get(id);
    if (round === undefined) return 1;
    const label = labels[round - 1]?.replace(/, row \d+$/, "").replace(/ · .*$/, "");
    let since = 0;
    for (let back = round - 1; back >= 1 && since < 3; back--) {
      const earlier = labels[back - 1]?.replace(/, row \d+$/, "").replace(/ · .*$/, "");
      if (earlier !== label) break;
      since++;
    }
    return since >= 3 ? 1 : 1 + 0.3 * (1 - since / 3);
  };

  const spend = (ms: number) => {
    clock += ms;
    active += ms;
    sessionLeft -= ms;
  };
  const pause = (ms: number) => {
    clock += ms;
  };
  const record = (to: number, kind: ActionKind) => {
    if (clockJumpAt >= 0 && skew === 0 && to >= clockJumpAt) skew = -60 * 60 * 1000;
    actions.push({ t: clock + skew, from: site, to, kind });
    activeAt.push(active);
    site = to;
  };

  /** Knit the stitches after `progress` up to `to`, in real time. */
  const knit = (to: number) => {
    for (let id = progress + 1; id <= to; id++) {
      const ms = 1000 * priced(features.ops[id], knitter.costs) * warmth(id) * r.lognormal(0.35);
      spend(ms);
      perStitchMs[id] = ms;
      // Put down for a moment mid-run, now and then.
      if (r.next() < 1 / 900) pause(60_000 * (1 + 7 * r.next()));
    }
    progress = to;
  };

  const nextStop = (): number => {
    const next = stitches[progress + 1];
    if (next && isStep(next)) return progress + 1;
    const run = currentRun(stitches, progress, index);
    const roundEnd = endOfRound(progress, index) ?? progress + 1;
    const byRun = run?.endId ?? progress + 1;
    switch (scenario.style) {
      case "runs": return byRun;
      case "rounds": return roundEnd;
      case "mixed": {
        // Chosen round by round: some rounds tapped run by run, others at the end.
        const round = features.roundOf.get(progress + 1) ?? 0;
        if (round !== mixedRound) {
          mixedRound = round;
          mixedByRun = r.next() < 0.6;
        }
        return mixedByRun ? byRun : roundEnd;
      }
      case "catchup": return byRun;
    }
  };

  while (progress < last) {
    // A new session, after a night's sleep.
    if (sessionLeft <= 0) {
      pause(60 * 60 * 1000 * (6 + 14 * r.next()));
      sessionLeft = 60 * 60 * 1000 * r.lognormal(0.4);
    }
    const to = Math.min(nextStop(), last);
    knit(to);

    // Knitting on without the phone, then catching up by the picker.
    if (scenario.style === "catchup" && catchingUp === 0 && r.next() < 0.004) {
      catchingUp = 1 + Math.floor(r.next() * 40);
    }
    if (catchingUp > 0) {
      catchingUp--;
      if (catchingUp === 0 || to === last) {
        spend(knitter.tap * 3000);
        record(to, "jump");
      }
      continue;
    }

    spend(knitter.tap * 1000 * r.lognormal(0.3));
    record(to, "work");

    if (scenario.messy) {
      // Tapped twice: the next run marked done too, then undone.
      if (r.next() < 0.03 && progress < last) {
        const next = currentRun(stitches, progress, index)?.endId ?? progress + 1;
        spend(600);
        record(Math.min(next, last), "work");
        spend(2500);
        record(to, "undo");
      }
      // A tap on the wrong stitch of the chart, then undone.
      if (r.next() < 0.004) {
        const wrong = Math.max(1, Math.min(last, progress + Math.round((r.next() - 0.5) * 400)));
        spend(3000);
        record(wrong, "jump");
        spend(4000);
        record(to, "undo");
      }
      // A mistake found at the end of a round: frogged, and knitted again.
      const round = features.roundOf.get(progress);
      const ids = round ? rounds[round - 1] : undefined;
      if (ids && ids.at(-1) === progress && r.next() < 0.01) {
        spend(60_000 * (1 + 3 * r.next()));
        progress = ids[0] - 1;
        record(progress, "jump");
      }
    }

    // A short break between actions - the kettle, the door - about one in
    // every three quarters of an hour of knitting.
    if (r.next() < 1 - Math.exp(-(active - activeAtLastTap) / (45 * 60_000))) {
      pause(60_000 * (2 + 10 * r.next()));
    }
    activeAtLastTap = active;
  }

  return { knitter, actions, truth: { activeMs: active, perStitchMs, activeAt } };
};
