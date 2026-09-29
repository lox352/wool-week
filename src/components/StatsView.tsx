/**
 * "Explore statistics": the chart full screen, as when knitting, but for
 * looking back at how the knitting went rather than doing it.
 *
 * Prototypes, several ways at once, chosen by the address:
 *   ?stats=pace     the chart painted by pace, over the 30 stitches around each
 *   ?stats=rounds   the chart in its own colours, a bar per round beside it
 *   ?stats=layers   a switch between the pattern, pace and sittings
 * and the speeds sheet by `&speeds=list`, `=bars` or `=words`.
 */
import React, { useEffect, useMemo, useState } from "react";
import type { Stitch } from "../types/Stitch";
import type { ChartLayout } from "../knitting/layout";
import { cellAt } from "../knitting/draw-chart";
import { stitchKey } from "../knitting/stitch-key";
import { Swatch, TurnSwatch, NeedlesSwatch } from "../knitting/ChartHelp";
import type { HatPattern, StitchKeyId } from "../data/hats/types";
import { actionsOf, readLog } from "../knitting/timing/log";
import { detail, type TimeDetail } from "../knitting/timing/detail";
import { typical, type Column, type TimeSummary } from "../knitting/timing/model";
import { duration, range } from "../knitting/timing/format";
import Button from "./ui/Button";
import "./StatsView.css";

export type StatsStyle = "pace" | "rounds" | "layers";
export type Layer = "pattern" | "pace" | "sittings";

export const useTimeDetail = (projectId: string, stitches: Stitch[], rounds: number[][], progress: number) =>
  useMemo(() => {
    const actions = actionsOf(readLog(projectId));
    return actions.length > 0 ? detail(actions, stitches, rounds) : undefined;
    // Progress stands in for the log having grown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, stitches, rounds, progress]);

/* ------------------------------------------------------------- colours */

// Quicker than usual in blues, slower in reds, about usual a warm grey.
const pace = ["#256abf", "#6da7ec", "#b7d3f6", "#ebe7e1", "#f3b7b6", "#e66767", "#c53d3c"];
const paceCuts = [0.75, 0.87, 0.95, 1.05, 1.15, 1.33];
const paceStep = (ratio: number) => paceCuts.filter((c) => ratio > c).length;
const paceWords = ["Much quicker", "Quicker", "A little quicker", "Usual", "A little slower", "Slower", "Much slower"];
// One sitting from the next: muted, and different enough side by side.
const sittingColours = ["#c9b27c", "#7f9c8b", "#b98474", "#8d8fb3", "#a7a15c", "#6f8fa6"];

const day = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const clock = (ms: number) => new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
const seconds = (s: number) => (s < 10 ? `${s.toFixed(1)} s` : `${Math.round(s)} s`);

/* ------------------------------------------------------------ overlays */

/** Each stitch painted by the pace around it; stitches that came in one long tap faded. */
export const paceOverlay = (time: TimeDetail) => (layout: ChartLayout, cell: number) => {
  const rects: React.ReactNode[] = [];
  layout.cells.forEach((at, id) => {
    const s = time.smooth[id];
    if (!Number.isFinite(s)) return;
    const { x, y } = cellAt(layout, at.round, at.column, cell);
    const coarse = time.tapSpan[id] > 30;
    rects.push(
      <rect key={id} x={x} y={y} width={cell} height={cell} fill={pace[paceStep(s / time.usual)]} opacity={coarse ? 0.4 : 0.92} />,
    );
  });
  return <g>{rects}</g>;
};

/** Each stitch in the colour of the sitting it was knitted in. */
export const sittingOverlay = (time: TimeDetail) => (layout: ChartLayout, cell: number) => {
  const rects: React.ReactNode[] = [];
  layout.cells.forEach((at, id) => {
    const n = time.sittingOf[id];
    if (n < 0) return;
    const { x, y } = cellAt(layout, at.round, at.column, cell);
    rects.push(<rect key={id} x={x} y={y} width={cell} height={cell} fill={sittingColours[n % sittingColours.length]} opacity={0.88} />);
  });
  return <g>{rects}</g>;
};

/** A strip per round between the chart and its round numbers: its pace against the knitter's usual. */
export const roundOverlay = (time: TimeDetail) => (layout: ChartLayout, cell: number) => {
  let right = 0;
  layout.cells.forEach((at) => {
    right = Math.max(right, cellAt(layout, at.round, at.column, cell).x + cell);
  });
  const w = Math.max(3, Math.round(cell * 0.28));
  return (
    <g>
      {time.perRound.map((r, i) => {
        if (r.timed < r.stitches / 2) return null;
        const ratio = r.seconds / r.timed / time.usual;
        const { y } = cellAt(layout, i + 1, 1, cell);
        return <rect key={i} x={right + 1} y={y} width={w} height={cell} fill={pace[paceStep(ratio)]} />;
      })}
    </g>
  );
};

/* ----------------------------------------------------- a tapped stitch */

export const StitchTime: React.FC<{ time: TimeDetail; id: number; round?: number }> = ({ time, id, round }) => {
  const at = time.reachedAt[id];
  if (!Number.isFinite(at)) return <p className="stats-note">Not knitted yet.</p>;
  const sitting = time.sittings[time.sittingOf[id]];
  const s = time.smooth[id];
  const span = time.tapSpan[id];
  const r = round !== undefined ? time.perRound[round - 1] : undefined;
  return (
    <div className="stats-note">
      <p>
        Knitted {day(at)}, {clock(at)}
        {sitting && sitting.end > sitting.start && <>, in a sitting of {duration((sitting.end - sitting.start) / 1000)}</>}.
      </p>
      {Number.isFinite(s) ? (
        <p>
          <span className="stats-chip" style={{ background: pace[paceStep(s / time.usual)] }} />
          {span > 30 ? (
            <>Came in one tap of {span} stitches, at about {seconds(s)} a stitch.</>
          ) : (
            <>
              Around here, about {seconds(s)} a stitch:{" "}
              {paceStep(s / time.usual) === 3
                ? `about your usual ${seconds(time.usual)}`
                : `${paceWords[paceStep(s / time.usual)].toLowerCase()} than your usual ${seconds(time.usual)}`}
              .
            </>
          )}
        </p>
      ) : (
        <p>No time for it: it came after a break.</p>
      )}
      {r && r.timed >= r.stitches / 2 && <p>The whole round took about {duration(r.seconds * (r.stitches / r.timed))}.</p>}
    </div>
  );
};

/* ------------------------------------------------------------ the panel */

export const PaceLegend: React.FC<{ usual: number }> = ({ usual }) => (
  <div className="stats-legend" aria-label="Colours: quicker to slower than usual">
    <span>Quicker</span>
    <span className="stats-legend-scale">
      {pace.map((c) => (
        <span key={c} style={{ background: c }} />
      ))}
    </span>
    <span>Slower</span>
    <span className="stats-legend-usual">than your usual {seconds(usual)} a stitch</span>
  </div>
);

export const StatsPanel: React.FC<{
  style: StatsStyle;
  summary: TimeSummary;
  time: TimeDetail;
  finished: boolean;
  layer: Layer;
  onLayer: (layer: Layer) => void;
  onSpeeds: () => void;
  onClose: () => void;
}> = ({ style, summary, time, finished, layer, onLayer, onSpeeds, onClose }) => (
  <section className="knitting-panel stats-panel" aria-label="Your knitting statistics">
    <div className="stats-figures">
      <div>
        <em>{duration(summary.knitted)}</em>
        <span className="quiet">knitted</span>
      </div>
      {!finished && summary.left && (
        <div>
          <em>{range(summary.left)}</em>
          <span className="quiet">to go</span>
        </div>
      )}
      <div>
        <em>{summary.sittings.length}</em>
        <span className="quiet">{summary.sittings.length === 1 ? "sitting" : "sittings"}</span>
      </div>
    </div>
    {style === "layers" && (
      <div className="stats-layers" role="radiogroup" aria-label="Show">
        {(["pattern", "pace", "sittings"] as Layer[]).map((l) => (
          <button key={l} type="button" role="radio" aria-checked={layer === l} className={layer === l ? "on" : ""} onClick={() => onLayer(l)}>
            {l === "pattern" ? "Pattern" : l === "pace" ? "Pace" : "Sittings"}
          </button>
        ))}
      </div>
    )}
    {(style === "pace" || style === "rounds" || layer === "pace") && <PaceLegend usual={time.usual} />}
    {style === "layers" && layer === "sittings" && (
      <p className="quiet stats-hint">
        Each colour a sitting: {day(time.sittings[0].start)} to {day(time.sittings.at(-1)!.start)}. Tap a stitch for when.
      </p>
    )}
    {style === "layers" && layer === "pattern" && <p className="quiet stats-hint">Tap a stitch for when you knitted it, and how fast.</p>}
    <div className="stats-actions">
      <Button variant="secondary" onClick={onSpeeds}>
        Your speeds
      </Button>
      <Button variant="primary" onClick={onClose}>
        Done
      </Button>
    </div>
  </section>
);

/* ------------------------------------------------------ the speeds sheet */

const opOf: Partial<Record<StitchKeyId, Column>> = {
  castOn: "castOn",
  k1: "knit",
  p1: "purl",
  k1tbl: "tbl",
  k2tog: "decrease",
  k2togtbl: "decrease",
  s2kp: "doubleDecrease",
  sk2p: "doubleDecrease",
  m1: "makeOne",
  kfb: "kfb",
};

/** Enough of an operation seen for its cost to mean something. */
const enoughOf = (column: Column) => (["join", "turn", "needles"].includes(column) ? 1 : 60);

interface SpeedRow {
  key: string;
  swatch: React.ReactNode;
  label: string;
  column: Column;
  extra?: boolean;
}

const speedRows = (stitches: Stitch[], notes: HatPattern["stitchNotes"], time: TimeDetail): SpeedRow[] => {
  const rows: SpeedRow[] = [];
  for (const entry of stitchKey(stitches, notes)) {
    const column = opOf[entry.id];
    if (column) rows.push({ key: entry.id, swatch: <Swatch entry={entry} />, label: entry.label, column });
  }
  const has = (type: string) => stitches.some((s) => s.type === type);
  rows.push({ key: "colour", swatch: <span className="stats-swatch-yarns" />, label: "Changing yarn", column: "colourChange", extra: true });
  if (time.seen.knitPurlSwitch > 0) rows.push({ key: "switch", swatch: <span className="stats-swatch-kp">k|p</span>, label: "Switching knit and purl", column: "knitPurlSwitch", extra: true });
  if (has("join")) rows.push({ key: "join", swatch: <span className="stats-swatch-join">←</span>, label: "Joining in the round", column: "join" });
  if (has("turn")) rows.push({ key: "turn", swatch: <TurnSwatch />, label: "Turning the work", column: "turn" });
  if (has("needles")) rows.push({ key: "needles", swatch: <NeedlesSwatch />, label: "Changing needles", column: "needles" });
  return rows;
};

export const SpeedsSheet: React.FC<{
  variant: "list" | "bars" | "words";
  stitches: Stitch[];
  notes: HatPattern["stitchNotes"];
  time: TimeDetail;
  onClose: () => void;
}> = ({ variant, stitches, notes, time, onClose }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const rows = speedRows(stitches, notes, time);
  const known = rows.filter((r) => time.seen[r.column] >= enoughOf(r.column));
  const unknown = rows.filter((r) => time.seen[r.column] < enoughOf(r.column));
  const cost = (r: SpeedRow) => `${r.extra ? "+" : ""}${seconds(time.costs[r.column])}`;
  const ratio = (r: SpeedRow) => time.costs[r.column] / typical[r.column];
  return (
    <div className="key-sheet stats-speeds" role="dialog" aria-label="Your speeds">
      <div className="key-sheet-head">
        <strong>Your speeds</strong>
        <button type="button" className="key-sheet-close" aria-label="Close your speeds" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="key-sheet-body">
        <p className="quiet stats-hint">
          Each, on average, worked out from your taps: {time.seen.tap.toLocaleString()} of them over{" "}
          {time.sittings.length} sittings. The more you knit, the surer these get.
        </p>
        {variant === "words" ? (
          <SpeedWords known={known} time={time} />
        ) : (
          <ul className={`stats-speed-list ${variant}`}>
            {known.map((r) => (
              <li key={r.key}>
                <span className="stats-speed-swatch">{r.swatch}</span>
                <span className="stats-speed-name">{r.label}</span>
                <span className="stats-speed-you">{cost(r)}</span>
                {variant === "list" ? (
                  <span className="stats-speed-typical quiet">typical {seconds(typical[r.column])}</span>
                ) : (
                  <span className="stats-speed-bar" aria-label={`${Math.round((ratio(r) - 1) * 100)}% against typical`}>
                    <span
                      className={ratio(r) > 1 ? "slower" : "quicker"}
                      style={{ width: `${Math.min(50, Math.abs(Math.log2(ratio(r))) * 50)}%` }}
                    />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {unknown.length > 0 && (
          <p className="quiet stats-hint">
            Not enough yet to say: {unknown.map((r) => r.label.toLowerCase()).join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
};

const SpeedWords: React.FC<{ known: SpeedRow[]; time: TimeDetail }> = ({ known, time }) => {
  const by = (r: SpeedRow) => time.costs[r.column] / typical[r.column];
  const quicker = known.filter((r) => by(r) < 0.9);
  const slower = known.filter((r) => by(r) > 1.1);
  const knit = known.find((r) => r.column === "knit");
  const say = (rs: SpeedRow[]) =>
    rs.map((r) => `${r.label.toLowerCase()} (${r.extra ? "+" : ""}${seconds(time.costs[r.column])})`).join(", ");
  return (
    <div className="stats-words">
      {knit && (
        <p className="stats-words-lead">
          You knit a stitch in about <strong>{seconds(time.costs.knit)}</strong>, which is{" "}
          {by(knit) < 0.9 ? "quicker than" : by(knit) > 1.1 ? "slower than" : "about"} typical.
        </p>
      )}
      {quicker.length > 0 && (
        <p>
          <span className="stats-chip" style={{ background: pace[1] }} /> Quicker than most: {say(quicker)}.
        </p>
      )}
      {slower.length > 0 && (
        <p>
          <span className="stats-chip" style={{ background: pace[5] }} /> Slower than most: {say(slower)}.
        </p>
      )}
    </div>
  );
};

/** Which prototype, from the address. */
export const statsChoice = (params: URLSearchParams) => ({
  style: (["pace", "rounds", "layers"].includes(params.get("stats") ?? "") ? params.get("stats") : "layers") as StatsStyle,
  speeds: (["list", "bars", "words"].includes(params.get("speeds") ?? "") ? params.get("speeds") : "list") as "list" | "bars" | "words",
});

export const useLayer = (style: StatsStyle) => useState<Layer>(style === "rounds" ? "pattern" : "pace");
