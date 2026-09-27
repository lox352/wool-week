/**
 * The stitches these patterns use.
 *
 * "castOn" is a stitch cast on: the loops the first round is made of, which
 * take nothing from below because there is nothing below.
 *
 * "join" is joining the cast-on into a round - a step, like the turn below.
 * A round is joined by casting on one stitch more than it needs and losing
 * one where its two ends meet, so the cast-on here is one stitch longer than
 * its round: the phantom stitch 0, which nothing is worked into, is the one
 * lost, and the last stitch cast on closes the round in its place. The join
 * comes after the round it closes, usually the cast-on itself.
 *
 * "turn" is not a stitch either, but it is a step: turning the work inside
 * out, between one round and the next. It takes nothing from the round below
 * and leaves nothing behind - where an m1 is nothing to one and a k2tog two
 * to one, a turn is nothing to nothing - but it has its place in the order
 * things are done, so that a knitter works it, and can undo it, like any
 * other step. It belongs to no round.
 *
 * "needles" is a step of the same kind: changing to needles of another size,
 * as a pattern says to between its rib and its body. Nothing to nothing
 * again, and in no round; the stitch carries the size changed to.
 *
 * s2kp and sk2p both take three stitches down to one and are not the same
 * stitch. A centred double decrease slips two together, knits one and passes
 * the two over, so the middle stitch finishes on top and the decrease stands
 * straight; sk2p slips one, knits two together and passes the slipped stitch
 * over, so it leans to the left. A pattern that uses one names it exactly,
 * and the chart draws them differently, so they are kept apart here.
 */
export type StitchType =
  | "castOn"
  | "k1"
  | "p1"
  | "k1tbl"
  | "m1"
  | "kfb"
  | "k2tog"
  | "k2togtbl"
  | "s2kp"
  | "sk2p"
  | "join"
  | "turn"
  | "needles";

/** How many stitches of the round below this one consumes. */
export const consumption: Record<StitchType, number> = {
  castOn: 0,
  k1: 1,
  p1: 1,
  k1tbl: 1,
  m1: 0,
  kfb: 1,
  k2tog: 2,
  k2togtbl: 2,
  s2kp: 3,
  sk2p: 3,
  join: 0,
  turn: 0,
  needles: 0,
};
