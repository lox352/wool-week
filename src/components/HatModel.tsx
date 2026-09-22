import React, { useCallback, useEffect, useMemo, useState } from "react";
import HatCanvas, { hatCanvasHeight } from "../ChainModel/HatCanvas";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { Palette } from "../knitting/palette";
import { loadSettled } from "../data/hats/settled";
import { measureGauge } from "../helpers/gauge";
import { blockHat } from "../helpers/blocking";
import { adjacentStitchDistance } from "../constants";

/**
 * Should this page settle the hat, or draw one already settled?
 *
 * It settles, so that a hat is watched finding its shape rather than arriving
 * in it. "?settle=0" asks for the finished one straight away, which is worth
 * having: a step over ten thousand rigid bodies and twenty-five thousand
 * joints is not free, and the whole world costs about 245MB of heap - more
 * than a phone will always give a tab.
 */
const options = () =>
  new URLSearchParams(
    typeof window === "undefined" ? "" : (window.location.hash.split("?")[1] ?? ""),
  );

const settlingRequested = () => options().get("settle") !== "0";

/**
 * "?settled=0" draws the hat where the pattern puts it rather than where it
 * came to rest, which is the only way to see what the settling is actually
 * worth. Blocking the file instead does not work: Vite compiles a JSON import
 * into a JS chunk, so there is no .json request to block, and a comparison
 * made that way quietly compares a thing against itself.
 */
const settledWanted = () => options().get("settled") !== "0";

/**
 * "?blocked=1" draws the settled hat blocked: each round eased out onto the
 * circle its own stitches make, level, as a knitter blocks a finished hat
 * over a board. See helpers/blocking.ts for why a settled hat wants it.
 */
const blockedWanted = () => {
  const amount = options().get("blocked");
  return amount === null ? 0 : Math.max(0, Math.min(1, Number(amount) || 0));
};

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
  roundHeight: number;
  palette: Palette;
  progress: number;
  /** What the pattern says the finished hat measures, for the bench. */
  target?: { acrossCm: number; tallCm: number };
}

/** Positions already fetched this session, so switching pages does not refetch. */
const known = new Map<string, Point[]>();

const HatModel: React.FC<HatModelProps> = ({
  hatId,
  stitches,
  rounds,
  roundHeight,
  palette,
  progress,
  target,
}) => {
  const [settled, setSettled] = useState<Point[] | undefined>(() =>
    known.get(hatId),
  );
  /**
   * Whether the hat is still settling in front of you.
   *
   * It stops for one of two reasons: it has come to rest, or somebody has
   * taken hold of it. Turning a hat while ten thousand bodies are being
   * stepped cannot be done smoothly, so the moment the mouse goes down the
   * physics is dropped and the finished shape - worked out once, offline, and
   * committed - is put in its place. What you lose is the rest of an
   * animation; what you get is a hat that turns.
   */
  const [settling, setSettling] = useState(true);
  /** Undefined while we do not yet know whether there is a file to load. */
  const [looked, setLooked] = useState(known.has(hatId));

  useEffect(() => {
    let live = true;
    if (!settledWanted()) {
      setSettled(undefined);
      setLooked(true);
      return;
    }
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

  /*
   * The hat itself, for the bench's geometry report. Only on the settle path,
   * which nothing but the scripts ever takes.
   */
  useEffect(() => {
    if (!settlingRequested()) return;
    (window as unknown as { __hat?: unknown }).__hat = {
      stitches,
      rounds,
      target,
      /*
       * The tension the hat settled to, for scripts/gauge.mjs. Measured here
       * rather than in the script so there is one implementation of it, and
       * it is the one with tests against the hat as the pattern builds it.
       *
       * What the pattern asks for is rounds per centimetre over stitches per
       * centimetre, which is exactly what the round height was derived from.
       */
      gauge: (at: Point[]) =>
        measureGauge(stitches, rounds, at, adjacentStitchDistance / roundHeight),
      /** The same hat pulled out to its measurements first. */
      blocked: (at: Point[], amount = 1) =>
        measureGauge(
          stitches,
          rounds,
          blockHat(rounds, at, amount),
          adjacentStitchDistance / roundHeight,
        ),
    };
  }, [stitches, rounds, target, roundHeight]);

  /** Hand over to the cheap renderer, and let the physics world go. */
  const rest = useCallback(() => setSettling(false), []);

  const onSettled = useCallback(
    (positions: Point[]) => {
      /*
       * What it came to rest as, unless the committed answer is already here.
       * They are the same physics either way, and preferring the file means
       * the hat does not shift under the pointer if the two ever differ.
       */
      if (!known.has(hatId)) {
        known.set(hatId, positions);
        setSettled(positions);
      }
      setSettling(false);
      // How scripts/settle-hats.mjs collects what it came for. Harmless
      // otherwise: in a shipped build nothing ever settles in the browser.
      (window as unknown as { __settledPositions?: Point[] }).__settledPositions =
        positions;
    },
    [hatId],
  );

  const blocking = blockedWanted();
  const shown = useMemo(
    () => (settled && blocking > 0 ? blockHat(rounds, settled, blocking) : settled),
    [settled, rounds, blocking],
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
      roundHeight={roundHeight}
      palette={palette}
      progress={progress}
      settled={shown}
      settle={settlingRequested()}
      frozen={!settling}
      onSettled={onSettled}
      onGrabbed={rest}
      reducedMotion={reducedMotion}
    />
  );
};

export default HatModel;
