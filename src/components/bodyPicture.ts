import { useMemo } from "react";
import type { SlotId } from "../data/hats/types";
import type { Stitch } from "../types/Stitch";
import { yarnFor, type Palette } from "../knitting/palette";

/** The rounds at the hat's full width, from the first to the last. */
export const bodyRounds = (rounds: number[][]) => {
  const widest = Math.max(...rounds.map((round) => round.length));
  const first = rounds.findIndex((round) => round.length === widest);
  let last = first;
  while (rounds[last + 1]?.length === widest) last++;
  return rounds.slice(first, last + 1);
};

/**
 * Whole screen pixels a stitch, as near as they come to a strip `height`
 * screen pixels tall; until that is measured, a pixel a stitch for the
 * browser to scale.
 */
export const stitchScale = (height: number, rows: number) => Math.max(1, Math.round(height / Math.max(1, rows)));

/**
 * The body painted `scale` screen pixels a stitch, once per change of wool,
 * to use as a background: repeated sideways, since a round goes all the way
 * round the hat and the next repeat along is simply more of it. Undefined
 * where there is no canvas (a test environment).
 */
export const usePainting = (body: number[][], stitches: Stitch[], palette: Palette, scale: number, highlight?: SlotId[]) =>
  useMemo(() => {
    if (body.length === 0 || typeof document === "undefined") return undefined;
    const element = document.createElement("canvas");
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = element.getContext("2d");
    } catch {
      // No canvas here: the plain ground shows instead.
    }
    if (!ctx) return undefined;
    const width = body[0].length;
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
    return { url: element.toDataURL(), width: element.width, height: element.height };
  }, [body, stitches, palette, highlight, scale]);
