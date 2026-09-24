import { Stitch } from "../types/Stitch";
import { ChartLayout, isSecondLoop } from "./layout";
import { Mark, forkMark, markFor } from "../helpers/stitch-marks";

/**
 * The mark a stitch carries on the chart, which can depend on its neighbours.
 *
 * Nearly always the stitch's own. The exception is a KFB: one instruction
 * that makes two stitches, so it is drawn as one mark across both cells - a
 * fork from the stitch below to each of them - and the new stitch carries
 * nothing of its own, being made rather than worked.
 */
export const markAt = (
  stitch: Stitch,
  byId: Map<number, Stitch>,
  layout: ChartLayout,
): Mark | undefined => {
  if (isSecondLoop(stitch, byId)) return undefined;
  if (stitch.type !== "kfb") return markFor(stitch.type);

  const at = layout.cells.get(stitch.id);
  const made = byId.get(stitch.id + 1);
  const madeAt = made && isSecondLoop(made, byId) ? layout.cells.get(made.id) : undefined;
  if (!at || !madeAt || madeAt.round !== at.round) return undefined;
  // Column 1 is at the right, so a higher column is further left.
  const centre = (column: number) => 0.5 + at.column - column;
  const parentAt = layout.cells.get(stitch.links[0]);
  return forkMark(centre(parentAt?.column ?? at.column), [0.5, centre(madeAt.column)]);
};
