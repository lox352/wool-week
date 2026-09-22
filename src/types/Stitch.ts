import { Point } from "./Point";
import { StitchType } from "./StitchType";

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
   * Which yarn, as a palette key rather than a colour. Usually a slot letter;
   * for a stitch worked from a chart drawn in parts it is the part and the
   * row it came from - see partKey. Either way what it looks like is the
   * colourway's business, decided on the way to the screen, so changing
   * colourway never rebuilds the knitting.
   */
  slot: string;
}
