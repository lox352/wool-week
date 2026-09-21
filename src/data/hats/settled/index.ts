import { Point } from "../../../types/Point";

/**
 * Where each hat comes to rest, worked out once and committed.
 *
 * See scripts/settle-hats.mjs for how these are made. A hat with no file here
 * is drawn from the geometry the pattern was built with instead, which is a
 * stiffer but perfectly good hat. Fetched rather than
 * bundled, so the file for a hat you are not looking at is never downloaded,
 * and positions are stored as one flat array of numbers because ten thousand
 * three-key objects is several times the bytes for the same thing.
 */
const files = import.meta.glob<{ default: number[] }>("./*.json");

export const loadSettled = async (
  hatId: string,
): Promise<Point[] | undefined> => {
  const load = files[`./${hatId}.json`];
  if (!load) return undefined;
  try {
    const { default: flat } = await load();
    const out: Point[] = new Array(flat.length / 3);
    for (let i = 0; i < out.length; i++) {
      out[i] = { x: flat[i * 3], y: flat[i * 3 + 1], z: flat[i * 3 + 2] };
    }
    return out;
  } catch {
    // Nothing to settle with; the caller falls back to working it out.
    return undefined;
  }
};
