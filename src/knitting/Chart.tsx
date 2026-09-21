import React, { useEffect, useMemo, useRef } from "react";
import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";
import { layOut, chartedStitches } from "./layout";
import { Palette, inkOn, yarnFor } from "./palette";
import { markFor } from "../helpers/stitch-marks";
import "./Chart.css";

const cellSize = 13;
/** Every nth line is drawn heavier, to make counting easier. */
const emphasis = 5;
/**
 * How far above the panel the stitch being worked should sit, in rounds.
 *
 * Enough that the round you are on and the few just finished are all clear of
 * it, rather than the stitch you want hugging its top edge.
 */
const clearance = 5;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface ChartProps {
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  progress: number;
  /** Mark the next stitch and keep it in view. */
  follow?: boolean;
  /** Round labels from the pattern, for the margin. */
  labels?: string[];
}

const Cell: React.FC<{
  stitch: Stitch;
  row: number;
  column: number;
  totalRounds: number;
  columns: number;
  hex: string;
  done: boolean;
  isNext: boolean;
  openTop: boolean;
  openLeft: boolean;
}> = React.memo(
  ({ stitch, row, column, totalRounds, columns, hex, done, isNext, openTop, openLeft }) => {
    const mark = markFor(stitch.type as StitchType, 0, 0, cellSize);
    return (
      <div
        className={[
          "chart-cell",
          column !== 1 && (column - 1) % emphasis === 0 ? "chart-cell-major-col" : "",
          row !== 1 && (row - 1) % emphasis === 0 ? "chart-cell-major-row" : "",
          openTop ? "chart-cell-open-top" : "",
          openLeft ? "chart-cell-open-left" : "",
          done ? "chart-cell-done" : "",
          isNext ? "chart-cell-next" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-stitch={stitch.id}
        style={{
          // The cast-on belongs at the bottom, so rounds count up the grid.
          gridRow: totalRounds - row + 1,
          gridColumn: columns - column + 1,
          backgroundColor: hex,
        }}
      >
        {mark && (
          <svg
            className="chart-mark"
            viewBox={`0 0 ${cellSize} ${cellSize}`}
            aria-hidden="true"
            style={{ color: inkOn(hex) }}
          >
            {mark.path && (
              <>
                <path className="chart-mark-halo" d={mark.path} />
                <path d={mark.path} />
              </>
            )}
            {mark.dot && (
              <circle
                className="chart-mark-dot"
                cx={mark.dot.cx}
                cy={mark.dot.cy}
                r={mark.dot.r}
              />
            )}
          </svg>
        )}
      </div>
    );
  },
);

/**
 * The chart.
 *
 * One cell per stitch, laid into a grid from the rounds the pattern states.
 * Rounds that decrease are simply shorter, so a crown draws its own staircase
 * and there is nothing to work out; a cell with no neighbour above or to its
 * left closes its own outline, which is what makes the steps read as edges.
 */
const Chart: React.FC<ChartProps> = ({
  stitches,
  rounds,
  palette,
  progress,
  follow = false,
  labels,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const nextId = follow ? progress + 1 : undefined;

  const drawn = useMemo(() => chartedStitches(stitches), [stitches]);
  const { cells, rounds: totalRounds, columns } = useMemo(
    () => layOut(stitches, rounds),
    [stitches, rounds],
  );

  /*
   * Which squares hold a stitch, so a cell can tell whether anything is going
   * to draw the line above it or to its left.
   */
  const filled = useMemo(() => {
    const squares = new Set<string>();
    cells.forEach((cell) => squares.add(`${cell.round},${cell.column}`));
    return squares;
  }, [cells]);

  /*
   * A chart is read from the bottom right, so that is where it should open.
   * Only once: after that the knitter's own scrolling, and the follow below,
   * decide where it sits.
   */
  const opened = useRef(false);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || opened.current) return;
    opened.current = true;
    grid.scrollLeft = grid.scrollWidth;
  }, []);

  // Sideways: keep the stitch being worked in the middle, so the chart follows
  // the knitter rather than having to be hunted for.
  useEffect(() => {
    if (nextId === undefined) return;
    const grid = gridRef.current;
    const cell = grid?.querySelector<HTMLElement>(`[data-stitch="${nextId}"]`);
    if (!grid || !cell) return;
    grid.scrollTo({
      left: Math.max(cell.offsetLeft - grid.clientWidth / 2 + cell.offsetWidth / 2, 0),
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [nextId]);

  /*
   * And down the page, but only when the round changes. Within a round the
   * stitch moves sideways, which the effect above handles, and scrolling the
   * page once per stitch would have the whole chart twitching.
   */
  const focusRound = nextId === undefined ? undefined : cells.get(nextId)?.round;

  useEffect(() => {
    if (focusRound === undefined || nextId === undefined) return;
    const cell = gridRef.current?.querySelector<HTMLElement>(
      `[data-stitch="${nextId}"]`,
    );
    if (!cell) return;
    /*
     * The panel is stuck to the bottom of the screen while you work, so the
     * part of the page you can see ends at its top edge. Its height, not
     * wherever it happens to be sitting: it comes unstuck at the very bottom
     * of the page and rides higher than it will once the page has scrolled.
     */
    const panel = document.querySelector<HTMLElement>(".knitting-panel");
    const floor = window.innerHeight - (panel?.offsetHeight ?? 0);
    const delta = cell.getBoundingClientRect().bottom - (floor - clearance * cellSize);
    if (Math.abs(delta) < 1) return;
    window.scrollBy({ top: delta, behavior: reducedMotion() ? "auto" : "smooth" });
    // Re-aim only when the round changes; the id is in the closure for the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRound]);

  if (totalRounds === 0) return <p>This pattern has no stitches to chart.</p>;

  return (
    <div className="chart-frame">
      <div
        id="printable-section"
        className="chart"
        ref={gridRef}
        style={{
          gridTemplateRows: `repeat(${totalRounds}, ${cellSize}px)`,
          gridTemplateColumns: `repeat(${columns + 1}, ${cellSize}px)`,
        }}
      >
        {drawn.map((stitch) => {
          const cell = cells.get(stitch.id);
          if (!cell) return null;
          const hex = yarnFor(palette, stitch.slot).hex;
          return (
            <Cell
              key={stitch.id}
              stitch={stitch}
              row={cell.round}
              column={cell.column}
              totalRounds={totalRounds}
              columns={columns}
              hex={hex}
              done={stitch.id <= progress}
              isNext={stitch.id === nextId}
              openTop={!filled.has(`${cell.round + 1},${cell.column}`)}
              openLeft={!filled.has(`${cell.round},${cell.column + 1}`)}
            />
          );
        })}
        {Array.from({ length: totalRounds }, (_, index) => {
          const round = index + 1;
          if (round % emphasis !== 0 && round !== 1 && round !== totalRounds) {
            return null;
          }
          return (
            <div
              key={`round-${round}`}
              className="chart-label chart-label-right"
              style={{ gridRow: totalRounds - round + 1, gridColumn: columns + 1 }}
              title={labels?.[round - 1]}
            >
              {round}
            </div>
          );
        })}
      </div>
      <p className="chart-caption">
        {columns} stitches at its widest, {totalRounds} rounds. Read from the
        bottom right, working right to left; scroll sideways to see a whole
        round. Where a round is shorter than the one below it, stitches have
        been decreased away.
      </p>
    </div>
  );
};

export default Chart;
