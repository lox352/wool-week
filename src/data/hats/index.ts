import { HatPattern } from "./types";
import sww26 from "./sww26-birsie-beanny";
import sww15 from "./sww15-baa-ble-hat";
import sww18 from "./sww18-merrie-dancers-toorie";
import sww19 from "./sww19-roadside-beanie";
import sww20 from "./sww20-katies-kep";
import sww21 from "./sww21-da-crofters-kep";
import sww22 from "./sww22-bonnie-isle-hat";
import sww24 from "./sww24-islesburgh-toorie";
import sww25 from "./sww25-aal-ower-toorie";

/**
 * Every hat the site knows about, newest first.
 *
 * Adding a year is adding one file beside this one and one line here. There
 * are earlier toories than these going back to 2010, and nothing about the
 * site assumes how many there are.
 */
export const hats: HatPattern[] = [sww26, sww25, sww24, sww22, sww21, sww20, sww19, sww18, sww15];

export const hatById = (id: string): HatPattern | undefined =>
  hats.find((hat) => hat.id === id);

export * from "./types";
