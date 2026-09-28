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
import type { Action, PageEvent, PageKind } from "./simulate";

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

/* ------------------------------------------------- B+. log with the page */

/** Which of the page's own events the timeline listens to. */
export interface Uses {
  /** Knitting opened by its button and closed with the X. */
  exits?: boolean;
  /** The page loaded straight into knitting: a break, unless Safari did it. */
  loads?: boolean;
  /**
   * Out of sight: a break - read only while the page keeps the screen awake
   * itself, so that going out of sight can only have been done on purpose.
   */
  hidden?: boolean;
}

const pageCode: Record<PageKind, number> = { enter: 2, exit: 3, load: 4, hide: 5, show: 6 };

/**
 * The log, with the page's own comings and goings written in among the taps.
 *
 * A gap between two taps that holds an X and a later opening is split: the
 * knitting before the X (at most what the next run should take) and after
 * the opening count, and what lies between is a break for certain. That
 * only ever shortens a gap the taps alone would have counted as knitting. A load
 * can be read the same way, from when the page was last hidden. Out-of-sight
 * spans are only read as breaks while the page holds the screen awake: on a
 * phone that locks itself, being out of sight is mostly knitting.
 */
export class Timeline implements Recorder {
  private actions: Action[] = [];
  private page: PageEvent[] = [];
  constructor(
    private uses: Uses,
    /** Whether the page kept the screen awake (a wake lock) while knitting. */
    private awake = false,
  ) {}
  record(action: Action) {
    this.actions.push(action);
  }
  note(event: PageEvent) {
    this.page.push(event);
  }
  derive(rule: PauseRule, expect: (from: number, to: number) => number): Derived {
    const between: PageEvent[][] = this.actions.map(() => []);
    for (const e of this.page) if (e.seq > 0 && e.seq < this.actions.length) between[e.seq].push(e);

    // Spans out of sight, and whether this knitter's page is mostly hidden while knitting.
    const hiddenIn = (i: number) => {
      let at = this.actions[i - 1].t;
      let out = this.hiddenAfter(i - 1);
      let total = 0;
      let long = 0;
      const close = (t: number) => {
        if (out !== undefined) {
          const span = t - Math.max(out, at);
          total += Math.max(0, span);
          if (t - out > 60_000) long += Math.max(0, span);
        }
      };
      for (const e of between[i]) {
        if (e.kind === "hide") {
          if (out === undefined) out = e.t;
        } else if (e.kind === "show" || e.kind === "load" || e.kind === "enter") {
          close(e.t);
          out = undefined;
          at = e.t;
        }
      }
      close(this.actions[i].t);
      return { total, long };
    };
    const readHidden = this.uses.hidden && this.awake;

    const observations: Observation[] = [];
    let otherMs = 0;
    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      const gap = i === 0 ? NaN : action.t - this.actions[i - 1].t;
      if (action.kind === "undo" || action.to <= action.from) {
        if (!Number.isNaN(gap) && !rule(gap, 60_000)) otherMs += gap;
        continue;
      }
      const expected = expect(action.from, action.to);
      let ms: number | undefined | null = null;
      if (!Number.isNaN(gap) && gap >= 0) {
        const events = between[i];
        const previous = this.actions[i - 1].t;
        /**
         * Knitting before the break and after it, judged together. It can
         * only take time away: a gap already judged a break stays one, and
         * its stitches are credited at the usual pace, since the time after
         * opening also holds finding your place.
         */
        const split = (stopped: number, started: number) => {
          if (rule(gap, expected)) return undefined;
          const before = Math.min(Math.max(0, stopped - previous), expected);
          const after = action.t - started;
          const both = before + after;
          // Knitted first and only opened the page to tap: nothing to go on.
          if (after < 0 || both < 0.3 * expected) return undefined;
          return rule(both, expected) ? undefined : both;
        };
        const exit = this.uses.exits ? events.findIndex((e) => e.kind === "exit") : -1;
        if (exit >= 0) {
          const enter = events.findLast((e, n) => n > exit && e.kind === "enter");
          ms = enter ? split(events[exit].t, enter.t) : undefined;
        }
        if (ms === null && this.uses.loads) {
          const load = events.findLastIndex((e) => e.kind === "load");
          if (load >= 0) {
            const hid = events.findLast((e, n) => n < load && e.kind === "hide");
            ms = split(hid?.t ?? this.hiddenAfter(i - 1) ?? events[load].t, events[load].t);
          }
        }
        if (ms === null && readHidden) {
          const active = gap - hiddenIn(i).long;
          ms = rule(active, expected) ? undefined : active;
        }
        if (ms === null) ms = rule(gap, expected) ? undefined : gap;
      }
      observations.push({ from: action.from, to: action.to, ms: ms ?? undefined });
    }
    const reached = new Int32Array(Math.max(0, ...this.actions.map((a) => a.to)) + 1).fill(-1);
    observations.forEach((o, n) => {
      for (let id = o.from + 1; id <= o.to; id++) reached[id] = n;
    });
    const kept = new Set(reached);
    const live = observations.filter((_, n) => kept.has(n));
    return { observations: live, otherMs, bytes: this.bytes() };
  }

  /** When the page went out of sight, if it was out of sight just after action `i`. */
  private hiddenAfter(i: number): number | undefined {
    let out: number | undefined;
    for (const e of this.page) {
      if (e.seq > i) break;
      if (e.kind === "hide") out ??= e.t;
      else if (e.kind !== "exit") out = undefined;
    }
    return out;
  }

  /** The log's rows, with the page's events among them as [seconds, 0, code]. */
  private bytes() {
    const kinds = new Set<PageKind>([
      ...(this.uses.exits ? (["enter", "exit"] as const) : []),
      ...(this.uses.loads ? (["load", "hide"] as const) : []),
      ...(this.uses.hidden ? (["hide", "show", "load"] as const) : []),
    ]);
    const rows: number[][] = [];
    let last = 0;
    let lastTo = 0;
    let p = 0;
    const push = (t: number, row: number[]) => {
      const s = Math.round(t / 1000);
      rows.push([rows.length === 0 ? s : s - last, ...row]);
      last = s;
    };
    this.actions.forEach((a, i) => {
      for (; p < this.page.length && this.page[p].seq <= i; p++) {
        const e = this.page[p];
        if (kinds.has(e.kind)) push(e.t, [0, pageCode[e.kind]]);
      }
      push(a.t, a.kind === "undo" ? [a.to - lastTo, 1] : [a.to - lastTo]);
      lastTo = a.to;
    });
    return JSON.stringify(rows).length;
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
