import React, { useMemo } from "react";
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
 */
const BodyStrip: React.FC<{
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  /** Fade every stitch but these yarns', to show where they are knitted. */
  highlight?: SlotId[];
  className?: string;
}> = ({ stitches, rounds, palette, highlight, className }) => {
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
    element.width = width;
    element.height = body.length;
    const lit = highlight && new Set(highlight.map((slot) => palette[slot]));
    body.forEach((round, index) => {
      // The newest round at the top, and stitch 1 at the right.
      const y = body.length - 1 - index;
      round.forEach((id, position) => {
        const yarn = yarnFor(palette, stitches[id]?.slot ?? "");
        ctx.globalAlpha = lit && !lit.has(yarn) ? 0.14 : 1;
        ctx.fillStyle = yarn.hex;
        ctx.fillRect(width - 1 - position, y, 1, 1);
      });
    });
    return element.toDataURL();
  }, [body, stitches, palette, highlight]);

  return (
    <div
      className={["body-strip", className].filter(Boolean).join(" ")}
      style={picture ? { backgroundImage: `url(${picture})` } : undefined}
      aria-hidden="true"
    />
  );
};

export default BodyStrip;
