import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { BallCollider, ConvexHullCollider, Physics, RigidBody } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { headCollisions, tuningFromUrl } from "./tuning";
import { headFits, headLift, headShape } from "./head-shape";
import { hatShape } from "../helpers/hat-shape";
import { adjacentStitchDistance } from "../constants";
import FrameHat, { OrbitLike } from "./FrameHat";
import StitchPhysics, { StitchPhysicsProps } from "./StitchPhysics";
import RestingHat from "./RestingHat";
import { Point } from "../types/Point";

/** A stable empty list, so a hat with nothing settled is not a new hat each render. */
const nowhere: Point[] = [];

export type ChainModelProps = Omit<StitchPhysicsProps, "tuning"> & {
  rounds: number[][];
  /**
   * Where the hat came to rest, worked out once and committed. Shown the
   * moment the settling stops, in place of the physics.
   */
  settled?: Point[];
  /** Stop stepping, drop the world, and show the settled hat instead. */
  frozen?: boolean;
  /**
   * Called the moment someone takes hold of the hat.
   *
   * Turning a hat while ten thousand bodies are being stepped is not
   * something a browser can do smoothly, and the page would rather hand over
   * the finished shape than stutter through the rest of the settle.
   */
  onGrabbed?: () => void;
};

/**
 * The 3D stage: camera, controls, and the world the hat settles in.
 *
 * The camera is placed once, from the size the hat is predicted to be, and
 * then left alone; nothing moves it but the person looking. The canvas is
 * transparent so the page's own paper shows through. Rapier is paused and
 * stepped by the Settler, so the settle comes out the same on every machine.
 */
export default function ChainModel({
  rounds,
  onGrabbed,
  settled,
  frozen = false,
  ...props
}: ChainModelProps) {
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
  const tall =
    tuning.head === "ball"
      ? tuning.headRadius
      : headFits(tuning.headTall, shape.height, brim, tuning.headRadius);
  const lift =
    tuning.head === "ball"
      ? tuning.headRadius
      : headLift(tall, brim, tuning.headRadius);

  return (
    /*
     * One canvas, whether the hat is settling or standing still.
     *
     * The physics is unmounted when it stops, which is what gives the world
     * back - ten thousand rigid bodies and twenty-five thousand joints, about
     * 245MB of it. But the canvas around it stays, and so does the camera, so
     * a hat taken hold of mid-settle stops moving under the hand that took
     * it rather than vanishing and coming back framed afresh.
     *
     * On demand once it is still: nothing moves by itself then, so a frame is
     * worth drawing only when someone turns it or the wool changes.
     */
    <Canvas
      frameloop={frozen ? "demand" : "always"}
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
        onStart={onGrabbed}
        makeDefault
      />
      {frozen ? (
        <RestingHat
          stitches={props.stitches}
          palette={props.palette}
          progress={props.progress}
          settled={settled ?? nowhere}
          reducedMotion={props.reducedMotion}
        />
      ) : (
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
                  args={[headShape(tuning.headRadius, tall)]}
                  collisionGroups={headCollisions}
                />
              )}
            </RigidBody>
          )}
          <StitchPhysics {...props} tuning={tuning} />
        </Physics>
      )}
    </Canvas>
  );
}
