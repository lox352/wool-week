/**
 * The physics settings, and a way to try different ones.
 *
 * Settling a hat has a lot of dials on it - the step size, how hard the solver
 * works, how much the wool is allowed to stretch - and the only way to know
 * which of them matter is to turn them and measure. So the defaults live here
 * and the settle harness can override any of them from the query string.
 *
 * Nothing but the harness ever does: the site draws hats that are already
 * settled, so this is only read on the path behind ?settle=1.
 */
import {
  adjacentStitchDistance,
  minimumSettleFrames,
  restMotionThreshold,
  settleDamping,
  settleRestSeconds,
  settleStepBudgetMs,
  settleSubsteps,
  settleTimeStep,
  solverIterations,
  verticalStitchDistance,
} from "../constants";

/*
 * Who collides with whom.
 *
 * Rapier packs this into one number: the top sixteen bits are the groups a
 * body is in, the bottom sixteen the groups it will collide with. The
 * stitches used to be given 0b0010, which reads as no groups at all and a
 * filter of group two - so they belonged to nothing and collided with
 * nothing, and a head put inside the hat was passed straight through. Worth
 * knowing before reading any result that depended on it.
 *
 * Stitches are group one and collide only with group two, which is the head.
 * Not with each other: ten thousand of them, and a stitch is a ball of radius
 * 0.02 in a fabric whose stitches are two apart, so they would never touch
 * anyway and the broad phase would be paying for the privilege.
 */
export const stitchGroup = 0b0001;
export const headGroup = 0b0010;
export const stitchCollisions = (stitchGroup << 16) | headGroup;
export const headCollisions = (headGroup << 16) | stitchGroup;

export interface Tuning {
  timeStep: number;
  iterations: number;
  substeps: number;
  damping: number;
  /** Mean per-stitch motion below which the hat counts as still. */
  restThreshold: number;
  restSeconds: number;
  minimumFrames: number;
  /**
   * Upward, so the hat is held at the cast-on and blown out rather than
   * falling in a heap: there is nothing inside these hats to hold them up.
   *
   * Earth's, in the units the hat is built in. What that buys is not realism
   * but determinism. Under a gentler gravity the joints to the round below
   * never go taut - they rested at 0.92 of their length on one hat and 0.99
   * on the other - so the hat kept whatever shape it happened to fall into,
   * and two hats built the same way settled differently. At 9.81 every one of
   * them is taut to three decimal places, and the shape stops being an
   * accident and becomes a consequence of the rope lengths.
   *
   *   gravity  tension  wanted  rounds taut  (Aal Ower Toorie)
   *         1    1.169   1.097         0.92
   *      9.81    1.052   1.097         1.00
   *
   * See scripts/gauge.mjs, which settles a hat and measures what it came out
   * as, and the pressure below, which is what closes the rest of that gap.
   */
  gravity: number;
  stepBudgetMs: number;
  colliderRadius: number;
  /**
   * How long a joint may be.
   *
   * "fixed" is one stitch's width or height, whichever the joint spans, which
   * is what the sibling sites use. "derived" lets a joint be as long as the
   * pattern's own geometry already makes it, which matters here because these
   * crowns decrease faster than inextensible yarn can reach: sixteen rounds of
   * fabric asked to cover twice their length in radius. Under "fixed" a
   * twentieth of the joints start over-stretched, some at six times their
   * limit, and the solver opens by yanking them.
   */
  ropes: "fixed" | "derived";
  ropeSlack: number;
  /**
   * How long a joint may be, span by span.
   *
   * A rope caps how far apart two stitches may be and does nothing at all to
   * stop them closing up, so a hat built with every joint already taut - which
   * is exactly what these are - can only ever settle smaller than it was
   * built. Whichever way the force pulls, the other direction collapses: pull
   * upwards and the rounds close in, and the fabric comes out taller and
   * narrower than the tension says.
   *
   * Shortening the joints to the round below is the lever that puts that
   * back, because the ratio of the two is what tension means. These are
   * separate so the sweep can move one without the other.
   */
  roundSlack: number;
  stitchSlack: number;
  /**
   * What holds a stitch to its neighbours.
   *
   * "rope" is yarn that cannot be stretched and offers nothing against being
   * squashed. "spring" is yarn that pulls back either way: it has a length it
   * wants to be, and resists being shortened as well as lengthened, which is
   * the thing a rope cannot do and the reason a rope hat goes limp.
   */
  joints: "rope" | "spring";
  stiffness: number;
  springDamping: number;
  /**
   * The head the hat is on, or 0 for none.
   *
   * With one of these the hat can be hung the way a hat actually hangs -
   * gravity downwards, draped over something - instead of being blown upwards
   * from the inside by a gravity that points the wrong way. Or, with gravity
   * still pointing up, it is a ball in an upside-down bag: the hat is held at
   * the cast-on and blown out over something that stops it closing in.
   *
   * The radius is not really a choice. A hat's body goes round at one
   * stitch's width per stitch, so the head that fits it has that
   * circumference - for the Aal Ower Toorie, 162 stitches two units wide,
   * which is a radius of 51.6.
   */
  headRadius: number;
  /** "ball", or a head: longer front to back, fuller behind, domed on top. */
  head: "ball" | "head";
  /** How far the crown of the head stands above its widest part. */
  headTall: number;
  /**
   * An outward push from the axis, as an acceleration, so it is in the same
   * units as gravity and can be read against it.
   *
   * Without it a settled round keeps nearly all of its stitch gaps - 1.92 of
   * a possible 2.00 - and still encloses a third less than the knitting does,
   * because it spends the yarn wandering in and out on the way round rather
   * than on going round. A rope cannot see that: it caps how far apart two
   * stitches may be and has nothing to say about the path between them, which
   * is why the ripple measures the same at every rope length from 0.94 to
   * 1.00, and why springs do not help either.
   *
   * The ropes across a round do know how wide it should be, though. n
   * stitches on ropes of length a enclose at most a circle of circumference
   * n*a, and that is exactly the circumference the knitting has. So this
   * pushes them out to it. It cannot overshoot, because each round is still
   * held by its own stitch count, and the crown keeps its taper because a
   * crown round has fewer stitches to be held out by.
   *
   *   pressure  tension  wanted  frill  radius of 51.6
   *          0    1.052   1.097   1.36            36.4
   *          2    1.080   1.097   1.24            41.2
   *          5    1.089   1.097   1.11            46.0
   *         20    1.104   1.097   1.00            51.9
   *
   * Five, rather than the twenty that measures best: past about five every
   * round below the crown is pushed to its stop at once and the hat comes out
   * a drum, flat on top with a hard shoulder. Five keeps the crown domed and
   * is still within a percent of the tension the pattern asks for.
   */
  pressure: number;
}

export const defaultTuning: Tuning = {
  timeStep: settleTimeStep,
  iterations: solverIterations,
  substeps: settleSubsteps,
  damping: settleDamping,
  restThreshold: restMotionThreshold,
  restSeconds: settleRestSeconds,
  minimumFrames: minimumSettleFrames,
  gravity: 9.81,
  stepBudgetMs: settleStepBudgetMs,
  colliderRadius: 0.02,
  ropes: "fixed",
  ropeSlack: 1,
  roundSlack: 1,
  stitchSlack: 1,
  joints: "rope",
  stiffness: 200,
  springDamping: 20,
  headRadius: 0,
  head: "ball",
  headTall: 60,
  pressure: 5,
};

const numbers: (keyof Tuning)[] = [
  "timeStep",
  "iterations",
  "substeps",
  "damping",
  "restThreshold",
  "restSeconds",
  "minimumFrames",
  "gravity",
  "stepBudgetMs",
  "colliderRadius",
  "ropeSlack",
  "roundSlack",
  "stitchSlack",
  "stiffness",
  "springDamping",
  "headRadius",
  "headTall",
  "pressure",
];

/** Reads overrides out of the hash's query string, e.g. "#/hat/x?settle=1&iterations=8". */
export const tuningFromUrl = (): Tuning => {
  if (typeof window === "undefined") return defaultTuning;
  const params = new URLSearchParams(window.location.hash.split("?")[1] ?? "");
  const tuning = { ...defaultTuning };
  for (const key of numbers) {
    const raw = params.get(key);
    if (raw === null) continue;
    const value = Number(raw);
    if (Number.isFinite(value)) (tuning[key] as number) = value;
  }
  const ropes = params.get("ropes");
  if (ropes === "fixed" || ropes === "derived") tuning.ropes = ropes;
  const joints = params.get("joints");
  if (joints === "rope" || joints === "spring") tuning.joints = joints;
  const head = params.get("head");
  if (head === "ball" || head === "head") tuning.head = head;
  return tuning;
};

/**
 * How long the joint between two stitches may be.
 *
 * A joint to the stitch immediately before spans a stitch's width; one to the
 * round below spans its height. Under "derived" a joint that the pattern
 * already makes longer than that keeps the length it starts with, so the hat
 * begins in a state the solver can actually hold rather than one it has to
 * fight its way out of.
 */
export const ropeLength = (
  tuning: Tuning,
  span: number,
  startsAt: number,
  roundHeight = verticalStitchDistance,
): number => {
  const across = span === 1;
  const base = across ? adjacentStitchDistance : roundHeight;
  const slack =
    tuning.ropeSlack * (across ? tuning.stitchSlack : tuning.roundSlack);
  if (tuning.ropes === "fixed") return base * slack;
  return Math.max(base, startsAt) * slack;
};
