import React, { useMemo } from "react";
import { Stitch } from "../types/Stitch";
import { ChartLayout } from "./layout";
import { Palette, yarnFor } from "./palette";
import {
  cellAt,
  chartSize,
  fillPaths,
  gridPaths,
  markPaths,
  numberedRounds,
  progressPath,
} from "./chart-paths";

interface ChartSvgProps {
  yarnLabels?: Record<string, string>;
  stitches: Stitch[];
  rounds: number[][];
  layout: ChartLayout;
  palette: Palette;
  progress: number;
  nextStitchId?: number;
  cell: number;
  /** Rounds after which the work is turned inside out. */
  turns?: number[];
  /** Rounds after which the needles are changed. */
  needleChanges?: number[];
  /** Which way this pattern's make-ones lean, if it says. */
  makeOneLean?: "left" | "right";
  /**
   * Rounds, first and last, worked with the other face towards you from the
   * one you are on: hatched over.
   */
  hatch?: [number, number][];
}

type Grid = ReturnType<typeof gridPaths>;

/**
 * The chart, as vectors.
 *
 * Two layers. The one underneath is the knitting - the colours, the rules and
 * the symbols - which does not change while you knit, so it is built once and
 * React is told to leave it alone. Over the top go the two things that do
 * change: how much is done, and which stitch is next.
 *
 * Both are a handful of paths rather than a shape per stitch, because a chart
 * is mostly long runs of one colour. See chart-paths.ts. That is what makes a
 * drawing of ten thousand stitches cheap enough to keep as vectors, which in
 * turn is what keeps it sharp on a phone, under zoom, and on paper.
 */

const Knitting: React.FC<{
  stitches: Stitch[];
  layout: ChartLayout;
  palette: Palette;
  cell: number;
  grid: Grid;
  makeOneLean?: "left" | "right";
}> = React.memo(({ stitches, layout, palette, cell, grid, makeOneLean }) => {
  const fills = useMemo(
    () => fillPaths(stitches, layout, cell),
    [stitches, layout, cell],
  );
  const marks = useMemo(
    () => markPaths(stitches, layout, palette, cell, makeOneLean),
    [stitches, layout, palette, cell, makeOneLean],
  );

  return (
    <g>
      {fills.map(({ slot, d }) => (
        <path key={slot} d={d} fill={yarnFor(palette, slot).hex} />
      ))}
      <path d={grid.light} className="chart-rule" />
      <path d={grid.heavy} className="chart-rule chart-rule-heavy" />
      {marks.map(({ ink, strokes, dots }) => (
        <g key={ink} stroke={ink} fill={ink}>
          {strokes && (
            <>
              {/* A halo, so a mark reads on a dark yarn as well as a light one. */}
              <path
                d={strokes}
                className="chart-mark-halo"
                stroke={ink === "#ffffff" ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.75)"}
              />
              <path d={strokes} className="chart-mark" />
            </>
          )}
          {dots && <path d={dots} stroke="none" />}
        </g>
      ))}
    </g>
  );
});

const ChartSvg: React.FC<ChartSvgProps> = ({
  yarnLabels,
  stitches,
  rounds,
  layout,
  palette,
  progress,
  nextStitchId,
  cell,
  turns,
  needleChanges,
  makeOneLean,
  hatch = [],
}) => {
  const { width, height } = chartSize(layout, cell);
  /*
   * Built here rather than inside the knitting, because the turn's rule is
   * drawn over the worked-so-far veil: it says which way about the chart is
   * read, which is as much use behind you as ahead of you.
   */
  const grid = useMemo(
    () => gridPaths(layout, cell, turns, needleChanges),
    [layout, cell, turns, needleChanges],
  );

  const veil = useMemo(
    () => progressPath(layout, rounds, progress, cell),
    [layout, rounds, progress, cell],
  );
  const numbers = useMemo(
    () => numberedRounds(layout, turns, needleChanges),
    [layout, turns, needleChanges],
  );
  const next = nextStitchId === undefined ? undefined : layout.cells.get(nextStitchId);

  return (
    <svg
      className="chart-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
    >
      <Knitting
        stitches={stitches}
        layout={layout}
        palette={palette}
        cell={cell}
        grid={grid}
        makeOneLean={makeOneLean}
      />
      {yarnLabels && <YarnLabels stitches={stitches} layout={layout} cell={cell} labels={yarnLabels} />}
      {veil && <path d={veil} className="chart-done" />}
      {hatch.length > 0 && (
        <>
          <defs>
            <pattern
              id="chart-hatch"
              width={6}
              height={6}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1={0} y1={0} x2={0} y2={6} className="chart-hatch-line" />
            </pattern>
          </defs>
          {hatch.map(([from, to]) => (
            <rect
              key={from}
              className="chart-hatch"
              x={0}
              y={cellAt(layout, to, 1, cell).y}
              width={layout.columns * cell}
              height={(to - from + 1) * cell}
              fill="url(#chart-hatch)"
            />
          ))}
        </>
      )}
      {grid.needles && (
        <g>
          {/* On a pale ground, so the dashes show on dark wool as on light. */}
          <path d={grid.needles} className="chart-rule chart-rule-needles-ground" />
          <path d={grid.needles} className="chart-rule chart-rule-needles">
            <title>The needles are changed here.</title>
          </path>
        </g>
      )}
      {grid.turn && (
        <path d={grid.turn} className="chart-rule chart-rule-turn">
          <title>The work is turned here.</title>
        </path>
      )}
      {next && (
        <rect
          className="chart-next"
          x={cellAt(layout, next.round, next.column, cell).x - 1}
          y={cellAt(layout, next.round, next.column, cell).y - 1}
          width={cell + 2}
          height={cell + 2}
        />
      )}
      <g className="chart-numbers">
        {numbers.map((round) => (
          <text
            key={round}
            x={layout.columns * cell + Math.round(cell * 0.45)}
            y={cellAt(layout, round, 1, cell).y + cell / 2}
            dominantBaseline="middle"
            style={{ fontSize: Math.max(12, cell * .55) }}
          >
            {round}
          </text>
        ))}
      </g>
    </svg>
  );
};

export default ChartSvg;

const YarnLabels = React.memo(({ stitches, layout, cell, labels }: {
  stitches: Stitch[]; layout: ChartLayout; cell: number; labels: Record<string, string>;
}) => <g fill="#000" fontSize="9" aria-hidden="true">{stitches.map(stitch => {
  const at = layout.cells.get(stitch.id);
  if (!at) return null;
  const { x, y } = cellAt(layout, at.round, at.column, cell);
  return <text key={stitch.id} x={x + 2} y={y + 9}>{labels[stitch.slot]}</text>;
})}</g>);
