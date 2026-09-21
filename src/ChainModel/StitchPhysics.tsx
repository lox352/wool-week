import { createRef, useMemo, useRef } from "react";
import { RapierRigidBody } from "@react-three/rapier";
import { Stitch } from "../types/Stitch";
import { Palette, rgbOf, yarnFor } from "../knitting/palette";
import { Tuning, ropeLength } from "./tuning";
import { SettleMetrics } from "../helpers/settling";
import StitchBody from "./StitchBody";
import StitchInstances from "./StitchInstances";
import Settler from "./Settler";
import { RopeLink, SpringLink } from "./Link";
import { Point } from "../types/Point";

export interface StitchPhysicsProps {
  stitches: Stitch[];
  palette: Palette;
  /** Id of the last stitch worked; earlier stitches are shown in their wool. */
  progress: number;
  onSettled: (positions: Point[], metrics: SettleMetrics) => void;
  simulationActive: boolean;
  reducedMotion: boolean;
  tuning: Tuning;
  /** How tall a round of this hat is; see roundHeightFor in the engine. */
  roundHeight: number;
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
  onSettled,
  simulationActive,
  reducedMotion,
  tuning,
  roundHeight,
}: StitchPhysicsProps) {
  const stitchRefs = useRef<React.RefObject<RapierRigidBody>[]>([]);
  if (!stitchRefs.current.length) {
    stitchRefs.current = stitches.map(() => createRef<RapierRigidBody>());
  }

  // Stitch 0 is the phantom start of the helix and is never drawn.
  const drawn = useMemo(() => stitches.filter((s) => s.id > 0), [stitches]);

  const positionAt = useMemo(
    () => (id: number) =>
      stitchRefs.current[id]?.current?.translation() ?? stitches[id]?.position,
    [stitches],
  );

  const colours = useMemo(
    () =>
      new Float32Array(
        drawn.flatMap((stitch) =>
          rgbOf(yarnFor(palette, stitch.slot).hex).map((c) => c / 255),
        ),
      ),
    [drawn, palette],
  );

  const worked = useMemo(
    () => new Float32Array(drawn.map((stitch) => (stitch.id <= progress ? 1 : 0))),
    [drawn, progress],
  );

  return (
    <>
      <Settler
        active={simulationActive}
        stitchRefs={stitchRefs}
        onSettled={onSettled}
        tuning={tuning}
      />
      {stitches.map((stitch) => (
        <StitchBody
          key={stitch.id}
          rigidBodyRef={stitchRefs.current[stitch.id]}
          position={stitch.position}
          fixed={stitch.fixed}
          damping={tuning.damping}
          radius={tuning.colliderRadius}
        />
      ))}
      <StitchInstances
        stitches={stitches}
        positionAt={positionAt}
        moving={simulationActive}
        colours={colours}
        worked={worked}
        reducedMotion={reducedMotion}
      />
      {stitches.flatMap((stitch) =>
        stitch.links.map((link) => {
          const other = stitches[link];
          const startsAt = other
            ? Math.hypot(
                stitch.position.x - other.position.x,
                stitch.position.y - other.position.y,
                stitch.position.z - other.position.z,
              )
            : 0;
          const Joint = tuning.joints === "spring" ? SpringLink : RopeLink;
          return (
            <Joint
              key={`${stitch.id}-${link}`}
              bodyA={stitchRefs.current[stitch.id]}
              bodyB={stitchRefs.current[link]}
              length={ropeLength(tuning, stitch.id - link, startsAt, roundHeight)}
              stiffness={tuning.stiffness}
              damping={tuning.springDamping}
            />
          );
        }),
      )}
    </>
  );
}
