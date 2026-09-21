import { Point } from "../types/Point";
import { Stitch } from "../types/Stitch";
import { consumption } from "../types/StitchType";

/**
 * How big a stitch came out, measured off a hat.
 *
 * A knitter's tension is two numbers - stitches and rounds to ten
 * centimetres - and between them they say what shape a stitch is. That is
 * the one thing a settled hat has to get right: a hat whose stitches settle
 * too tall is a hat that is too tall, however plausible the rest of it looks.
 *
 * Measured across a band of the plain body rather than over the whole hat,
 * because the crown is meant to pull in and the rib is meant to pull in, and
 * averaging those together says nothing about either.
 */
export interface Gauge {
  /** The rounds measured, 1-based and inclusive. */
  band: [number, number];
  pairs: number;
  /** Mean gap between neighbouring stitches in a round. */
  across: number;
  /** Mean rise from one round to the next. */
  up: number;
  /** across / up, which is what tension says: the shape of a stitch. */
  ratio: number;
  /** What the pattern's own tension asks for. */
  wanted: number;
  /** Mean distance to the stitch below, which is what a joint spans. */
  link: number;
  /** And how much of that is sideways rather than up. */
  lateral: number;
  /** Mean distance from the hat's axis. */
  radius: number;
  /**
   * How much longer a round is than the circle it encloses.
   *
   * One means the round lies on a circle, as the knitting was built. More
   * than one means it wanders in and out on its way round - the fabric is
   * rippling rather than held out - and it is the number that says a hat has
   * gone limp, which neither the tension nor the radius will tell you: a
   * round can keep its stitch gaps exactly and still enclose two thirds of
   * the width it should, by taking a longer way round.
   */
  frill: number;
  /** Spread of the gaps, as a fraction of the mean: how even the fabric is. */
  acrossSpread: number;
  upSpread: number;
}

/**
 * The band of plain body to measure over.
 *
 * The rounds at the hat's full stitch count, less a quarter off each end so
 * that neither the increase below nor the first decrease above is leaning on
 * the measurement.
 */
export const bodyBand = (rounds: number[][]): [number, number] => {
  const widest = rounds.reduce((most, round) => Math.max(most, round.length), 0);
  const body = rounds
    .map((round, index) => ({ round, index }))
    .filter(({ round }) => round.length === widest)
    .map(({ index }) => index);
  if (body.length === 0) return [1, rounds.length];
  const from = body[Math.floor(body.length * 0.25)];
  const to = body[Math.min(Math.floor(body.length * 0.75), body.length - 1)];
  return [from + 1, to + 1];
};

const spread = (values: number[], mean: number) => {
  if (values.length === 0 || mean === 0) return 0;
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length;
  return Math.sqrt(variance) / mean;
};

const mean = (values: number[]) =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;

const gap = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/**
 * Measure a hat, settled or as built.
 *
 * `at` is indexed by stitch id, which is how both the settled files and the
 * physics hand their positions back.
 */
export const measureGauge = (
  stitches: Stitch[],
  rounds: number[][],
  at: Point[],
  wanted: number,
  band = bodyBand(rounds),
): Gauge => {
  const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));
  const across: number[] = [];
  const link: number[] = [];
  const lateral: number[] = [];
  const radii: number[] = [];
  const heights: number[] = [];
  const frills: number[] = [];

  for (let round = band[0]; round <= band[1]; round++) {
    const ids = rounds[round - 1] ?? [];
    let level = 0;
    let counted = 0;
    for (let index = 0; index < ids.length; index++) {
      const here = at[ids[index]];
      if (!here) continue;
      radii.push(Math.hypot(here.x, here.z));
      level += here.y;
      counted++;

      if (index > 0) {
        const before = at[ids[index - 1]];
        if (before) across.push(gap(here, before));
      }

      const stitch = byId.get(ids[index]);
      if (!stitch || consumption[stitch.type] < 1) continue;
      const below = at[stitch.links[0]];
      if (!below) continue;
      link.push(gap(here, below));
      lateral.push(Math.hypot(here.x - below.x, here.z - below.z));
    }
    if (counted > 0) heights.push(level / counted);

    /*
     * The round's own length against the circle it encloses. Its last stitch
     * joins back to its first, so the round is closed and the gap across
     * that join counts too.
     */
    const here = ids.map((id) => at[id]).filter(Boolean);
    if (here.length > 2 && counted > 0) {
      let perimeter = 0;
      for (let index = 0; index < here.length; index++) {
        perimeter += gap(here[index], here[(index + 1) % here.length]);
      }
      const round = mean(here.map((point) => Math.hypot(point.x, point.z)));
      if (round > 0) frills.push(perimeter / (2 * Math.PI * round));
    }
  }

  const rises = heights.slice(1).map((level, index) => level - heights[index]);
  const acrossMean = mean(across);
  const upMean = mean(rises);

  return {
    band,
    pairs: across.length,
    across: acrossMean,
    up: upMean,
    ratio: upMean === 0 ? 0 : acrossMean / upMean,
    wanted,
    link: mean(link),
    lateral: mean(lateral),
    radius: mean(radii),
    frill: mean(frills),
    acrossSpread: spread(across, acrossMean),
    upSpread: spread(rises, upMean),
  };
};
