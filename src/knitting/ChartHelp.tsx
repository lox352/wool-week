import React, { useMemo } from "react";
import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";
import { markFor } from "../helpers/stitch-marks";
import { Palette, yarnFor } from "./palette";
import { indexRounds, runInstruction, upcomingRuns } from "./progress";
import { KeyEntry, stitchKey } from "./stitch-key";
import type { StitchKeyId, StitchNote } from "../data/hats/types";

const Cell: React.FC<{ type: StitchType; x: number }> = ({ type, x }) => {
  const mark = markFor(type);
  return (
    <g transform={`translate(${x} 0)`}>
      <rect width="1" height="1" className="key-cell" />
      {mark?.strokes?.map((points, i) => (
        <polyline key={i} points={points.map((p) => p.join(",")).join(" ")} className="key-mark" />
      ))}
      {mark?.dot && <circle cx={mark.dot.x} cy={mark.dot.y} r={mark.dot.r} className="key-dot" />}
    </g>
  );
};

/** A KFB is drawn as the pair of cells it makes: the stitch, and the new one to its left. */
const Swatch: React.FC<{ entry: KeyEntry }> = ({ entry }) => {
  const cells: StitchType[] = entry.id === "kfb" ? ["m1", "kfb"] : [entry.type];
  return (
    <svg
      className="key-swatch"
      width={24 * cells.length}
      height="24"
      viewBox={`-0.04 -0.04 ${cells.length + 0.08} 1.08`}
      aria-hidden="true"
    >
      {cells.map((type, i) => <Cell key={i} type={type} x={i} />)}
    </svg>
  );
};

/**
 * What the marks on this hat's chart mean, and how to work each one.
 *
 * Only the stitches this hat uses, in the words its pattern uses; see
 * stitch-key.ts.
 */
export function StitchLegend({ stitches, notes }: {
  stitches: Stitch[];
  notes?: Partial<Record<StitchKeyId, StitchNote>>;
}) {
  const entries = useMemo(() => stitchKey(stitches, notes), [stitches, notes]);
  return (
    <details className="chart-help">
      <summary>Stitch-symbol key</summary>
      <ul className="stitch-key">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Swatch entry={entry} />
            <div>
              <strong>{entry.label}</strong>
              {entry.abbreviation && <span className="stitch-abbr"> {entry.abbreviation}</span>}
              <p>{entry.how}</p>
              {entry.note && <p className="stitch-note">{entry.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function TextRound({ stitches, rounds, round, labels, palette }: {
  stitches: Stitch[]; rounds: number[][]; round: number; labels?: string[]; palette: Palette;
}) {
  const ids = rounds[round - 1] ?? [];
  const index = indexRounds(rounds, labels);
  const runs = upcomingRuns(stitches, (ids[0] ?? 1) - 1, index, ids.length)
    .filter(run => run.startId <= (ids.at(-1) ?? 0));
  return <div><p>Round {round}: {labels?.[round - 1]}. Read in working order.</p>
    <ol>{runs.map(run => <li key={run.startId}>{labels?.[round - 1]?.includes("cast on")
      ? `Cast on ${run.endId - run.startId + 1} stitches`
      : runInstruction(run)} in {yarnFor(palette, run.slot).name}</li>)}</ol>
  </div>;
}
