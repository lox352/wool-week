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
