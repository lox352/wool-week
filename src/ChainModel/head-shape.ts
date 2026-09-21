/**
 * A head to drape a hat over.
 *
 * A ball is the easy version and it shows: a hat settled on one comes out
 * perfectly round, which no hat is. A head is longer front to back than it is
 * ear to ear, fuller at the back of the skull than at the forehead, and domed
 * rather than spherical on top - and a Fair Isle band drawn over that is not
 * the same picture at all, because the pattern is stretched where the skull is
 * full and eased where it is not.
 *
 * The size is not a free choice. A hat's body goes round at one stitch's width
 * per stitch, so the head it fits has that circumference, and everything here
 * is in terms of the radius that gives. The proportions are a head's:
 * Ramanujan's approximation puts an ellipse of 1.12 and 0.86 of a radius at
 * within a percent of the circle of that radius, so a head this shape and a
 * ball of that radius are the same way round - they differ in where the wool
 * has to go, not in how much of it there is.
 */

/** Front to back, across, and up, as multiples of the radius the hat implies. */
const deep = 1.12;
const wide = 0.86;
/**
 * The back of the skull is fuller than the forehead, by about a twentieth
 * either way - which moves wool around the head without asking for any more
 * of it, so the way round is still the hat's own.
 */
const occiput = 1.06;
const forehead = 0.94;

/**
 * How square the head is in profile.
 *
 * An ellipsoid narrows as the square root as it rises, which takes a skull in
 * far too fast: measured against the hat, the top of the body band sat at
 * under six tenths of the head's width and pulled the knitting in with it. A
 * real skull is fuller at the shoulders of the crown and flatter on the
 * vertex than an ellipse, and this is that shape - a superellipse, which at
 * two would be the ellipse and above it stands squarer.
 */
const squareness = 2.7;

export interface Head {
  /** A convex hull's worth of points, as x, y, z triples. */
  points: Float32Array;
  /** How far the widest part is above the cast-on. */
  lift: number;
}

/**
 * Points on a head of this radius, spread evenly by the Fibonacci spiral so a
 * few hundred of them cover it without bunching at the poles.
 *
 * `tall` is the vertical semi-axis: how far the crown stands above the widest
 * part of the skull. `lift` is where that widest part sits above the cast-on,
 * which matters because a hat grips below its widest point - the rib is
 * knitted smaller than the body and is held where it is, so the head has to
 * have narrowed again by the time it reaches it.
 */
export const headShape = (
  radius: number,
  tall: number,
  count = 320,
): Float32Array => {
  const points = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index++) {
    // Evenly spaced in height, and turned by the golden angle each step.
    const y = 1 - (2 * index) / (count - 1);
    const ring = (1 - Math.min(Math.abs(y), 1) ** squareness) ** (1 / squareness);
    const angle = golden * index;

    const across = Math.cos(angle) * ring;
    const round = Math.sin(angle) * ring;
    const front = round < 0 ? round * occiput : round * forehead;

    points[index * 3] = across * radius * wide;
    points[index * 3 + 1] = y * tall;
    points[index * 3 + 2] = front * radius * deep;
  }

  return points;
};

/** How far above the cast-on the widest part of the head sits.
 *
 * A hat is held on by a rib knitted narrower than its body, so at the height
 * of the rib the head must be back down to about the rib's own width. For an
 * ellipsoid that is a fixed fraction of its height, which is what this is. */
export const headLift = (tall: number, brim: number, radius: number): number =>
  tall * (1 - Math.min(brim / radius, 1) ** squareness) ** (1 / squareness);
