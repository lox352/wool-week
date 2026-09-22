import { Chart, Colourway, Shade, SlotId, partKey } from "../data/hats/types";
import type { WoolId } from "../data/yarns";
import { RGB } from "../types/RGB";

/**
 * What each yarn slot looks like.
 *
 * The chart is stored in slots, not colours, so this is the only place a
 * colour is decided and the only thing that changes when you pick a different
 * colourway. Anything a knitter has overridden wins, because the wool in
 * their hands beats the wool in the pattern.
 */

export interface Yarn {
  name: string;
  hex: string;
  /**
   * True when the colour is a considered stand-in rather than one read off
   * the spinner's own shade. Only the two yarns the library does not reach -
   * see data/yarns - and never a colour a knitter has set themselves, which
   * is by definition the right one.
   */
  approximate: boolean;
  code?: string;
  /** Which wool of the library it is, where it is one. */
  wool?: WoolId;
}

export type Palette = Record<string, Yarn>;

/**
 * The wool a knitter has put in a slot in place of the pattern's own.
 *
 * A whole entry rather than a colour, because what is chosen is a ball of
 * wool and not a hex: it has a name and a shade number to buy it by, and the
 * library id to find it again. A colour on its own is still allowed, for the
 * ball whose band went in the bin.
 */
export type Overrides = Partial<
  Record<SlotId, { wool?: WoolId; name?: string; code?: string; hex?: string }>
>;

const asYarn = (shade: Shade): Yarn => ({
  name: shade.name,
  hex: shade.hex,
  code: shade.code,
  wool: shade.wool,
  approximate: shade.source === "approximate",
});

export const paletteOf = (
  colourway: Colourway,
  overrides: Overrides = {},
  charts: Chart[] = [],
): Palette => {
  const out: Palette = {};
  colourway.shades.forEach((shade) => {
    const override = overrides[shade.slot];
    const base = asYarn(shade);
    out[shade.slot] = override
      ? {
          name: override.name ?? base.name,
          code: override.wool || override.hex ? override.code : base.code,
          hex: override.hex ?? base.hex,
          wool: override.wool,
          approximate: false,
        }
      : base;
  });

  /*
   * A chart drawn in parts has no colour of its own: it says "ground" and
   * "motif", and which yarn plays each is a property of the row and of the
   * colourway together. So every such row gets its own two entries, and a
   * stitch worked from one carries the key rather than a yarn - which is what
   * lets a colourway that swaps light for dark recolour the same knitting
   * instead of needing knitting of its own.
   */
  charts.forEach((chart) => {
    const parts = chart.parts?.[colourway.part ?? ""];
    if (!parts) return;
    parts.forEach(([ground, motif], index) => {
      const row = index + 1;
      if (out[ground]) out[partKey(chart.id, row, "ground")] = out[ground];
      if (out[motif]) out[partKey(chart.id, row, "motif")] = out[motif];
    });
  });
  return out;
};

const fallback: Yarn = { name: "unknown", hex: "#cccccc", approximate: true };

export const yarnFor = (palette: Palette, slot: string): Yarn =>
  palette[slot] ?? fallback;

export const rgbOf = (hex: string): RGB => {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0");
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

/** Readable ink for a label sitting on a yarn. */
export const inkOn = (hex: string): string => {
  const [r, g, b] = rgbOf(hex);
  // Rec. 601 luma is close enough for deciding black or white.
  return (r * 299 + g * 587 + b * 114) / 1000 > 145 ? "#1f1d1b" : "#ffffff";
};

/**
 * One entry per distinct shade, for the shopping list.
 *
 * A colourway may use one ball of wool in several slots - the Uradale
 * Aal Ower Toorie puts five yarns where the other two colourways put eight -
 * and nobody wants to be told to buy Grall three times.
 */
export const distinctShades = (
  colourway: Colourway,
  overrides: Overrides = {},
): { yarn: Yarn; slots: SlotId[] }[] => {
  const palette = paletteOf(colourway, overrides);
  const out: { yarn: Yarn; slots: SlotId[] }[] = [];
  colourway.shades.forEach((shade) => {
    const yarn = palette[shade.slot] ?? asYarn(shade);
    const seen = out.find(
      (entry) => entry.yarn.name === yarn.name && entry.yarn.hex === yarn.hex,
    );
    if (seen) seen.slots.push(shade.slot);
    else out.push({ yarn, slots: [shade.slot] });
  });
  return out;
};
