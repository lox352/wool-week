import React, { useCallback, useEffect, useState } from "react";
import HatCanvas, { hatCanvasHeight } from "../ChainModel/HatCanvas";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { Palette } from "../knitting/palette";
import { loadSettled } from "../data/hats/settled";

/**
 * Should this page settle the hat rather than draw one already settled?
 *
 * Only scripts/settle-hats.mjs ever asks for this. Settling is not something
 * to do in front of someone: a step over ten thousand rigid bodies and
 * twenty-five thousand rope joints takes a second or two, so a hat needs
 * minutes and about 245MB of heap to come to rest - more than a phone will
 * give a tab, and Safari on iOS ends the tab rather than waiting.
 */
const settlingRequested = () =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("settle") ===
    "1";

/**
 * The hat on screen.
 *
 * A hat's shape depends only on its pattern, and these patterns were charted
 * by their designers, so every knitter's copy of a given hat settles to the
 * same shape. That answer is worked out once by scripts/settle-hats.mjs and
 * committed, and this fetches it alongside the page.
 *
 * Working it out in the browser is not an option at this size, settled file
 * or not: it costs about 245MB of heap and takes minutes, which is why the
 * physics is never loaded here at all. A hat with no settled file yet is
 * drawn from the geometry the pattern was built with, which is already a hat
 * - a tube with a domed crown - just a slightly stiffer one.
 */

interface HatModelProps {
  /** The hat's id: what its settled positions are filed under. */
  hatId: string;
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  progress: number;
}

/** Positions already fetched this session, so switching pages does not refetch. */
const known = new Map<string, Point[]>();

const HatModel: React.FC<HatModelProps> = ({
  hatId,
  stitches,
  rounds,
  palette,
  progress,
}) => {
  const [settled, setSettled] = useState<Point[] | undefined>(() =>
    known.get(hatId),
  );
  /** Undefined while we do not yet know whether there is a file to load. */
  const [looked, setLooked] = useState(known.has(hatId));

  useEffect(() => {
    let live = true;
    const cached = known.get(hatId);
    if (cached) {
      setSettled(cached);
      setLooked(true);
      return;
    }
    setSettled(undefined);
    setLooked(false);
    loadSettled(hatId).then((positions) => {
      if (!live) return;
      if (positions) {
        known.set(hatId, positions);
        setSettled(positions);
      }
      setLooked(true);
    });
    return () => {
      live = false;
    };
  }, [hatId]);

  const onSettled = useCallback(
    (positions: Point[]) => {
      known.set(hatId, positions);
      setSettled(positions);
      // How scripts/settle-hats.mjs collects what it came for. Harmless
      // otherwise: in a shipped build nothing ever settles in the browser.
      (window as unknown as { __settledPositions?: Point[] }).__settledPositions =
        positions;
    },
    [hatId],
  );

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Nothing is drawn until the settled positions have had their chance to
  // arrive, so the hat is never briefly shown in the wrong shape.
  if (!looked) return <div style={{ height: hatCanvasHeight }} />;

  return (
    <HatCanvas
      stitches={stitches}
      rounds={rounds}
      palette={palette}
      progress={progress}
      settled={settled}
      settle={settlingRequested()}
      onSettled={onSettled}
      reducedMotion={reducedMotion}
    />
  );
};

export default HatModel;
