import React, { lazy, Suspense } from "react";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { Palette } from "../knitting/palette";
import type { SettleMetrics } from "../helpers/settling";

/**
 * The 3D stage, loaded on demand, in one of two forms.
 *
 * Almost always SettledHat, which is three.js and nothing else: it draws the
 * hat where it came to rest, or, for a hat not yet settled, where the pattern
 * put it. The physics stage behind SettlingHat is only ever asked for by the
 * offline settle script, because at ten thousand stitches a single step takes
 * a second or two and the whole thing costs about 245MB - so it sits behind
 * its own boundary and a browser never fetches it.
 *
 * The placeholder is exactly the same height as the canvas, so nothing on the
 * page moves when it swaps in.
 */
const SettledHat = lazy(() => import("./SettledHat"));
const SettlingHat = lazy(() => import("./ChainModel"));

export const hatCanvasHeight = 380;

interface HatCanvasProps {
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  progress: number;
  /** Resting positions, when they are known. */
  settled?: Point[];
  /** Settle the hat here and now. Only the offline settle script asks. */
  settle?: boolean;
  onSettled: (positions: Point[], metrics: SettleMetrics) => void;
  reducedMotion: boolean;
}

const HatCanvas: React.FC<HatCanvasProps> = ({
  settled,
  settle = false,
  onSettled,
  ...rest
}) => (
  <div style={{ height: `${hatCanvasHeight}px` }}>
    <Suspense fallback={null}>
      {settle ? (
        <SettlingHat {...rest} onSettled={onSettled} simulationActive />
      ) : (
        <SettledHat {...rest} settled={settled ?? []} />
      )}
    </Suspense>
  </div>
);

export default HatCanvas;
