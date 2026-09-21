import { StitchType } from "../types/StitchType";

/**
 * The marks a chart prints in a cell, as geometry rather than as a picture.
 *
 * The symbols are the ones these patterns use: a dot for a purl, a leaning
 * stroke for a decrease that leans, and a three-legged chevron for the centred
 * double decrease, whose middle leg says the middle stitch finishes on top.
 * Every mark is symmetric about the middle of its cell, so it lands square
 * whatever size the cell is drawn at.
 *
 * Given as points in a unit cell so the chart can draw them at whatever size
 * it likes, and so nothing here has to know it is being drawn onto a canvas.
 */

/** How far a mark keeps clear of the cell's edges, as a fraction of a cell. */
const inset = 0.22;

const near = inset;
const far = 1 - inset;
const mid = 0.5;

export interface Mark {
  /** Each entry is a run of points to be joined up. */
  strokes?: [number, number][][];
  /** A filled circle, as centre and radius, in the same unit cell. */
  dot?: { x: number; y: number; r: number };
}

const marks: Partial<Record<StitchType, Mark>> = {
  p1: { dot: { x: mid, y: mid, r: 0.14 } },
  // A twisted stitch: the two legs crossed.
  k1tbl: {
    strokes: [
      [
        [near, far],
        [far, near],
      ],
      [
        [near, near],
        [far, far],
      ],
    ],
  },
  k2tog: {
    strokes: [
      [
        [near, far],
        [far, near],
      ],
    ],
  },
  s2kp: {
    strokes: [
      [
        [near, far],
        [mid, near],
        [far, far],
      ],
      [
        [mid, near],
        [mid, far],
      ],
    ],
  },
  // An increase makes a stitch out of nothing: the bar it is made from.
  m1: {
    strokes: [
      [
        [near, mid],
        [far, mid],
      ],
    ],
  },
};

export const markFor = (type: StitchType): Mark | undefined => marks[type];

export const markLabels: Partial<Record<StitchType, string>> = {
  p1: "purl",
  k1tbl: "knit through the back loop",
  k2tog: "knit two together",
  s2kp: "slip 2, knit 1, pass slipped stitches over",
  m1: "make one",
};
