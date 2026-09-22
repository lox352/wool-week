import { useMemo } from "react";
import { HatPattern } from "../data/hats/types";
import { buildHat } from "./engine";
import { indexRounds } from "./progress";

/**
 * A hat's stitches and rounds.
 *
 * Building them is pure and quick - a few thousand small objects - but it is
 * the same answer every time for a given pattern, so it is worth keeping. The
 * cache is keyed on the pattern rather than on the project, because two
 * projects on the same hat in different colourways share every stitch: the
 * colour is decided on the way to the screen, not here.
 */
const cache = new Map<string, ReturnType<typeof buildHat>>();

export const hatStitches = (pattern: HatPattern) => {
  const cached = cache.get(pattern.id);
  if (cached) return cached;
  const built = buildHat(pattern);
  cache.set(pattern.id, built);
  return built;
};

export const useHat = (pattern: HatPattern) => {
  const built = useMemo(() => hatStitches(pattern), [pattern]);
  const index = useMemo(
    () => indexRounds(built.rounds, built.roundLabels, built.turns),
    [built],
  );
  return { ...built, index };
};
