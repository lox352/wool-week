/**
 * The presentation prototypes: small pieces dropped into the site's own
 * pages when `timeExplore` is in the address. See demo.ts.
 */
import React from "react";
import { ChartLayout } from "../../knitting/layout";
import { cellAt } from "../../knitting/draw-chart";
import { DemoTiming, duration, range } from "./demo";
import { columns, typical } from "./estimate";
import "./ui.css";

/** The project the page is showing, set by its page, read by the pieces inside it. */
let current: DemoTiming | undefined;
export const setCurrentDemo = (timing: DemoTiming | undefined) => {
  current = timing;
};
export const currentDemo = () => current;

const day = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const clock = (ms: number) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/* ------------------------------------------------------------ home card */

export const HomeTime: React.FC<{ timing: DemoTiming }> = ({ timing }) => (
  <span className="quiet explore-time">
    {duration(timing.activeMs / 1000)} knitted
    {timing.progress < timing.last && <> · about {range(timing.remaining)} to go</>}
  </span>
);

/* ------------------------------------------------------ project figures */

export const TimeFigures: React.FC<{ timing: DemoTiming }> = ({ timing }) => {
  const days = new Set(timing.sessions.map((s) => new Date(s.start).toDateString())).size;
  const perDay = timing.activeMs / 1000 / Math.max(days, 1);
  const finishDays = Math.ceil(timing.remaining.mid / Math.max(perDay, 1));
  const done = timing.progress >= timing.last;
  const perMinute = (timing.progress / (timing.activeMs / 60000)).toFixed(0);
  return (
    <dl className="measurements explore-figures">
      <div>
        <dt>Time knitted</dt>
        <dd>{duration(timing.activeMs / 1000)}</dd>
      </div>
      <div>
        <dt>Sittings</dt>
        <dd>
          {timing.sessions.length} over {days} {days === 1 ? "day" : "days"}
        </dd>
      </div>
      <div>
        <dt>Pace</dt>
        <dd>about {perMinute} stitches a minute</dd>
      </div>
      {!done && (
        <div>
          <dt>Time to go</dt>
          <dd>
            {range(timing.remaining)}
            <span className="quiet"> · done in about {finishDays} days at your usual {duration(perDay)} a day</span>
          </dd>
        </div>
      )}
    </dl>
  );
};

/* -------------------------------------------------------- knitting panel */

export const PanelTime: React.FC<{ timing: DemoTiming }> = ({ timing }) => (
  <p className="quiet explore-panel">
    This sitting {duration(timing.sessionMs / 1000)} · this round ≈ {duration(timing.roundLeft)} more
  </p>
);

/* -------------------------------------------------------- stitch picker */

export const PickerTime: React.FC<{ timing: DemoTiming; id: number }> = ({ timing, id }) => {
  const at = timing.reachedAt[id];
  const span = timing.spans[timing.spanOf[id]];
  if (Number.isNaN(at)) return <span className="stitch-picker-needles">Not reached yet</span>;
  return (
    <span className="stitch-picker-needles">
      Reached {day(at)}, {clock(at)}
      {span?.ms !== undefined && ` · ${span.to - span.from} ${span.to - span.from === 1 ? "stitch" : "stitches"} in ${duration(span.ms / 1000)}`}
    </span>
  );
};

/* ------------------------------------------------------------- heat maps */

// Diverging: blue for faster than expected, red for slower, grey for as expected.
const diverging = ["#256abf", "#6da7ec", "#b7d3f6", "#f0efec", "#f3b7b6", "#e66767", "#c53d3c"];

const median = (values: number[]) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 1;
};
const step = (value: number, cuts: number[]) => cuts.filter((c) => value > c).length;

/**
 * Each stitch's cell painted by how long it took, over the chart.
 *
 * `mode` picks what is painted: `cells`, each stitch's own estimate;
 * `window30` (or any size), a running average over that many stitches;
 * `truth` and `truth30`, the simulated knitter's real times, for comparison.
 * All use one scale, against the knitter's usual pace (the median of its
 * own 30-stitch running average): blue quicker, red slower, grey as usual. With a window, stitches that came in a tap
 * longer than it are faded: their average is mostly that one tap's.
 */
export const HeatCells: React.FC<{ timing: DemoTiming; layout: ChartLayout; cell: number; mode: string }> = ({
  timing,
  layout,
  cell,
  mode,
}) => {
  const match = /^(cells|window|truth)(\d*)$/.exec(mode);
  const kind = match?.[1] ?? "cells";
  const size = Number(match?.[2] || 0);
  const base = kind === "truth" ? timing.truth : timing.perStitch;
  const values = size > 1 ? timing.window(base, size) : base;
  // Against the knitter's own usual pace, so a 5% wobble isn't painted as a 7-step swing.
  // The truth leaves out short pauses the estimate can't see, so each is scaled by its own usual.
  const usual = median(Array.from(timing.window(base, 30)));
  const cuts = [0.75, 0.87, 0.95, 1.05, 1.15, 1.33].map((k) => k * usual);
  const rects: React.ReactNode[] = [];
  layout.cells.forEach((at, id) => {
    const s = values[id];
    if (!Number.isFinite(s)) return;
    const { x, y } = cellAt(layout, at.round, at.column, cell);
    const faded = kind === "window" && size > 1 && timing.tapSpan[id] > size;
    rects.push(
      <rect key={id} x={x} y={y} width={cell} height={cell} fill={diverging[step(s, cuts)]} opacity={faded ? 0.35 : 1}>
        <title>{`${s.toFixed(1)} s a stitch, ${Math.round((s / usual - 1) * 100)}% against your usual`}</title>
      </rect>,
    );
  });
  return <g className="explore-heat-cells">{rects}</g>;
};

/** A bar per round in the margin: slower than expected red, faster blue. */
export const HeatRounds: React.FC<{ timing: DemoTiming; layout: ChartLayout; cell: number }> = ({ timing, layout, cell }) => {
  const x0 = layout.columns * cell + cell * 1.5;
  return (
    <g className="explore-heat-rounds">
      {timing.perRound.map(({ actual, expected }, i) => {
        if (actual <= 0 || expected <= 0) return null;
        const ratio = Math.log2(actual / expected);
        const k = Math.max(0, Math.min(6, Math.round(3 + ratio * 6)));
        const { y } = cellAt(layout, i + 1, 1, cell);
        return (
          <rect key={i} x={x0} y={y + 1} width={cell * 0.6} height={cell - 2} rx={2} fill={diverging[k]}>
            <title>{`Round ${i + 1}: ${duration(actual)}, ${Math.round((actual / expected - 1) * 100)}% against your pace`}</title>
          </rect>
        );
      })}
    </g>
  );
};

/* --------------------------------------------------------- finish report */

const opLabel: Record<string, string> = {
  castOn: "Cast on a stitch",
  knit: "Knit",
  purl: "Purl",
  tbl: "Knit through the back loop",
  decrease: "Decrease",
  doubleDecrease: "Double decrease",
  makeOne: "Make one",
  kfb: "Knit front and back",
  colourChange: "Change colour",
  knitPurlSwitch: "Switch between knit and purl",
  stranded: "Carry a second yarn",
  join: "Join in the round",
  turn: "Turn the work",
  needles: "Change needles",
  tap: "Tap the phone",
};

export const FinishReport: React.FC<{ timing: DemoTiming; labels: string[] }> = ({ timing, labels }) => {
  const days = new Map<string, number>();
  for (const s of timing.sessions) {
    const key = new Date(s.start).toDateString();
    days.set(key, (days.get(key) ?? 0) + (s.end - s.start));
  }
  const most = Math.max(...days.values());
  const rounds = timing.perRound
    .map((r, i) => ({ ...r, round: i + 1, perStitch: r.actual / Math.max(timing.features.rounds[i].length, 1) }))
    .filter((r) => r.actual > 0);
  const byPace = [...rounds].sort((a, b) => b.perStitch - a.perStitch);
  return (
    <section className="section explore-finish">
      <h2>How it went</h2>
      <p className="explore-hero">
        <strong>{duration(timing.activeMs / 1000)}</strong> of knitting, in {timing.sessions.length} sittings over {days.size} days.
      </p>
      <div className="explore-days" aria-label="Time knitted each day">
        {[...days.entries()].map(([key, ms]) => (
          <span key={key} className="explore-day" title={`${key}: ${duration(ms / 1000)}`}>
            <span style={{ height: `${(100 * ms) / most}%` }} />
          </span>
        ))}
      </div>
      <h3>Your speed</h3>
      <p className="quiet">Only what you did often enough for the timings to say.</p>
      <table className="explore-ops">
        <thead>
          <tr><th>Each</th><th>You</th><th>Typical</th></tr>
        </thead>
        <tbody>
          {columns.filter((op) => (timing.seen[op] ?? 0) >= 60).map((op) => (
            <tr key={op}>
              <td>{opLabel[op]}</td>
              <td>{timing.costs[op].toFixed(1)} s</td>
              <td className="quiet">{typical[op].toFixed(1)} s</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Slowest and quickest rounds</h3>
      <ul className="explore-rounds">
        {byPace.slice(0, 3).map((r) => (
          <li key={r.round}>Round {r.round}, {labels[r.round - 1]}: {r.perStitch.toFixed(1)} s a stitch</li>
        ))}
        {byPace.slice(-2).reverse().map((r) => (
          <li key={r.round}>Round {r.round}, {labels[r.round - 1]}: {r.perStitch.toFixed(1)} s a stitch</li>
        ))}
      </ul>
    </section>
  );
};
