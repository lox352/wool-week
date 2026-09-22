import { useMemo } from "react";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { Palette, rgbOf, yarnFor } from "../knitting/palette";
import StitchInstances from "./StitchInstances";

export interface RestingHatProps {
  stitches: Stitch[];
  palette: Palette;
  progress: number;
  /** Resting positions, indexed by stitch id. */
  settled: Point[];
  reducedMotion: boolean;
}

/**
 * A hat standing still, without the stage around it.
 *
 * The same knitting the physics draws, drawn from positions that are already
 * known instead of from ten thousand rigid bodies. It has no canvas and no
 * camera of its own so that it can be swapped in underneath one that is
 * already there - which is what happens when somebody takes hold of a hat
 * that is still settling. Keeping the canvas keeps the camera, and keeping
 * the camera is what makes it a hat that stops moving rather than a hat that
 * jumps.
 */
export default function RestingHat({
  stitches,
  palette,
  progress,
  settled,
  reducedMotion,
}: RestingHatProps) {
  const drawn = useMemo(() => stitches.filter((s) => s.id > 0), [stitches]);

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

  const positionAt = useMemo(
    () => (id: number) => settled[id] ?? stitches[id]?.position,
    [settled, stitches],
  );

  return (
    <StitchInstances
      stitches={stitches}
      positionAt={positionAt}
      moving={false}
      colours={colours}
      worked={worked}
      reducedMotion={reducedMotion}
    />
  );
}
