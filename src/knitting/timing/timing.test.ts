import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hatById } from "../../data/hats";
import { buildHat } from "../engine";
import { updateSettings } from "../../helpers/settings";
import { actionsOf, isLog, readLog, recordPageEvent, recordProgress, type Action } from "./log";
import { observe, prefixFor, predict, summarise, typical } from "./model";
import { duration, range, timeLine } from "./format";

const { stitches } = buildHat(hatById("sww25-aal-ower-toorie")!, "medium");
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.UTC(2026, 8, 20, 18, 0, 0));
});
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
  updateSettings({ noStatistics: false });
});

describe("the log", () => {
  it("writes taps, undos and the page's events as small relative rows", async () => {
    recordPageEvent("project-a", "load");
    vi.advanceTimersByTime(40_000);
    recordProgress("project-a", 0, 12);
    vi.advanceTimersByTime(30_000);
    recordProgress("project-a", 12, 20);
    vi.advanceTimersByTime(3_000);
    recordProgress("project-a", 20, 12, true);
    recordPageEvent("project-a", "hide");
    await flush();
    const rows = readLog("project-a");
    expect(rows).toEqual([[Date.UTC(2026, 8, 20, 18) / 1000, 0, 12], [40, 12], [30, 8], [3, -8, 1], [0, 0, 13]]);
    expect(isLog(rows)).toBe(true);
    expect(actionsOf(rows)).toEqual([
      { t: Date.UTC(2026, 8, 20, 18, 0, 40), from: 0, to: 12 },
      { t: Date.UTC(2026, 8, 20, 18, 1, 10), from: 12, to: 20 },
      { t: Date.UTC(2026, 8, 20, 18, 1, 13), from: 20, to: 12, undo: true },
    ]);
  });

  it("marks progress that moved while nothing recorded it, and doesn't time it", () => {
    recordProgress("project-a", 0, 10);
    vi.advanceTimersByTime(3_600_000);
    recordProgress("project-a", 500, 510);
    const actions = actionsOf(readLog("project-a"));
    expect(actions.map(({ from, to, untimed }) => [from, to, !!untimed])).toEqual([
      [0, 10, false], [10, 500, true], [500, 510, false],
    ]);
    const { observations } = observe(actions, prefixFor(stitches));
    expect(observations.map(({ from, to, ms }) => [from, to, ms])).toEqual([[0, 10, undefined], [500, 510, undefined]]);
  });

  it("records nothing once statistics are turned off", () => {
    updateSettings({ noStatistics: true });
    recordProgress("project-a", 0, 10);
    recordPageEvent("project-a", "enter");
    expect(readLog("project-a")).toEqual([]);
  });

  it("rejects rows it doesn't know", () => {
    expect(isLog([[1, 2, 3]])).toBe(false);
    expect(isLog([[1, 0, 99]])).toBe(false);
    expect(isLog([[1.5, 2]])).toBe(false);
    expect(isLog("[]")).toBe(false);
  });
});

/** A steady knitter: every run tapped, at `speed` times typical, with a night's sleep in the middle. */
const knit = (upTo: number, speed = 1, runs = 8) => {
  const prefix = prefixFor(stitches);
  const actions: Action[] = [];
  let t = Date.UTC(2026, 8, 20, 18);
  for (let from = 0; from < upTo; from += runs) {
    const to = Math.min(from + runs, upTo);
    t += predict(prefix, typical, from, to) * 1000 * speed;
    if (from === Math.floor(upTo / 2 / runs) * runs) t += 10 * 3_600_000;
    actions.push({ t, from, to });
  }
  return actions;
};

describe("the summary", () => {
  it("counts the knitting and not the night between", () => {
    const actions = knit(2000, 1.2);
    const expected = predict(prefixFor(stitches), typical, 0, 2000, actions.length) * 1.2;
    const summary = summarise(actions, stitches, 2000)!;
    expect(summary.knitted / expected).toBeGreaterThan(0.97);
    expect(summary.knitted / expected).toBeLessThan(1.03);
    expect(summary.sittings).toHaveLength(2);
    expect(summary.days).toBe(2);
  });

  it("says how long is left, and brackets what it should take", () => {
    const summary = summarise(knit(3000, 1.2), stitches, 3000)!;
    const truth = predict(prefixFor(stitches), typical, 3000, stitches.length - 1, (stitches.length - 3001) / 8) * 1.2;
    expect(summary.left!.low).toBeLessThan(truth * 1.05);
    expect(summary.left!.high).toBeGreaterThan(truth * 0.95);
  });

  it("waits for enough knitting before saying how long is left", () => {
    expect(summarise(knit(80), stitches, 80)!.left).toBeUndefined();
    expect(summarise([], stitches, 0)).toBeUndefined();
  });
});

describe("the words", () => {
  it("says durations and ranges plainly", () => {
    expect(duration(30)).toBe("under a minute");
    expect(duration(38 * 60)).toBe("38 min");
    expect(duration(5 * 3600 + 18 * 60)).toBe("5 h 18 min");
    expect(duration(2 * 3600)).toBe("2 h");
    expect(range({ low: 8 * 3600, mid: 9 * 3600, high: 10.5 * 3600 })).toBe("8–11 h");
    expect(range({ low: 30 * 60, mid: 35 * 60, high: 40 * 60 })).toBe("35 min");
    const time = { knitted: 3600 * 5.3, sittings: [], days: 1, left: { low: 8 * 3600, mid: 9 * 3600, high: 10 * 3600 } };
    expect(timeLine(time, false)).toBe("5 h 18 min knitted · about 8–10 h to go");
    expect(timeLine(time, true)).toBe("Knitted in 5 h 18 min");
  });
});
