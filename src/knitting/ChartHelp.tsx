import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";
import { markFor } from "../helpers/stitch-marks";
import { Palette, yarnFor } from "./palette";
import { indexRounds, runInstruction, upcomingRuns } from "./progress";

const descriptions: Record<StitchType, string> = {
  k1: "Knit (unmarked cell)", p1: "Purl", k1tbl: "Knit through back loop",
  m1: "Make one (or second loop of KFB)", kfb: "Knit front and back (two loops, one action)",
  k2tog: "Knit two together", k2togtbl: "Knit two together through back loops",
  s2kp: "Centred double decrease: slip two together, knit one, pass two over",
  sk2p: "Left-leaning double decrease: slip one, knit two together, pass slipped stitch over",
  join: "Join in the round",
};

export function StitchLegend({ stitches }: { stitches: Stitch[] }) {
  const types = [...new Set(stitches.filter(s => s.id > 0 && s.type !== "join").map(s => s.type))];
  return <details className="chart-help"><summary>Stitch-symbol key</summary><ul>
    {types.map(type => {
      const mark = markFor(type);
      return <li key={type}><svg width="28" height="28" viewBox="0 0 1 1" aria-hidden="true">
        <rect width="1" height="1" fill="white" stroke="black" strokeWidth=".04" />
        {mark?.strokes?.map((points, i) => <polyline key={i} points={points.map(p => p.join(",")).join(" ")} fill="none" stroke="black" strokeWidth=".05" />)}
        {mark?.dot && <circle cx={mark.dot.x} cy={mark.dot.y} r={mark.dot.r} fill="black" />}
      </svg>{descriptions[type]}</li>;
    })}
  </ul></details>;
}

export function TextRound({ stitches, rounds, round, labels, palette }: {
  stitches: Stitch[]; rounds: number[][]; round: number; labels?: string[]; palette: Palette;
}) {
  const ids = rounds[round - 1] ?? [];
  const index = indexRounds(rounds, labels);
  const runs = upcomingRuns(stitches, (ids[0] ?? 1) - 1, index, ids.length)
    .filter(run => run.startId <= (ids.at(-1) ?? 0));
  return <div><p>Round {round}: {labels?.[round - 1]}. Read in working order.</p>
    <ol>{runs.map(run => <li key={run.startId}>{runInstruction(run)} in {yarnFor(palette, run.slot).name}</li>)}</ol>
  </div>;
}
