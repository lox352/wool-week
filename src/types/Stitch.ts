import { Point } from "./Point";
import { StitchType } from "./StitchType";
import { SlotId } from "../data/hats/types";

export interface Stitch {
  id: number;
  position: Point;
  /**
   * The stitches this one is worked into, then the stitch before it in the
   * round. An increase has no stitch below it, so it carries only the latter.
   */
  links: number[];
  fixed: boolean;
  type: StitchType;
  /**
   * Which yarn, as a slot rather than a colour. What that slot looks like is
   * the colourway's business, and is decided on the way to the screen, so
   * changing colourway never rebuilds the knitting.
   */
  slot: SlotId;
}
