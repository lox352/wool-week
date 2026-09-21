import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { Palette, rgbOf, yarnFor } from "../knitting/palette";
import { hatShape } from "../helpers/hat-shape";
import FrameHat, { OrbitLike } from "./FrameHat";
import StitchInstances from "./StitchInstances";

export interface SettledHatProps {
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  progress: number;
  /** Resting positions, indexed by stitch id. */
  settled: Point[];
  reducedMotion: boolean;
}

/**
 * A hat that has already been settled.
 *
 * This is the path almost everyone takes, and the point of it is what it does
 * not do. These hats were charted by their designers, so a given pattern
 * settles to the same shape for everybody; making ten thousand rigid bodies
 * and twenty-five thousand rope joints on each visit to work that out again
 * was costing about 225MB of heap, which a phone will not give you - Safari
 * on iOS simply ends the tab.
 *
 * So the settling is done once, by scripts/settle-hats.mjs, and its answer is
 * committed. Nothing here imports the physics engine, which means the chunk
 * that carries it is never even fetched.
 */
export default function SettledHat({
  stitches,
  rounds,
  palette,
  progress,
  settled,
  reducedMotion,
}: SettledHatProps) {
  const controls = useRef<OrbitLike | null>(null);
  const shape = useMemo(
    () => hatShape(stitches, rounds, settled),
    [stitches, rounds, settled],
  );

  const drawn = useMemo(() => stitches.filter((s) => s.id > 0), [stitches]);

  const colours = useRef<Float32Array | null>(null);
  colours.current = useMemo(
    () =>
      new Float32Array(
        drawn.flatMap((stitch) =>
          rgbOf(yarnFor(palette, stitch.slot).hex).map((c) => c / 255),
        ),
      ),
    [drawn, palette],
  );

  const worked = useRef<Float32Array | null>(null);
  worked.current = useMemo(
    () => new Float32Array(drawn.map((stitch) => (stitch.id <= progress ? 1 : 0))),
    [drawn, progress],
  );

  const positionAt = useMemo(
    () => (id: number) => settled[id] ?? stitches[id]?.position,
    [settled, stitches],
  );

  return (
    /*
     * Drawn on demand rather than sixty times a second.
     *
     * Nothing here moves on its own: the hat is already settled, so a frame is
     * only worth drawing when someone turns it, when the wool changes, or
     * while a newly worked stitch is fading in. Left on the clock it redrew
     * 1.7 million triangles every frame whether or not anything had changed,
     * which on a phone made scrolling the page round it take seconds.
     */
    <Canvas
      frameloop="demand"
      camera={{ fov: 38, near: 0.5, far: 4000 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
    >
      <FrameHat shape={shape} controls={controls} />
      <OrbitControls
        ref={controls as never}
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        rotateSpeed={0.65}
        zoomSpeed={0.7}
        makeDefault
      />
      <StitchInstances
        stitches={stitches}
        positionAt={positionAt}
        moving={false}
        colours={colours}
        worked={worked}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
