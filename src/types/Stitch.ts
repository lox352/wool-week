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
  /**
   * How wide this stitch is, and how tall its round, where the pattern knits
   * in more than one fabric. Left off, they are the hat's own - see
   * constants, engine's roundHeightFor, and HatPattern.tensions.
   */
  width?: number;
  rise?: number;
  /**
   * The size of needle it is worked on, in millimetres, as the pattern gives
   * it for the size being knitted. On a "needles" step, the size changed to.
   */
  needles?: number;
}

/**
 * Whether a stitch is fabric: something drawn, on the chart or the hat. The
 * phantom stitch 0 that starts the helix is not, and nor is a step - a turn or
 * a change of needles - which is part of the knitting but makes no stitch.
 */
export const isStep = (stitch: Stitch): boolean =>
  stitch.type === "turn" || stitch.type === "needles";

export const isFabric = (stitch: Stitch): boolean => stitch.id !== 0 && !isStep(stitch);
