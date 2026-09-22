import React, { useMemo } from "react";
import { HatPattern, partKey } from "../data/hats/types";
import { Palette, yarnFor } from "../knitting/palette";

interface ChartMotifProps {
  hat: HatPattern;
  palette: Palette;
  /** How many rounds of the tallest chart to show. */
  rows?: number;
}

/**
 * A swatch of the hat's own colourwork, used as its picture.
 *
 * A photograph of each hat would be the obvious thing, but the photographs
 * belong to the patterns. The chart does not need one: a few rounds of the
 * biggest motif, tiled the way it is knitted, say more about what you would
 * be making than a thumbnail would.
 */
const ChartMotif: React.FC<ChartMotifProps> = ({ hat, palette, rows = 11 }) => {
  const motif = useMemo(() => {
    // The tallest chart that keeps its full width: the body band, not a crown.
    const candidates = hat.charts.filter(
      (chart) => chart.rows[chart.rows.length - 1].length === chart.rows[0].length,
    );
    const chart =
      candidates.sort((a, b) => b.rows.length * b.rows[0].length - a.rows.length * a.rows[0].length)[0] ??
      hat.charts[0];
    return { id: chart.id, rows: chart.rows.slice(0, rows) };
  }, [hat, rows]).rows;
  const chartId = useMemo(() => {
    const candidates = hat.charts.filter(
      (chart) => chart.rows[chart.rows.length - 1].length === chart.rows[0].length,
    );
    return (
      candidates.sort(
        (a, b) =>
          b.rows.length * b.rows[0].length - a.rows.length * a.rows[0].length,
      )[0] ?? hat.charts[0]
    ).id;
  }, [hat]);

  const width = motif[0]?.length ?? 1;
  const repeats = Math.max(1, Math.ceil(44 / width));
  const cell = 6;

  return (
    <svg
      className="chart-motif"
      viewBox={`0 0 ${width * repeats * cell} ${motif.length * cell}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`A swatch of the ${hat.name} colourwork`}
    >
      {motif.map((row, r) =>
        Array.from({ length: repeats }, (_, repeat) =>
          row.map((chartCell, c) => (
            <rect
              key={`${r}-${repeat}-${c}`}
              // Rounds run up the swatch, and stitches right to left.
              x={(repeat * width + (row.length - 1 - c)) * cell}
              y={(motif.length - 1 - r) * cell}
              width={cell}
              height={cell}
              fill={
                yarnFor(
                  palette,
                  chartCell.slot === "ground" || chartCell.slot === "motif"
                    ? partKey(chartId, r + 1, chartCell.slot)
                    : chartCell.slot,
                ).hex
              }
            />
          )),
        ),
      )}
    </svg>
  );
};

export default ChartMotif;
