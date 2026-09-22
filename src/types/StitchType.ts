/**
 * The stitches these patterns use.
 *
 * "join" is not a stitch a knitter works; it is the seam where the cast-on
 * row closes into a round, and it exists so the tube is a single chain.
 *
 * s2kp and sk2p both take three stitches down to one and are not the same
 * stitch. A centred double decrease slips two together, knits one and passes
 * the two over, so the middle stitch finishes on top and the decrease stands
 * straight; sk2p slips one, knits two together and passes the slipped stitch
 * over, so it leans to the left. A pattern that uses one names it exactly,
 * and the chart draws them differently, so they are kept apart here.
 */
export type StitchType =
  | "k1"
  | "p1"
  | "k1tbl"
  | "m1"
  | "k2tog"
  | "s2kp"
  | "sk2p"
  | "join";

/** How many stitches of the round below this one consumes. */
export const consumption: Record<StitchType, number> = {
  k1: 1,
  p1: 1,
  k1tbl: 1,
  m1: 0,
  k2tog: 2,
  s2kp: 3,
  sk2p: 3,
  join: 0,
};
