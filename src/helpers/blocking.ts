import { Point } from "../types/Point";
import { adjacentStitchDistance } from "../constants";

/**
 * Block a settled hat.
 *
 * A knitter finishes a hat by washing it and pulling it out to the
 * measurements the pattern gives, over a board or a balloon, and leaving it
 * to dry that way. Knitted fabric holds whatever shape it is dried in, which
 * is why blocking is a step in the pattern rather than a nicety - the hat off
 * the needles and the hat in the photograph are not the same shape.
 *
 * The model has the same problem and can have the same answer. A rope joint
 * caps how far apart two stitches may be and does nothing to stop them
 * closing up, so a settled round keeps its stitch gaps and takes a longer way
 * round than the circle it should enclose: it ripples. But the ropes already
 * know what that circle is - n stitches on ropes of length a enclose at most
 * a circle of circumference n*a, and that is exactly the circumference the
 * knitting has - so every round can be pulled back out to it, keeping the
 * height the settle gave it.
 *
 * `amount` is how far to pull: one for a hat blocked to its measurements,
 * less for one that has only been damped and patted into shape.
 */
export const blockHat = (
  rounds: number[][],
  at: Point[],
  amount = 1,
  stitchWidth = adjacentStitchDistance,
): Point[] => {
  const out = at.map((point) => ({ ...point }));

  for (const ids of rounds) {
    if (ids.length < 3) continue;
    /*
     * As wide as this round's own stitches allow, which is what makes this
     * blocking rather than a cylinder: a crown round has nine stitches and
     * is pulled out to the circle nine stitches make, so the taper stays.
     */
    const wanted = (ids.length * stitchWidth) / (2 * Math.PI);
    for (const id of ids) {
      const point = out[id];
      if (!point) continue;
      const here = Math.hypot(point.x, point.z);
      if (here < 1e-6) continue;
      const scale = 1 + amount * (wanted / here - 1);
      point.x *= scale;
      point.z *= scale;
    }
  }

  return out;
};
