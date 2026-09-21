import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { BallCollider, ConvexHullCollider, Physics, RigidBody } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { headCollisions, tuningFromUrl } from "./tuning";
import { headLift, headShape } from "./head-shape";
import { hatShape } from "../helpers/hat-shape";
import { adjacentStitchDistance } from "../constants";
import FrameHat, { OrbitLike } from "./FrameHat";
import StitchPhysics, { StitchPhysicsProps } from "./StitchPhysics";

export type ChainModelProps = Omit<StitchPhysicsProps, "tuning"> & {
  rounds: number[][];
};

/**
 * The 3D stage: camera, controls, and the world the hat settles in.
 *
 * The camera is placed once, from the size the hat is predicted to be, and
 * then left alone; nothing moves it but the person looking. The canvas is
 * transparent so the page's own paper shows through. Rapier is paused and
 * stepped by the Settler, so the settle comes out the same on every machine.
 */
export default function ChainModel({ rounds, ...props }: ChainModelProps) {
  const controls = useRef<OrbitLike | null>(null);
  const tuning = useMemo(() => tuningFromUrl(), []);
  const shape = useMemo(
    () => hatShape(props.stitches, rounds),
    // Worked out once: the hat's size does not change while it is on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /*
   * Where the widest part of the head sits. A ball has nothing to taper, so
   * it is sunk by its own radius and its equator is at the cast-on; a head
   * narrows, so it can sit higher and still let the rib grip.
   */
  const brim =
    ((rounds[0]?.length ?? 0) * adjacentStitchDistance) / (2 * Math.PI);
  const lift =
    tuning.head === "ball"
      ? tuning.headRadius
      : headLift(tuning.headTall, brim, tuning.headRadius);

  return (
    <Canvas
      camera={{ fov: 38, near: 0.5, far: 4000 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
    >
      <FrameHat shape={shape} controls={controls} />
      <OrbitControls
        ref={controls as never}
        enableDamping={!props.reducedMotion}
        dampingFactor={0.08}
        rotateSpeed={0.65}
        zoomSpeed={0.7}
        makeDefault
      />
      <Physics
        gravity={[0, tuning.gravity, 0]}
        timeStep={tuning.timeStep}
        numSolverIterations={tuning.iterations}
        paused
      >
        {tuning.headRadius > 0 && (
          /*
           * The head the hat is on.
           *
           * A hat's shape is mostly decided by what is inside it, and no
           * other model here says so: they pin the cast-on and blow the hat
           * outwards with an upside-down gravity, which is a stand-in for a
           * head rather than a head.
           *
           * It is sunk so that it has narrowed back to the rib's own width by
           * the time it reaches the rib, because that is how a hat is held
           * on: the rib is knitted smaller than the body and grips below the
           * widest part of the skull.
           */
          <RigidBody
            type="fixed"
            colliders={false}
            position={[0, lift, 0]}
          >
            {tuning.head === "ball" ? (
              <BallCollider
                args={[tuning.headRadius]}
                collisionGroups={headCollisions}
              />
            ) : (
              <ConvexHullCollider
                args={[headShape(tuning.headRadius, tuning.headTall)]}
                collisionGroups={headCollisions}
              />
            )}
          </RigidBody>
        )}
        <StitchPhysics {...props} tuning={tuning} />
      </Physics>
    </Canvas>
  );
}
