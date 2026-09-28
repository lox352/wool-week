/**
 * Three ways of writing down time as it is knitted, each able to say what it
 * knows afterwards in the same terms, so they can be scored side by side.
 *
 *   A. stamps   - the moment each stitch was reached (the first idea)
 *   B. log      - every change of progress, appended and never rewritten
 *   C. sessions - only when each sitting began and ended, and how far it got
 *
 * What they can say: a list of observations - these stitches, reached in
 * this long, or reached at an unknown pace - and whether each gap between
 * taps looked like knitting or like a break.
 */
import type { Action } from "./simulate";

export interface Observation {
  /** The stitches after `from` up to and including `to`. */
  from: number;
  to: number;
  /** How long they took, or undefined if the gap looked like a break. */
  ms?: number;
}

export interface Derived {
  observations: Observation[];
  /** Gaps judged to be knitting, but covering no new stitches: undoing, frogging. */
  otherMs: number;
  /** Stitch id -> the observation that last reached it. */
  bytes: number;
}

/**
 * Whether a gap between taps was knitting or a break.
 *
 * `expectedMs` is what the stitches it covers should have taken, from
 * whatever the estimator knows so far.
 */
export type PauseRule = (gapMs: number, expectedMs: number) => boolean;

export const fixedPause = (limitMs: number): PauseRule => (gap) => gap < 0 || gap > limitMs;
export const relativePause: PauseRule = (gap, expected) =>
  gap < 0 || gap > Math.max(3 * expected, expected + 5 * 60_000);

export interface Recorder {
  record(action: Action): void;
  derive(rule: PauseRule, expect: (from: number, to: number) => number): Derived;
}

/* ------------------------------------------------------------ A. stamps */

/**
 * A timestamp per stitch, the moment it was reached. Going back clears the
 * stitches after where you went back to; going forward stamps them again.
 * So what remains is only the last time through: time spent on anything
 * undone or frogged is lost, and folded into the gap before the next stamp.
 */
export class Stamps implements Recorder {
  private stamps: Float64Array;
  /**
   * What each change overwrote, so an undo can put it back - kept in memory
   * beside the site's own undo, and lost with it on a reload.
   */
  private undo: { from: number; saved: Float64Array }[] = [];
  constructor(size: number) {
    this.stamps = new Float64Array(size).fill(NaN);
  }
  record({ t, from, to, kind }: Action) {
    if (kind === "undo") {
      const last = this.undo.pop();
      if (last) this.stamps.set(last.saved, last.from + 1);
      return;
    }
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    this.undo.push({ from: low, saved: this.stamps.slice(low + 1, high + 1) });
    if (this.undo.length > 100) this.undo.shift();
    if (to > from) for (let id = from + 1; id <= to; id++) this.stamps[id] = t;
    else for (let id = to + 1; id <= from; id++) this.stamps[id] = NaN;
  }
  derive(rule: PauseRule, expect: (from: number, to: number) => number): Derived {
    const observations: Observation[] = [];
    let previousT: number | undefined;
    let start = 0;
    let id = 1;
    // Consecutive stitches stamped alike were one tap.
    while (id < this.stamps.length && !Number.isNaN(this.stamps[id])) {
      const t = this.stamps[id];
      let end = id;
      while (end + 1 < this.stamps.length && this.stamps[end + 1] === t) end++;
      const gap = previousT === undefined ? NaN : t - previousT;
      const from = start;
      observations.push({
        from,
        to: end,
        ms: Number.isNaN(gap) || rule(gap, expect(from, end)) ? undefined : gap,
      });
      previousT = t;
      start = end;
      id = end + 1;
    }
    // Stored as whole seconds since the stitch before, one per stitch.
    let last = 0;
    const deltas: number[] = [];
    for (let i = 1; i < this.stamps.length && !Number.isNaN(this.stamps[i]); i++) {
      const s = Math.round(this.stamps[i] / 1000);
      deltas.push(i === 1 ? s : s - last);
      last = s;
    }
    return { observations, otherMs: 0, bytes: JSON.stringify(deltas).length };
  }
}

/* --------------------------------------------------------------- B. log */

/**
 * Every change of progress, with when it happened and why: worked forward,
 * undone, or jumped by the chart. Nothing is rewritten, so undoing and
 * frogging keep their time, and a stitch's time is that of the last action
 * that reached it going forward.
 */
export class Log implements Recorder {
  private actions: Action[] = [];
  record(action: Action) {
    this.actions.push(action);
  }
  derive(rule: PauseRule, expect: (from: number, to: number) => number): Derived {
    const observations: Observation[] = [];
    let otherMs = 0;
    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      const gap = i === 0 ? NaN : action.t - this.actions[i - 1].t;
      if (action.kind === "undo") {
        // Putting back what was there: not knitting, whichever way it goes.
        // The stitches it restores keep the times they had.
        if (!Number.isNaN(gap) && !rule(gap, 60_000)) otherMs += gap;
      } else if (action.to > action.from) {
        const paused = Number.isNaN(gap) || rule(gap, expect(action.from, action.to));
        observations.push({ from: action.from, to: action.to, ms: paused ? undefined : gap });
      } else if (!Number.isNaN(gap) && !rule(gap, 60_000)) {
        otherMs += gap;
      }
    }
    // Stored as [seconds since the last, change in progress], and a third
    // entry for an undo: an undo forward puts back what a slip took away,
    // and must not read as hundreds of stitches knitted in a moment.
    let last = 0;
    let lastTo = 0;
    const rows: number[][] = [];
    for (const { t, to, kind } of this.actions) {
      const s = Math.round(t / 1000);
      const row = [rows.length === 0 ? s : s - last, to - lastTo];
      if (kind === "undo") row.push(1);
      rows.push(row);
      last = s;
      lastTo = to;
    }
    // Later actions over the same stitches supersede earlier ones.
    const reached = new Int32Array(Math.max(0, ...this.actions.map((a) => a.to)) + 1).fill(-1);
    observations.forEach((o, n) => {
      for (let id = o.from + 1; id <= o.to; id++) reached[id] = n;
    });
    const kept = new Set(reached);
    const live = observations.filter((_, n) => kept.has(n));
    return { observations: live, otherMs, bytes: JSON.stringify(rows).length };
  }
}

/* ---------------------------------------------------------- C. sessions */

/**
 * Only the sittings: when each began and ended, by the first and last taps
 * in it, and how far the knitting got. A new sitting starts after a gap of
 * more than `limit`. The least there is to store, and nothing finer to say.
 */
export class Sessions implements Recorder {
  private sessions: { start: number; end: number; from: number; to: number }[] = [];
  constructor(private limit = 15 * 60_000) {}
  record({ t, from, to }: Action) {
    const open = this.sessions.at(-1);
    if (!open || t - open.end > this.limit || t < open.end) {
      this.sessions.push({ start: t, end: t, from, to });
    } else {
      open.end = t;
      open.to = to;
    }
  }
  derive(_rule: PauseRule, expect: (from: number, to: number) => number): Derived {
    const observations: Observation[] = [];
    for (const s of this.sessions) {
      if (s.to <= s.from) continue;
      // The first tap of a sitting ends knitting that began before it, at
      // a pace nobody saw: credit what it should have taken.
      observations.push({ from: s.from, to: s.to, ms: s.end - s.start + firstTapCredit(s, expect) });
    }
    const flat = this.sessions.flatMap((s) => [Math.round(s.start / 1000), Math.round((s.end - s.start) / 1000), s.from, s.to]);
    return { observations, otherMs: 0, bytes: JSON.stringify(flat).length };
  }
}

/** Sessions don't know where their first tap began; a round's worth is a fair guess. */
const firstTapCredit = (s: { from: number; to: number }, expect: (from: number, to: number) => number) =>
  Math.min(expect(s.from, s.to), expect(s.from, s.from + 20));
