import { useState } from "react";
import { Stitch } from "../types/Stitch";
import { RoundIndex, positionOf } from "../knitting/progress";
import { progressBefore } from "../knitting/jump";
import Dialog from "./ui/Dialog";
import Button from "./ui/Button";

export default function JumpTo({ stitches, index, progress, onJump }: {
  stitches: Stitch[]; index: RoundIndex; progress: number; onJump: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(1);
  const [stitch, setStitch] = useState(1);
  const [error, setError] = useState("");
  return <>
    <Button variant="quiet" onClick={() => {
      const at = positionOf(stitches, progress, index);
      setRound(Math.min(at.round, index.totalRounds)); setStitch(1); setError(""); setOpen(true);
    }}>Go to round/stitch</Button>
    {open && <Dialog open title="Change knitting position" confirmLabel="Confirm position"
      text="Choose the NEXT stitch you will work. Earlier stitches will be marked complete. Round 1 is the cast-on; the pattern section labels help you match the leaflet. You can Undo this change. A KFB pair is kept together."
      onCancel={() => setOpen(false)} onConfirm={() => {
        try { onJump(progressBefore(stitches, index.rounds, round, stitch)); setOpen(false); }
        catch (e) { setError(e instanceof Error ? e.message : "Invalid position."); }
      }}>
      <label>Round <select value={round} onChange={e => { setRound(Number(e.target.value)); setStitch(1); }}>
        {index.rounds.map((_, i) => <option key={i} value={i + 1}>{i + 1} · {index.labels[i]}</option>)}
      </select></label>
      <label>Next stitch <input type="number" min={1} max={index.rounds[round - 1]?.length ?? 1}
        value={stitch} onChange={e => setStitch(Number(e.target.value))} /></label>
      <p>{index.rounds[round - 1]?.length} stitches in this round.</p>
      {error && <p role="alert">{error}</p>}
    </Dialog>}
  </>;
}
