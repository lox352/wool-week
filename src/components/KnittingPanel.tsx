import React, { useCallback, useEffect } from "react";
import { Stitch } from "../types/Stitch";
import {
  Run,
  RoundIndex,
  currentRun,
  endOfRound,
  positionOf,
  runInstruction,
  stitchWord,
  totals,
  upcomingRuns,
} from "../knitting/progress";
import { Palette, inkOn, yarnFor } from "../knitting/palette";
import Button from "./ui/Button";
import "./KnittingPanel.css";

interface KnittingPanelProps {
  stitches: Stitch[];
  index: RoundIndex;
  palette: Palette;
  progress: number;
  setProgress: (progress: number) => void;
  onStop: () => void;
  canUndo: boolean;
  onUndo: () => void;
}

const Swatch: React.FC<{ run: Run; palette: Palette; small?: boolean }> = ({
  run,
  palette,
  small,
}) => {
  const yarn = yarnFor(palette, run.slot);
  return (
    <span
      className={`run-swatch${small ? " run-swatch-small" : ""}`}
      style={{ background: yarn.hex, color: inkOn(yarn.hex) }}
      title={`${runInstruction(run)} in ${yarn.name}`}
    >
      {run.length}
    </span>
  );
};

/**
 * The point where the work is turned inside out.
 *
 * Not a stitch, and so not something the stitch counter can carry: it is the
 * boundary between two regions of the hat worked on opposite faces, and it
 * applies to everything after it rather than to one stitch. So it is said at
 * the head of the round that opens the new region and left up for the whole
 * of that round - large for the first stitch, a reminder after that - which
 * is long enough that neither "End of round" nor a run can carry you past it
 * without having seen it.
 */
const Turn: React.FC<{ opening: boolean }> = ({ opening }) => (
  <div className={`knitting-turn${opening ? " knitting-turn-open" : ""}`}>
    <strong>
      <span aria-hidden="true">⟲</span> Turn your work inside out
    </strong>
    {opening && (
      <span className="quiet">
        From here the other face of the hat is towards you, which is how the
        brim's right side ends up outside once it is turned up. The crimson
        rule on the chart marks it.
      </span>
    )}
  </div>
);

/**
 * The view you use while actually knitting.
 *
 * Written for someone holding needles. The things in large type are the round,
 * the stitch within it, and what to work before anything changes - which in
 * Fair Isle is the only instruction that matters. A percentage is not
 * something you can act on, so it is demoted to a bar.
 *
 * A run ends where the stitch changes as well as where the yarn does, so the
 * button says "Purl 2 in Port Wine" and not "Work 126 in Port Wine" across a
 * whole round of twisted rib. That makes runs short in a rib, which is what a
 * rib is; "End of round" is there for when you do not want telling twice.
 *
 * The two big buttons are the two things you actually do: work one more
 * stitch, or work to the end of the run in front of you.
 */
const KnittingPanel: React.FC<KnittingPanelProps> = ({
  stitches,
  index,
  palette,
  progress,
  setProgress,
  onStop,
  canUndo,
  onUndo,
}) => {
  const position = positionOf(stitches, progress, index);
  const run = currentRun(stitches, progress, index);
  const ahead = upcomingRuns(stitches, run?.endId ?? progress, index, 2);
  const counts = totals(index, progress);

  const step = useCallback(
    (delta: number) => {
      if (delta > 0) {
        const next = currentRun(stitches, progress, index);
        if (next?.type === "kfb" && next.startId === progress + 1) {
          setProgress(next.endId);
          return;
        }
      } else if (delta < 0) {
        const current = stitches[progress];
        const previous = stitches[progress - 1];
        if (current?.type === "m1" && previous?.type === "kfb") {
          setProgress(progress - 2);
          return;
        }
      }
      setProgress(progress + delta);
    },
    [stitches, index, progress, setProgress],
  );

  const finishRun = useCallback(() => {
    if (run) setProgress(run.endId);
  }, [run, setProgress]);

  const finishRound = useCallback(() => {
    const end = endOfRound(progress, index);
    if (end !== undefined) setProgress(end);
  }, [progress, index, setProgress]);

  // Your hands are busy, so the common actions need to be reachable without
  // aiming at anything.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (["INPUT", "BUTTON", "SELECT", "A", "TEXTAREA"].includes(target.tagName) ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        onUndo();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case " ":
        case "ArrowRight":
          event.preventDefault();
          step(1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          step(-1);
          break;
        case "Enter":
          event.preventDefault();
          finishRun();
          break;
        case "ArrowUp":
          event.preventDefault();
          finishRound();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, finishRun, finishRound, onUndo]);

  if (position.finished) {
    return (
      <div className="knitting-panel knitting-panel-done">
        <div className="knitting-done">
          <strong>That is the last stitch.</strong>
          <span className="quiet">
            Break the yarn, thread it through the remaining stitches and draw
            up the crown.
          </span>
        </div>
        <div className="knitting-actions">
          <Button variant="quiet" onClick={onUndo} disabled={!canUndo}>
            Undo
          </Button>
          <Button variant="primary" onClick={onStop}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="knitting-panel">
      <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        Round {position.round}, stitch {position.stitchInRound}.
        {run && ` ${runInstruction(run)} in ${yarnFor(palette, run.slot).name}.`}
      </p>
      <div className="knitting-readout">
        <span className="knitting-figure">
          <em>{position.round}</em>
          <span className="quiet">of {position.totalRounds} rounds</span>
        </span>
        <span className="knitting-figure">
          <em>{position.stitchInRound}</em>
          <span className="quiet">of {position.stitchesInRound} stitches</span>
        </span>
        {run && (
          <span className="knitting-figure knitting-run">
            <Swatch run={run} palette={palette} />
            <span className="quiet">
              {stitchWord(run.type)} in {yarnFor(palette, run.slot).name}
              {ahead.length > 0 && (
                <>
                  , then{" "}
                  {ahead.map((next, position) => (
                    <React.Fragment key={next.startId}>
                      {position > 0 && ", "}
                      <Swatch run={next} palette={palette} small />
                      {/*
                        A bare number is a knit, which is what most of a Fair
                        Isle round is. Anything else says so.
                      */}
                      {next.type !== "k1" && ` ${stitchWord(next.type)}`}
                    </React.Fragment>
                  ))}
                </>
              )}
            </span>
          </span>
        )}
      </div>

      {position.region > 0 && position.regionRound === 1 && (
        <Turn opening={position.stitchInRound === 1} />
      )}

      {position.label && (
        <p className="knitting-where quiet">{position.label}</p>
      )}

      <div className="knitting-bar" aria-hidden="true">
        <span style={{ width: `${counts.percent}%` }} />
      </div>

      <div className="knitting-actions">
        <Button variant="quiet" onClick={() => step(-1)} disabled={progress <= 0}>
          Back
        </Button>
        <Button variant="quiet" onClick={onUndo} disabled={!canUndo}>
          Undo
        </Button>
        <Button variant="secondary" size="lg" onClick={() => step(1)}>
          One stitch
        </Button>
        <Button variant="primary" size="lg" onClick={finishRun}>
          {run
            ? `${runInstruction(run)} in ${yarnFor(palette, run.slot).name}`
            : "Work on"}
        </Button>
        <Button variant="quiet" onClick={finishRound}>
          End of round
        </Button>
        <Button variant="quiet" onClick={onStop}>
          Stop
        </Button>
      </div>
    </div>
  );
};

export default KnittingPanel;
