import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { tuningFromUrl } from "./tuning";
import { hatShape } from "../helpers/hat-shape";
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
        <StitchPhysics {...props} tuning={tuning} />
      </Physics>
    </Canvas>
  );
}
