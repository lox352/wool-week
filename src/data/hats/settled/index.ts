import { Point } from "../../../types/Point";

/**
 * Where each hat comes to rest, worked out once and committed.
 *
 * Most patterns have one stitch topology and therefore one <hat>.json file.
 * A pattern whose sizes are different knitting can instead have
 * <hat>--<size>.json files. If any size-specific files exist for a hat, a
 * missing size does not fall back to another size's geometry.
 */
const files = import.meta.glob<{ default: number[] }>("./*.json");

export const loadSettled = async (
  hatId: string,
  sizeId?: string,
): Promise<Point[] | undefined> => {
  const prefix = `./${hatId}--`;
  const hasSizeSpecific = Object.keys(files).some((name) =>
    name.startsWith(prefix),
  );
  const key = hasSizeSpecific
    ? sizeId
      ? `${prefix}${sizeId}.json`
      : undefined
    : `./${hatId}.json`;
  if (!key) return undefined;
  const load = files[key];
  if (!load) return undefined;
  try {
    const { default: flat } = await load();
    const out: Point[] = new Array(flat.length / 3);
    for (let i = 0; i < out.length; i++) {
      out[i] = { x: flat[i * 3], y: flat[i * 3 + 1], z: flat[i * 3 + 2] };
    }
    return out;
  } catch {
    return undefined;
  }
};
