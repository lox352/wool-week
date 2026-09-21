import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";

/**
 * How big the hat is, so the camera can be placed once and then left alone.
 *
 * This used to be a prediction, and had to be: the hat's shape was the result
 * of a simulation that had not run yet. It is not any more. Every stitch's
 * position is known before anything is drawn - either from the settled file or
 * from the geometry the pattern was built with - so this measures rather than
 * guesses.
 *
 * Measuring also fixes what the prediction got wrong. It took the radius from
 * the cast-on, on the reasoning that the brim is the widest part of a hat.
 * That is true of a hat knitted straight, but both of these are ribbed at the
 * brim and increased sharply above it - 130 stitches to 162 - so the body is a
 * quarter wider than the brim, and framing to the brim cropped the crown.
 */

export interface HatShape {
  /** Distance from the axis to the widest round. */
  radius: number;
  /** Brim to crown, in the same units as the stitch positions. */
  height: number;
  rounds: number;
}

export const hatShape = (
  stitches: Stitch[],
  rounds: number[][],
  settled?: Point[],
): HatShape => {
  let radius = 0;
  let low = Infinity;
  let high = -Infinity;

  for (const stitch of stitches) {
    // Stitch 0 is the phantom start of the helix and is never drawn.
    if (stitch.id === 0) continue;
    const at = settled?.[stitch.id] ?? stitch.position;
    if (!at) continue;
    radius = Math.max(radius, Math.hypot(at.x, at.z));
    low = Math.min(low, at.y);
    high = Math.max(high, at.y);
  }

  return {
    radius: radius || 1,
    height: Number.isFinite(high - low) ? Math.max(high - low, 1) : 1,
    rounds: rounds.length,
  };
};
