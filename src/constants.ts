/** One stitch's width, in the units the physics works in. */
export const adjacentStitchDistance = 2;
/** And its height. Knitted stitches are wider than they are tall. */
export const verticalStitchDistance = 1.6;

export const settleDamping = 3;
export const settleTimeStep = 0.15;
export const solverIterations = 20;
export const settleSubsteps = 2;
/** Check the budget between indivisible physics steps. */
export const settleStepBudgetMs = 16;
export const restMotionThreshold = 0.15;
export const minimumSettleFrames = 10;
export const settleRestSeconds = 2;
