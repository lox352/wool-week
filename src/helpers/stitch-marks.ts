import { StitchType } from "../types/StitchType";

/**
 * The marks a chart prints in a cell, in one place, so the chart on screen
 * and the chart on paper cannot drift apart.
 *
 * The symbols are the ones these patterns use: a dot for a purl, a leaning
 * stroke for a decrease that leans, and a three-legged chevron for the
 * centred double decrease, whose middle leg says the middle stitch finishes
 * on top. Every mark is symmetric about the middle of its cell, so it lands
 * square whatever size the cell is drawn at.
 */

/** How far a mark keeps clear of the cell's edges, as a fraction of a cell. */
const inset = 0.22;

const round = (value: number) => Math.round(value * 1000) / 1000;

export interface Mark {
  /** Path data for a stroked mark. */
  path?: string;
  /** Centre and radius for a filled dot. */
  dot?: { cx: number; cy: number; r: number };
}

export const markFor = (
  type: StitchType,
  x = 0,
  y = 0,
  size = 1,
): Mark | undefined => {
  const left = round(x + inset * size);
  const right = round(x + (1 - inset) * size);
  const top = round(y + inset * size);
  const bottom = round(y + (1 - inset) * size);
  const middleX = round(x + size / 2);
  const middleY = round(y + size / 2);

  switch (type) {
    case "p1":
      return { dot: { cx: middleX, cy: middleY, r: round(size * 0.14) } };
    case "k1tbl":
      // A twisted stitch: the two legs crossed.
      return {
        path:
          `M${left} ${bottom}L${right} ${top}` +
          `M${left} ${top}L${right} ${bottom}`,
      };
    case "k2tog":
      return { path: `M${left} ${bottom}L${right} ${top}` };
    case "s2kp":
      return {
        path:
          `M${left} ${bottom}L${middleX} ${top}L${right} ${bottom}` +
          `M${middleX} ${top}L${middleX} ${bottom}`,
      };
    case "m1":
      // An increase makes a stitch out of nothing; the bar it is made from.
      return { path: `M${left} ${middleY}L${right} ${middleY}` };
    default:
      return undefined;
  }
};

export const markLabels: Partial<Record<StitchType, string>> = {
  p1: "purl",
  k1tbl: "knit through the back loop",
  k2tog: "knit two together",
  s2kp: "slip 2, knit 1, pass slipped stitches over",
  m1: "make one",
};
