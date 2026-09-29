import React, { useEffect, useMemo, useRef, useState } from "react";
import { SlotId } from "../data/hats/types";
import { Stitch } from "../types/Stitch";
import { Palette, yarnFor } from "../knitting/palette";

/**
 * The body of the hat as knitted: every round at its widest, stacked, in the
 * wool being chosen.
 *
 * Not a chart - a chart is one repeat of one band - but the band a knitter
 * spends most of the hat on, whole, with every yarn in it. Drawn a pixel a
 * stitch and scaled up square, because it is thousands of stitches and is
 * redrawn on every change of wool.
 *
 * Scaled up on the canvas itself, not by the browser: each stitch a square
 * of whole screen pixels, drawn at the strip's own height and the screen's
 * own density, so the picture is shown pixel for pixel. Left to the browser,
 * a one-pixel-a-stitch picture is only kept sharp where it honours
 * `image-rendering: pixelated` for backgrounds; where it doesn't (Safari on
 * a desktop, notably), it is smoothed into a blur.
 */

/** The height an element is drawn at, in screen pixels; 0 until it is known. */
const useDeviceHeight = (ref: React.RefObject<HTMLElement>) => {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => setHeight(element.getBoundingClientRect().height * (window.devicePixelRatio || 1));
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    // Zooming, or moving the window to a screen of another density.
    let density: MediaQueryList | undefined;
    const watchDensity = () => {
      density?.removeEventListener("change", onDensity);
      density = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      density?.addEventListener("change", onDensity);
    };
    const onDensity = () => {
      measure();
      watchDensity();
    };
    watchDensity();
    measure();
    return () => {
      observer.disconnect();
      density?.removeEventListener("change", onDensity);
    };
  }, [ref]);
  return height;
};

const BodyStrip: React.FC<{
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  /** Fade every stitch but these yarns', to show where they are knitted. */
  highlight?: SlotId[];
  className?: string;
}> = ({ stitches, rounds, palette, highlight, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const deviceHeight = useDeviceHeight(ref);
  /** The rounds at the hat's full width, from the first to the last. */
  const body = useMemo(() => {
    const widest = Math.max(...rounds.map((round) => round.length));
    const first = rounds.findIndex((round) => round.length === widest);
    let last = first;
    while (rounds[last + 1]?.length === widest) last++;
    return rounds.slice(first, last + 1);
  }, [rounds]);

  /*
   * Painted once per change of wool, a pixel a stitch, and used
   * as the strip's background: scaled up square to the strip's height and
   * repeated sideways to fill it. A round goes all the way round the hat, so
   * the next repeat along is simply more of the hat - which is what lets a
   * strip wider than the body's own proportions be filled edge to edge.
   */
  const picture = useMemo(() => {
    if (body.length === 0 || typeof document === "undefined") return undefined;
    const element = document.createElement("canvas");
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = element.getContext("2d");
    } catch {
      // No canvas here (a test environment): the plain ground shows instead.
    }
    if (!ctx) return undefined;
    const width = body[0].length;
    // Whole screen pixels a stitch, as near as they come to the strip's
    // height; until it has been measured, a pixel a stitch for the browser to scale.
    const scale = Math.max(1, Math.round(deviceHeight / body.length));
    element.width = width * scale;
    element.height = body.length * scale;
    const lit = highlight && new Set(highlight.map((slot) => palette[slot]));
    body.forEach((round, index) => {
      // The newest round at the top, and stitch 1 at the right.
      const y = body.length - 1 - index;
      round.forEach((id, position) => {
        const yarn = yarnFor(palette, stitches[id]?.slot ?? "");
        ctx.globalAlpha = lit && !lit.has(yarn) ? 0.14 : 1;
        ctx.fillStyle = yarn.hex;
        ctx.fillRect((width - 1 - position) * scale, y * scale, scale, scale);
      });
    });
    const density = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    if (deviceHeight <= 0) return { url: element.toDataURL() };
    // Pinned to whole screen pixels, so nothing is shifted by half of one:
    // stitch 1 at the right-hand edge, and centred up and down, where it
    // runs under or over the strip by at most half a stitch each way.
    const top = Math.round((deviceHeight - element.height) / 2);
    return {
      url: element.toDataURL(),
      size: `${element.width / density}px ${element.height / density}px`,
      position: `right 0 top ${top / density}px`,
    };
  }, [body, stitches, palette, highlight, deviceHeight]);

  return (
    <div
      className={["body-strip", className].filter(Boolean).join(" ")}
      ref={ref}
      style={
        picture
          ? { backgroundImage: `url(${picture.url})`, backgroundSize: picture.size, backgroundPosition: picture.position }
          : undefined
      }
      aria-hidden="true"
    />
  );
};

export default BodyStrip;
