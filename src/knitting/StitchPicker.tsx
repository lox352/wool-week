import React, { useEffect } from "react";
import { Stitch } from "../types/Stitch";
import { ChartLayout } from "./layout";
import { cellAt, chartSize } from "./draw-chart";
import { progressBefore } from "./jump";
import Button from "../components/ui/Button";

/** How wide the bubble is, so it can be kept on the chart. */
const bubbleWidth = 208;

/**
 * The bubble over a stitch tapped on the chart, offering to carry on from it.
 *
 * Tapping picks the stitch you want to work next: one ahead of you marks
 * everything before it knitted, and one behind you takes you back to it. It
 * asks rather than jumping at once, because a chart is also something you
 * scroll with your thumb, and it can be undone either way.
 */
const StitchPicker: React.FC<{
  id: number;
  stitches: Stitch[];
  rounds: number[][];
  layout: ChartLayout;
  cell: number;
  progress: number;
  onJump: (progress: number) => void;
  onClose: () => void;
}> = ({ id, stitches, rounds, layout, cell, progress, onJump, onClose }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const at = layout.cells.get(id);
  if (!at) return null;
  const target = progressBefore(stitches, rounds, at.round, at.index);
  const { x, y } = cellAt(layout, at.round, at.column, cell);
  const { width } = chartSize(layout, cell);
  const left = Math.min(
    Math.max(x + cell / 2 - bubbleWidth / 2, 4),
    Math.max(width - bubbleWidth - 4, 4),
  );
  // Above the stitch, unless that would run off the top of the chart.
  const below = y < 96;
  const here = target === progress;

  return (
    <>
      <div
        className="chart-picked"
        style={{ left: x - 2, top: y - 2, width: cell + 4, height: cell + 4 }}
        aria-hidden="true"
      />
      <div
        className={`stitch-picker${below ? " stitch-picker-below" : ""}`}
        role="dialog"
        aria-label={`Round ${at.round}, stitch ${at.index}`}
        style={{
          left,
          width: bubbleWidth,
          top: below ? y + cell + 8 : undefined,
          bottom: below ? undefined : layout.rounds * cell - y + 8,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stitch-picker-head">
          <span>
            Round {at.round}, stitch {at.index}
          </span>
          <button
            type="button"
            className="stitch-picker-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {here ? (
          <p className="stitch-picker-note">This is the next stitch to work.</p>
        ) : (
          <Button
            variant="primary"
            autoFocus
            onClick={() => {
              onJump(target);
              onClose();
            }}
          >
            {target > progress ? "Knit up to here" : "Go back to here"}
          </Button>
        )}
      </div>
    </>
  );
};

export default StitchPicker;
