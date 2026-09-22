/**
 * What a Shetland Wool Week hat is, as data.
 *
 * Adding a year means adding one file next to this one and a line in
 * index.ts. Nothing else in the site knows how many hats there are, or
 * anything about a particular one.
 *
 * The shape follows how the patterns themselves are written: a chart is drawn
 * once in yarn *slots* (A, B, C...), and a colourway says which real wool goes
 * in each slot. SWW24 prints its charts in plain greys for exactly this
 * reason. So the chart is the design and the colourway is a costume, and
 * changing colourway never touches the knitting.
 */

export type SlotId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

/** A mark printed in a cell, on top of its colour. */
export type ChartSymbol = "purl" | "k1tbl" | "k2tog" | "s2kp" | "sk2p";

export interface ChartCell {
  slot: SlotId;
  symbol?: ChartSymbol;
}

export interface Chart {
  id: string;
  /**
   * The number the pattern gives this chart's first row. Charts are stored
   * from row 1, but a pattern may number a crown chart from 46 because that
   * is the round it falls on, and a knitter counting rows needs to see that.
   */
  numberFrom?: number;
  /**
   * Chart rows, bottom row first, each holding the stitches *worked* in that
   * round of the repeat, right to left as knitted.
   *
   * So a row's length is the stitch count after it, and the count before it is
   * what its cells consume - one for a plain stitch, two for a k2tog, three
   * for an s2kp. A crown chart's staircase falls out of that arithmetic
   * rather than having to be stored.
   */
  rows: ChartCell[][];
}

/**
 * How much to trust a shade's colour.
 *
 * "pattern" was read out of the pattern's own charts, which draw each yarn in
 * its real colour, so it is exact. "approximate" is a considered stand-in:
 * some patterns - SWW24 among them - print their charts in plain greys and
 * leave the colourway to the materials list, so there is no colour in the file
 * to read. The shade's name and number are still exactly as published, and the
 * colour is yours to correct.
 */
export type ShadeSource = "pattern" | "approximate";

export interface Shade {
  slot: SlotId;
  name: string;
  /** The brand's own shade number, where it has one. */
  code?: string;
  hex: string;
  /**
   * Where the colour came from. "pattern" means it was read out of the
   * pattern's own charts, which is exact; "shade-card" means it was taken
   * from the spinner's published shade card, which is a photograph of wool
   * and so is close rather than exact.
   */
  source: ShadeSource;
}

export interface Colourway {
  id: string;
  /** As the pattern names it, e.g. "Vintage". */
  name: string;
  brand: string;
  yarn: string;
  url: string;
  /**
   * Metres and grams in one ball, for the shopping list.
   *
   * Left out where the pattern leaves it out: handspun is sold in skeins
   * rather than balls, and nobody has said how long a skein is. Better a line
   * that does not claim it than a number invented to fill the field.
   */
  ballMetres?: number;
  ballGrams?: number;
  shades: Shade[];
  /** Balls of each slot; a slot that needs more in bigger sizes says so. */
  balls: Partial<Record<SlotId, number | Partial<Record<string, number>>>>;
}

export interface Size {
  id: string;
  label: string;
  toFitCm: number;
  circumferenceCm: number;
  lengthCm: number;
  /** Over the colourwork pattern, after blocking. */
  stitchesPer10cm: number;
  roundsPer10cm: number;
  needlesMm: number;
  /** Where the brim is worked on finer needles than the body. */
  ribNeedlesMm?: number;
}

/* -------------------------------------------------------------- the script */

/**
 * A pattern, round by round.
 *
 * Written the way the pattern is written, so that it can be checked against
 * the printed page: cast on this many, rib for ten rounds, increase like so,
 * then work these rows of that chart this many times round.
 */

/** One entry in a shaping round: "k4", "m1", or "[k2tog, k8] to last 6". */
export type ShapingOp =
  | { work: "k" | "p"; times: number }
  | { work: "m1" }
  | { work: "k2tog" }
  | { work: "s2kp" }
  | { work: "sk2p" }
  /** "[m1, k4] to last 5 sts" - repeat until that many are left unworked. */
  | { repeat: ShapingOp[]; untilRemaining: number }
  /** "[m1, k4] x 29" - repeat a fixed number of times. */
  | { repeat: ShapingOp[]; times: number };

export type RoundSpec =
  | { type: "castOn"; count: number; slot: SlotId }
  | {
      type: "rounds";
      count: number;
      slot: SlotId;
      /** Repeated to the end of each round. Defaults to a single knit. */
      sequence?: ("k" | "p" | "k1tbl")[];
    }
  | { type: "shaping"; slot: SlotId; ops: ShapingOp[]; /** For the tests. */ to: number }
  | {
      type: "chart";
      chart: string;
      /** Inclusive, 1-based, as the chart is numbered. */
      rows: [number, number];
      /** How many times the repeat goes round. */
      repeats: number;
      /** How many times to work that block of rows. Defaults to one. */
      passes?: number;
    };

export interface Section {
  label: string;
  rounds: RoundSpec[];
}

export interface HatPattern {
  id: string;
  year: number;
  name: string;
  designer: string;
  /** A paragraph in the designer's own terms, about where the hat came from. */
  story: string;
  /** Where the pattern is sold. */
  patternUrl: string;
  /** The copyright line the pattern carries. */
  credit: string;
  /** The hashtag the pattern asks knitters to use. */
  hashtag?: string;
  slots: SlotId[];
  /** What each slot is for, where the pattern makes it clear. */
  sizes: Size[];
  colourways: Colourway[];
  charts: Chart[];
  sections: Section[];
}

/** Stitches a cell consumes from the round below. */
export const consumes = (cell: ChartCell): number =>
  cell.symbol === "s2kp" || cell.symbol === "sk2p"
    ? 3
    : cell.symbol === "k2tog"
      ? 2
      : 1;

export const ballsFor = (
  colourway: Colourway,
  slot: SlotId,
  sizeId: string,
): number => {
  const entry = colourway.balls[slot];
  if (entry === undefined) return 1;
  if (typeof entry === "number") return entry;
  return entry[sizeId] ?? entry.default ?? 1;
};
