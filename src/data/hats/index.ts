import { HatPattern } from "./types";
import sww24 from "./sww24-islesburgh-toorie";
import sww25 from "./sww25-aal-ower-toorie";

/**
 * Every hat the site knows about, newest first.
 *
 * Adding a year is adding one file beside this one and one line here. There
 * are earlier toories than these going back to 2010, and nothing about the
 * site assumes how many there are.
 */
export const hats: HatPattern[] = [sww25, sww24];

export const hatById = (id: string): HatPattern | undefined =>
  hats.find((hat) => hat.id === id);

export * from "./types";
