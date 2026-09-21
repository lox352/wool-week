import { createRef, useEffect, useMemo, useRef } from "react";
import { RapierRigidBody } from "@react-three/rapier";
import { Stitch } from "../types/Stitch";
import { Palette, rgbOf, yarnFor } from "../knitting/palette";
import { adjacentStitchDistance, verticalStitchDistance } from "../constants";
import { SettleMetrics } from "../helpers/settling";
import StitchBody from "./StitchBody";
import StitchInstances from "./StitchInstances";
import Settler from "./Settler";
import Link from "./Link";
import { Point } from "../types/Point";

export interface StitchPhysicsProps {
  stitches: Stitch[];
  palette: Palette;
  /** Id of the last stitch worked; earlier stitches are shown in their wool. */
  progress: number;
  /** Resting positions, once the hat has settled, so it is only settled once. */
  settled?: Point[];
  onSettled?: (positions: Point[], metrics: SettleMetrics) => void;
  simulationActive: boolean;
  reducedMotion: boolean;
}

/**
 * The hat as a physical object.
 *
 * Every stitch is a rigid body joined to its neighbours by rope joints, and
 * the Settler steps the world until the tube has relaxed into a hat. Once it
 * is still the resting positions are handed back, so a project settles once
 * and is shown as it was on every visit afterwards.
 *
 * What the colours mean here is the difference from the other two hat sites:
 * they sweep a finished design onto a finished hat, and this one shows how far
 * you have got. A stitch you have worked is in its wool; one you have not is
 * pale, like the pattern waiting to be knitted. So the hat fills in as you go.
 *
 * The colours live in a Float32Array shared with the mesh rather than in React
 * state: one update per frame, not one per stitch.
 */
export default function StitchPhysics({
  stitches,
  palette,
  progress,
  settled,
  onSettled,
  simulationActive,
  reducedMotion,
}: StitchPhysicsProps) {
  const stitchRefs = useRef<React.RefObject<RapierRigidBody>[]>([]);
  if (!stitchRefs.current.length) {
    stitchRefs.current = stitches.map(() => createRef<RapierRigidBody>());
  }

  // Stitch 0 is the phantom start of the helix and is never drawn.
  const drawn = useMemo(() => stitches.filter((s) => s.id > 0), [stitches]);

  const colours = useRef<Float32Array | null>(null);
  const worked = useRef<Float32Array | null>(null);

  useEffect(() => {
    colours.current = new Float32Array(
      drawn.flatMap((stitch) =>
        rgbOf(yarnFor(palette, stitch.slot).hex).map((c) => c / 255),
      ),
    );
  }, [drawn, palette]);

  useEffect(() => {
    worked.current = new Float32Array(
      drawn.map((stitch) => (stitch.id <= progress ? 1 : 0)),
    );
  }, [drawn, progress]);

  return (
    <>
      {!settled && onSettled && (
        <Settler
          active={simulationActive}
          stitchRefs={stitchRefs}
          onSettled={onSettled}
        />
      )}
      {!settled &&
        stitches.map((stitch) => (
          <StitchBody
            key={stitch.id}
            rigidBodyRef={stitchRefs.current[stitch.id]}
            position={stitch.position}
            fixed={stitch.fixed}
          />
        ))}
      <StitchInstances
        stitches={stitches}
        settled={settled}
        moving={simulationActive && !settled}
        stitchRefs={stitchRefs}
        colours={colours}
        worked={worked}
        reducedMotion={reducedMotion}
      />
      {!settled &&
        stitches.flatMap((stitch) =>
          stitch.links.map((link) => (
            <Link
              key={`${stitch.id}-${link}`}
              bodyA={stitchRefs.current[stitch.id]}
              bodyB={stitchRefs.current[link]}
              maxLength={
                stitch.id - link === 1
                  ? adjacentStitchDistance
                  : verticalStitchDistance
              }
            />
          )),
        )}
    </>
  );
}
