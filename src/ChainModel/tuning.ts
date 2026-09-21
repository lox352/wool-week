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
  /** Upward, as the other two hat sites have it: the hat inflates. */
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
  const base = span === 1 ? adjacentStitchDistance : roundHeight;
  if (tuning.ropes === "fixed") return base * tuning.ropeSlack;
  return Math.max(base, startsAt) * tuning.ropeSlack;
};
