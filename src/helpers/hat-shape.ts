import { Stitch } from "../types/Stitch";
import { verticalStitchDistance } from "../constants";

/**
 * How big the hat will be once it has settled, worked out before it has.
 *
 * The camera needs this up front. Framing from the hat's measured bounds meant
 * moving the camera when the shape changed, and any movement there reads badly:
 * either a jump, or an ease that fights you if you try to turn the hat while it
 * is still going.
 *
 * Two of the three numbers are exact rather than predicted: the radius is the
 * cast-on circle, taken straight from the stitches, and the cast-on is pinned
 * in place and is the widest part of the hat; and the round count comes from
 * the pattern. Only the height is predicted, because how far the tube inflates
 * is the result of the simulation.
 */

export interface HatShape {
  radius: number;
  /** Brim to crown, in the same units as the stitch positions. */
  height: number;
  rounds: number;
}

/**
 * Fitted against the same measurements the other two hat sites use: a tube of
 * this radius and this much fabric settles to roughly this height. It predicts
 * framing only, and never touches the physics.
 */
const settledHeight = (radius: number, rounds: number): number => {
  const fabric = rounds * verticalStitchDistance;
  return Math.min(fabric, radius * 0.869 + fabric * 0.52);
};

export const predictHatShape = (
  stitches: Stitch[],
  rounds: number[][],
): HatShape => {
  const castOn = rounds[0]?.length ?? stitches.length;
  const first = stitches.find((stitch) => stitch.id === 1) ?? stitches[0];
  const radius = first
    ? Math.hypot(first.position.x, first.position.z)
    : castOn / (2 * Math.PI);
  return {
    radius,
    height: settledHeight(radius, rounds.length),
    rounds: rounds.length,
  };
};
