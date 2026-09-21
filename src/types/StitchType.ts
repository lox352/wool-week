/**
 * The stitches these patterns use.
 *
 * "join" is not a stitch a knitter works; it is the seam where the cast-on
 * row closes into a round, and it exists so the tube is a single chain.
 */
export type StitchType =
  | "k1"
  | "p1"
  | "k1tbl"
  | "m1"
  | "k2tog"
  | "s2kp"
  | "join";

/** How many stitches of the round below this one consumes. */
export const consumption: Record<StitchType, number> = {
  k1: 1,
  p1: 1,
  k1tbl: 1,
  m1: 0,
  k2tog: 2,
  s2kp: 3,
  join: 0,
};
