import { Point } from "../types/Point";
import { adjacentStitchDistance } from "../constants";

/**
 * Block a settled hat.
 *
 * A knitter finishes a hat by washing it and easing it out over a board or a
 * balloon to the measurements the pattern gives, then leaving it to dry that
 * way. Wool holds the shape it dries in, which is why blocking is a step in
 * the pattern rather than a nicety: the hat off the needles and the hat in
 * the photograph are not the same shape.
 *
 * The model has the same problem and can have the same answer. A rope joint
 * caps how far apart two stitches may be and does nothing at all to stop them
 * closing up, so a settled round keeps nearly all of its stitch gaps and
 * still encloses a third less than it should - it spends the yarn wandering
 * in and out on the way round instead of on going round. No rope length
 * reaches that, because a rope has nothing to say about the path between its
 * ends, which is why the sweep finds the same ripple at every rope length
 * tried.
 *
 * Blocking says where the round should have been: on a circle, level, as wide
 * as its own stitches make it. n stitches at their full width go round a
 * circle of circumference n*a and no further, so that radius is not a number
 * anyone chose - it is the width the knitting has. Each round gets its own,
 * so a crown round of nine stitches is eased out to what nine stitches make
 * and the taper stays.
 *
 * What it keeps from the settle is the one thing the settle is good at and
 * the geometry is not: how high each round ended up, and so how the hat
 * stands and where the crown turns over.
 */

/** `amount` is how far to take it: one for blocked to its measurements, less
 * for a hat only damped and patted into shape. `stitchWidth` may be one width
 * for the whole hat, or one per round where the pattern knits in more than
 * one fabric. */
export const blockHat = (
  rounds: number[][],
  at: Point[],
  amount = 1,
  stitchWidth: number | number[] = adjacentStitchDistance,
): Point[] => {
  const out = at.map((point) => ({ ...point }));
  const widthOf = (round: number) =>
    (Array.isArray(stitchWidth) ? stitchWidth[round] : stitchWidth) ??
    adjacentStitchDistance;

  for (const [round, ids] of rounds.entries()) {
    if (ids.length < 3) continue;
    const ring = ids.map((id) => at[id]).filter(Boolean);
    if (ring.length < 3) continue;

    // As wide as its own stitches make it, and as high as it settled.
    const wanted = (ids.length * widthOf(round)) / (2 * Math.PI);
    const level = ring.reduce((total, point) => total + point.y, 0) / ring.length;

    for (const id of ids) {
      const here = at[id];
      const point = out[id];
      if (!here || !point) continue;
      const away = Math.hypot(here.x, here.z);
      const scale = away < 1e-6 ? 1 : 1 + amount * (wanted / away - 1);
      point.x = here.x * scale;
      point.z = here.z * scale;
      point.y = here.y + amount * (level - here.y);
    }
  }

  return out;
};
