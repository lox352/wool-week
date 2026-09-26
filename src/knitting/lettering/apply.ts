import { ChartCell, HatPattern } from "../../data/hats/types";
import { glyphHeight } from "./font";
import { fitLettering, normalise } from "./fit";

const made = new Map<string, HatPattern>();

/**
 * The pattern with the knitter's own words in its lettering band, or the
 * pattern as it is if it has no band, no words were chosen, or they will not
 * fit. Kept, so the same words give the same pattern and everything built
 * from it is built once.
 */
export const withLettering = (pattern: HatPattern, text?: string): HatPattern => {
  const band = pattern.lettering;
  const words = text === undefined ? "" : normalise(text);
  if (!band || !words) return pattern;
  const key = `${pattern.id}::${words}`;
  const known = made.get(key);
  if (known) return known;

  const chart = pattern.charts.find((candidate) => candidate.id === band.chart);
  if (!chart) return pattern;
  const fit = fitLettering(words, chart.rows[band.row - 1].length);
  if (!fit.ok) return pattern;

  const rows = chart.rows.map((row, index) => {
    const line = index - (band.row - 1);
    if (line < 0 || line >= glyphHeight) return row;
    return row.map((cell, x): ChartCell => ({ ...cell, slot: fit.columns[x][line] ? "motif" : "ground" }));
  });
  const lettered: HatPattern = {
    ...pattern,
    charts: pattern.charts.map((candidate) => (candidate === chart ? { ...chart, rows } : candidate)),
    lettering: { ...band, text: words },
  };
  made.set(key, lettered);
  return lettered;
};
