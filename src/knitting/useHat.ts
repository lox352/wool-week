import { useMemo } from "react";
import { HatPattern } from "../data/hats/types";
import { buildHat } from "./engine";
import { indexRounds } from "./progress";

/**
 * A hat's stitches and rounds.
 *
 * Building them is pure and quick - a few thousand small objects - but it is
 * the same answer every time for a given pattern and size, so it is worth
 * keeping. Colourways still share the knitting completely.
 */
const cache = new Map<string, ReturnType<typeof buildHat>>();

export const hatStitches = (pattern: HatPattern, sizeId?: string) => {
  const key = `${pattern.id}::${sizeId ?? ""}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const built = buildHat(pattern, sizeId);
  cache.set(key, built);
  return built;
};

export const useHat = (pattern: HatPattern, sizeId?: string) => {
  const built = useMemo(
    () => hatStitches(pattern, sizeId),
    [pattern, sizeId],
  );
  const index = useMemo(
    () => indexRounds(built.rounds, built.roundLabels, built.turns),
    [built],
  );
  return { ...built, index };
};
