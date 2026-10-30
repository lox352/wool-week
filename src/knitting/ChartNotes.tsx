import React from "react";
import type { Join, NeedleChange } from "./chart-marks";
import type { MarkerLine } from "./markers";

/**
 * What the chart marks besides its stitches, in words: where the knitting is
 * joined, where the needles change, where the work is turned inside out,
 * where the start of the round runs and which rounds are hatched.
 *
 * A chart drawn on canvases has nothing in it for a screen reader to find, as
 * the vectors' titles were, so it is said here instead, beside the chart and
 * unseen. Each item carries what it is in `data-note`.
 */
const ChartNotes: React.FC<{
  join?: Join;
  /** The rounds after which the work is turned inside out. */
  turns: number[];
  needles: NeedleChange[];
  hatch: [number, number][];
  markers?: MarkerLine[];
}> = ({ join, turns, needles, hatch, markers = [] }) => (
  <ul className="chart-notes visually-hidden" aria-label="Marked on the chart">
    {join && <li data-note="join">Joined in the round after round {join.after}.</li>}
    {needles.map((change) => (
      <li key={`needles-${change.after}`} data-note="needles">
        The needles are changed to {change.to}mm after round {change.after}.
      </li>
    ))}
    {turns.map((after) => (
      <li key={`turn-${after}`} data-note="turn">
        The work is turned inside out after round {after}.
      </li>
    ))}
    {markers.map((line) => (
      <li key={`marker-${line.from}`} data-note="marker">
        {`The start of the round's marker runs up the chart from round ${line.from} to round ${line.to}.`}
      </li>
    ))}
    {hatch.map(([from, to]) => (
      <li key={`hatch-${from}`} data-note="hatch">
        {from === to ? `Round ${from} is hatched` : `Rounds ${from} to ${to} are hatched`}: worked with the other face towards you.
      </li>
    ))}
  </ul>
);

export default ChartNotes;
