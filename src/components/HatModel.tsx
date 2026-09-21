import React, { useCallback, useEffect, useState } from "react";
import HatCanvas from "../ChainModel/HatCanvas";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { Palette } from "../knitting/palette";

/**
 * The hat on screen, settled once and then left alone.
 *
 * Settling is the expensive part - a few thousand rigid bodies relaxing into
 * shape - and it depends only on the pattern and the size, so the resting
 * positions are kept for as long as the page is open. Changing colourway or
 * working another stitch recolours the same settled hat instead of dropping it
 * back into the physics.
 */

const restingPositions = new Map<string, Point[]>();

interface HatModelProps {
  /** Identifies the shape, so two projects on one hat settle once between them. */
  shapeKey: string;
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  progress: number;
}

const HatModel: React.FC<HatModelProps> = ({
  shapeKey,
  stitches,
  rounds,
  palette,
  progress,
}) => {
  const [settled, setSettled] = useState<Point[] | undefined>(() =>
    restingPositions.get(shapeKey),
  );
  const [active, setActive] = useState(!settled);

  useEffect(() => {
    const known = restingPositions.get(shapeKey);
    setSettled(known);
    setActive(!known);
  }, [shapeKey]);

  const onSettled = useCallback(
    (positions: Point[]) => {
      restingPositions.set(shapeKey, positions);
      setSettled(positions);
      setActive(false);
    },
    [shapeKey],
  );

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <HatCanvas
      stitches={stitches}
      rounds={rounds}
      palette={palette}
      progress={progress}
      settled={settled}
      onSettled={onSettled}
      simulationActive={active}
      reducedMotion={reducedMotion}
    />
  );
};

export default HatModel;
