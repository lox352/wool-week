import React, { useMemo } from "react";
import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";
import { Mark, forkMark, makeOneMark, markFor } from "../helpers/stitch-marks";
import { Palette, yarnFor } from "./palette";
import { indexRounds, runInstruction, upcomingRuns } from "./progress";
import { KeyEntry, stitchKey } from "./stitch-key";
import type { NeedleChange } from "./chart-marks";
import type { StitchKeyId, StitchNote } from "../data/hats/types";

const Cell: React.FC<{ type?: StitchType; mark?: Mark; x: number }> = ({ type, mark = type && markFor(type), x }) => {
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
export const Swatch: React.FC<{ entry: KeyEntry }> = ({ entry }) => {
  const pair = entry.id === "kfb";
  return (
    <svg
      className="key-swatch"
      width={pair ? 48 : 24}
      height="24"
      viewBox={`-0.04 -0.04 ${(pair ? 2 : 1) + 0.08} 1.08`}
      aria-hidden="true"
    >
      {pair ? (
        <>
          <Cell x={0} />
          <Cell x={1} mark={forkMark(0.5, [0.5, -0.5])} />
        </>
      ) : entry.id === "m1" ? (
        <Cell x={0} mark={makeOneMark(entry.lean)} />
      ) : (
        <Cell type={entry.type} x={0} />
      )}
    </svg>
  );
};

/** What the crimson rule across the chart means, and why it is there. */
function TurnText({ turns }: { turns: number[] }) {
  return (
    <>
      The work is turned after {turns.length === 1 ? "round" : "rounds"}{" "}
      {turns.join(", ")}: inside out, if it is already a tube, or over, if it
      is a row worked flat. Each rule divides two stretches worked with
      opposite faces of the knitting towards you. The chart shows the face you
      are working on: working the turn turns the chart over, and the stretch
      on the other side of the rule is hatched, because you see it from its
      other face.
    </>
  );
}

/**
 * The rule as the key draws it: a line on its own, as on the chart, where it
 * runs between two rounds rather than through any cell.
 */
const TurnSwatch: React.FC = () => (
  <svg className="key-swatch" width="24" height="24" viewBox="0 0 1 1" aria-hidden="true">
    <line x1="0" y1="0.5" x2="1" y2="0.5" className="key-turn" />
  </svg>
);

/** A change of needles, dashed as the chart draws it. */
const NeedlesSwatch: React.FC = () => (
  <svg className="key-swatch" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <line x1="0" y1="12" x2="24" y2="12" className="key-needles" />
  </svg>
);

/**
 * Where the needles change, in words: "to 3mm after round 14". A pattern
 * that changes by the round rather than the section - 2026's, which puts
 * every single-colour round on the smaller needles - does so often, so the
 * rounds are gathered by the size they change to.
 */
function NeedlesText({ changes }: { changes: NeedleChange[] }) {
  const sizes = [...new Set(changes.map((change) => change.to))];
  const phrases = sizes.map((size) => {
    const after = changes.filter((change) => change.to === size).map((change) => change.after);
    return `to ${size}mm after ${after.length === 1 ? "round" : "rounds"} ${after.join(", ")}`;
  });
  return (
    <>
      Where the dashed rule crosses the chart, change needles:{" "}
      {phrases.join("; ")}. Knitting stops at each for you to change, and
      tapping a stitch says which needles it is worked on.
    </>
  );
}

/** The hatch as the chart draws it over the other face's rounds. */
export const HatchSwatch: React.FC = () => (
  <svg className="key-swatch" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" className="key-hatch-ground" />
    {[-12, -6, 0, 6, 12, 18].map((at) => (
      <line key={at} x1={at} y1={24} x2={at + 24} y2={0} className="chart-hatch-line" />
    ))}
  </svg>
);

/** What the hatch on the chart means. */
export const hatchSaying =
  "Knitted with the other face of the hat towards you, on the far side of " +
  "a turn from where you are now. The chart shows it from the face you are " +
  "working on, so it is mirrored, and a knit there is a purl from here.";

/**
 * What the marks on this hat's chart mean, and how to work each one.
 *
 * Only the stitches this hat uses, in the words its pattern uses; see
 * stitch-key.ts.
 */
export function StitchLegend({ stitches, notes, turns, needles }: {
  stitches: Stitch[];
  notes?: Partial<Record<StitchKeyId, StitchNote>>;
  /** Rounds after which the work is turned; see turnsInside. */
  turns?: number[];
  needles?: NeedleChange[];
}) {
  const entries = useMemo(() => stitchKey(stitches, notes), [stitches, notes]);
  return (
    <details className="chart-help">
      <summary>Stitch-symbol key</summary>
      <KeyList entries={entries} turns={turns} needles={needles} />
    </details>
  );
}

/** The key's entries, each with its mark and how to work it. */
export function KeyList({ entries, current, turns, needles }: {
  entries: KeyEntry[];
  current?: string;
  /** Rounds after which the work is turned, which the key explains last. */
  turns?: number[];
  /** Where the needles change, explained after the stitches. */
  needles?: NeedleChange[];
}) {
  return (
    <ul className="stitch-key">
      {entries.map((entry) => (
        <li key={entry.id} className={entry.id === current ? "stitch-key-current" : undefined}>
          <Swatch entry={entry} />
          <div>
            <strong>{entry.label}</strong>
            {entry.abbreviation && <span className="stitch-abbr"> {entry.abbreviation}</span>}
            {entry.id === current && <span className="stitch-key-here"> · you are here</span>}
            <p>{entry.how}</p>
            {entry.note && <p className="stitch-note">{entry.note}</p>}
          </div>
        </li>
      ))}
      {needles && needles.length > 0 && (
        <li className="stitch-key-needles">
          <NeedlesSwatch />
          <div>
            <strong>Change needles</strong>
            <p>
              <NeedlesText changes={needles} />
            </p>
          </div>
        </li>
      )}
      {turns && turns.length > 0 && (
        <li className="stitch-key-turn">
          <TurnSwatch />
          <div>
            <strong>Turn the work</strong>
            <p>
              <TurnText turns={turns} />
            </p>
          </div>
        </li>
      )}
      {turns && turns.length > 0 && (
        <li className="stitch-key-hatch">
          <HatchSwatch />
          <div>
            <strong>Hatched</strong>
            <p>{hatchSaying}</p>
          </div>
        </li>
      )}
    </ul>
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
    <ol>{runs.map(run => <li key={run.startId}>{runInstruction(run)} in {yarnFor(palette, run.slot).name}</li>)}
      {stitches[(ids.at(-1) ?? 0) + 1]?.type === "join" && <li>Join in the round, lifting the first stitch cast on over the last.</li>}
      {stitches[(ids.at(-1) ?? 0) + 1]?.type === "joinAcross" && <li>Without turning, join in the round across the gap.</li>}</ol>
  </div>;
}
