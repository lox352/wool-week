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
   * Upward, so the hat inflates rather than falling in a heap.
   *
   * Much gentler here than on the sibling sites, and the bench says why. They
   * start from a plain cylinder and need real force to blow it out into a
   * dome. These hats already start as the shape the pattern describes, so
   * gravity has nothing to add and only pulls them out of shape: a rope joint
   * caps how far apart two stitches may be but nothing stops a round closing
   * up, so a hard pull upwards is paid for out of the hat's circumference.
   *
   *   gravity  settles  tall:wide  width kept   (Aal Ower Toorie, built 1.16)
   *         0      19s       0.92         97%
   *         1      37s       0.98         95%
   *         2     110s       1.36         81%
   *      9.81      62s       1.42         80%
   *
   * Somewhere between 1 and 2 it starts trading width for height and finishes
   * as a tall thin cone whose widest point is the one round that is pinned.
   * Below that it keeps the circumference the knitting actually has.
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
   * The head the hat is on, as a sphere, or 0 for none.
   *
   * With one of these the hat can be hung the way a hat actually hangs -
   * gravity downwards, draped over something - instead of being blown upwards
   * from the inside by a gravity that points the wrong way.
   */
  headRadius: number;
  /**
   * An outward push from the axis, as an acceleration, so it is in the same
   * units as gravity and can be read against it.
   *
   * The ropes across a round already know how wide that round should be: n
   * stitches joined by ropes of length a can be no wider than a circle of
   * circumference n*a, which is exactly the circumference the knitting has.
   * Nothing ever pushes a round out to it, though, so every round settles
   * narrower than it was knitted and the hat comes out small. This pushes.
   *
   * It is a cheap stand-in for a head - or for the hat being worn at all -
   * and unlike a head it cannot be got around by the crown, because each
   * round is still capped by its own stitch count. So the crown keeps its
   * taper while the body fills out.
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
  gravity: 1,
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
  pressure: 0,
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
