import React, { lazy, Suspense } from "react";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { Palette } from "../knitting/palette";
import type { SettleMetrics } from "../helpers/settling";

/**
 * The 3D stage, loaded on demand, in one of two forms.
 *
 * SettlingHat settles the hat in front of you and then, once it is still or
 * once somebody takes hold of it, shows where it came to rest without taking
 * its canvas away. It carries the physics, which at ten thousand stitches is
 * about 245MB of world and a step that takes a second or two, so it stays
 * behind its own lazy boundary.
 *
 * SettledHat is three.js and nothing else, and is what "?settle=0" asks for:
 * the finished shape, immediately, with the physics never fetched at all.
 *
 * The placeholder is exactly the same height as the canvas, so nothing on the
 * page moves when it swaps in.
 */
const SettledHat = lazy(() => import("./SettledHat"));

/** A stable empty list, so a hat with no settled file does not look like a new
 * hat on every render - which would have the stage recomputing ten thousand
 * stitch positions each time the page so much as scrolled. */
const nowhere: Point[] = [];
const SettlingHat = lazy(() => import("./ChainModel"));

export const hatCanvasHeight = 380;

interface HatCanvasProps {
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  progress: number;
  /** How tall a round of this hat is; see roundHeightFor in the engine. */
  roundHeight: number;
  /** Resting positions, when they are known. */
  settled?: Point[];
  /** Settle the hat here and now, rather than showing it already settled. */
  settle?: boolean;
  /** It has stopped settling: show where it came to rest. */
  frozen?: boolean;
  onSettled: (positions: Point[], metrics: SettleMetrics) => void;
  /** Someone has taken hold of the hat; stop settling and show the answer. */
  onGrabbed?: () => void;
  reducedMotion: boolean;
}

const HatCanvas: React.FC<HatCanvasProps> = ({
  settled,
  settle = false,
  frozen = false,
  onSettled,
  onGrabbed,
  ...rest
}) => (
  <div style={{ height: `${hatCanvasHeight}px` }}>
    <Suspense fallback={null}>
      {settle ? (
        <SettlingHat
          {...rest}
          settled={settled}
          frozen={frozen}
          onSettled={onSettled}
          onGrabbed={onGrabbed}
          simulationActive={!frozen}
        />
      ) : (
        <SettledHat {...rest} settled={settled ?? nowhere} />
      )}
    </Suspense>
  </div>
);

export default HatCanvas;
