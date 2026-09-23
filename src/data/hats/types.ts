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

import type { WoolId } from "../yarns";

export type SlotId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

/** A mark printed in a cell, on top of its colour. */
export type ChartSymbol = "purl" | "k1tbl" | "k2tog" | "s2kp" | "sk2p";

/**
 * What colour a chart cell is, as the chart itself puts it.
 *
 * Usually a yarn outright. Some patterns are drawn in parts instead - a
 * background and a motif - and say row by row which yarn plays each, because
 * the same knitting is offered in colourways that swap light for dark. 2026's
 * charts are printed twice for exactly that reason, once each way round, and
 * the two are cell-for-cell inverses of each other: one piece of knitting,
 * two castings.
 */
export type CellColour = SlotId | "ground" | "motif";

export interface ChartCell {
  slot: CellColour;
  symbol?: ChartSymbol;
}

/**
 * What a cell drawn as a part is called in a palette.
 *
 * A part is not a colour until a colourway has said which yarn plays it on
 * that row, so a stitch worked from one carries the row it came from and the
 * palette carries an entry for it. That keeps the knitting free of the
 * colourway, which is the whole arrangement here: changing colourway recolours
 * and never rebuilds.
 */
export const partKey = (chart: string, row: number, part: string): string =>
  `${chart}:${row}:${part}`;

export interface Chart {
  id: string;
  /**
   * Which fabric this chart is knitted in, where the pattern has more than
   * one. See HatPattern.tensions; a round spec may override it.
   */
  fabric?: string;
  /**
   * Which yarn plays each part, row by row, for a chart drawn in ground and
   * motif. Keyed by the name a colourway asks for; each entry is
   * [ground, motif] and the first is chart row 1.
   */
  parts?: Record<string, [SlotId, SlotId][]>;
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
 * Where a shade's colour came from.
 *
 * "library" is the yarn library - the spinner's own shop, sampled from their
 * own photograph of the wool and corrected for the shadow between its
 * strands. Which is the best anyone outside a dye house has, and, more to the
 * point, the same method for every shade on the site: before it, the same
 * Uradale Graeff was three different colours in three different hats, because
 * each had been guessed at separately.
 *
 * "approximate" is a considered stand-in where the library cannot identify
 * a current shop entry: small or discontinued producers, one-off handspun or
 * naturally dyed ranges, and historic shades that cannot be unambiguously
 * matched to a current catalogue. The shade's name is exactly as the pattern
 * publishes it and the colour is yours to correct.
 */
export type ShadeSource = "library" | "approximate";

export interface Shade {
  slot: SlotId;
  /**
   * Which wool in the library this is - see data/yarns. Its name, number and
   * colour are all copied out of the library rather than looked up, so that
   * nothing has to load nine hundred shades to draw a hat; a test keeps the
   * copy honest.
   */
  wool?: WoolId;
  name: string;
  /** The spinner's own shade number, where they use one. */
  code?: string;
  hex: string;
  source: ShadeSource;
}

export interface Colourway {
  id: string;
  /** As the pattern names it, e.g. "Vintage". */
  name: string;
  brand: string;
  yarn: string;
  /**
   * Which range of the yarn library it is knitted in - see data/yarns. What
   * it is for is the picker: somebody swapping a shade nearly always wants
   * another shade of the same yarn, so that is what opens.
   */
  wool?: string;
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
  /**
   * Which of a chart's `parts` this colourway uses, where its charts are
   * drawn in parts. 2026 has two: one for the colourways with a light motif
   * on a dark ground, one for the colourways the other way round.
   */
  part?: string;
  /** Balls of each slot; a slot that needs more in bigger sizes says so. */
  balls: Partial<Record<SlotId, number | Partial<Record<string, number>>>>;
}

export interface Size {
  id: string;
  label: string;
  /** Omitted where the pattern only gives a descriptive head size. */
  toFitCm?: number;
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
  /** Knit front and back: consumes one stitch and leaves two. */
  | { work: "kfb" }
  | { work: "k2tog" }
  | { work: "k2togtbl" }
  | { work: "s2kp" }
  | { work: "sk2p" }
  /** "[m1, k4] to last 5 sts" - repeat until that many are left unworked. */
  | { repeat: ShapingOp[]; untilRemaining: number }
  /** "[m1, k4] x 29" - repeat a fixed number of times. */
  | { repeat: ShapingOp[]; times: number };

export type RoundSpec =
  | { type: "castOn"; count: number; slot: string; fabric?: string }
  | {
      type: "rounds";
      count: number;
      /**
       * A yarn, or - for a pattern whose plain rounds change colour with the
       * colourway, as 2026's rib does - a part key. See partKey.
       */
      slot: string;
      /** Repeated to the end of each round. Defaults to a single knit. */
      sequence?: ("k" | "p" | "k1tbl")[];
      fabric?: string;
    }
  | {
      type: "shaping";
      slot: string;
      ops: ShapingOp[];
      /** For the tests. */
      to: number;
      fabric?: string;
      /**
       * Where to begin consuming the round below. Positive borrows from its
       * end; negative skips forward. Only set when the written pattern moves
       * the round opening explicitly.
       */
      borrow?: number;
    }
  /**
   * The fabric turns back on itself here: no stitches, just the round the
   * fold runs along. A turned-up brim has one; a hem knitted to hang inside
   * one has two. What it does to the hat is in knitting/folding.ts.
   */
  | { type: "fold" }
  /**
   * "Turn work inside out so the wrong side of the brim is facing you."
   *
   * Also not a round. A brim meant to be worn turned up has to be knitted
   * with its right side facing in, so that turning it up brings it out, and
   * the pattern gets there by turning the whole work over partway. Everything
   * before that point is therefore worked the other way about the hat from
   * everything after it, and so goes on backwards: the brim's chart is laid
   * over its round in the opposite direction from the body's.
   *
   * Which is why the brim charts are drawn upside down and back to front.
   * Read them the usual way, turn the brim up, and the festival's name comes
   * out the right way round - and a model that turned the brim without
   * turning the work spells it in mirror writing.
   */
  | { type: "turn" }
  | {
      type: "chart";
      chart: string;
      /** Inclusive, 1-based, as the chart is numbered. */
      rows: [number, number];
      /** How many times the repeat goes round. */
      repeats: number;
      /** How many times to work that block of rows. Defaults to one. */
      passes?: number;
      /** Overrides the chart's own fabric, where it has one. */
      fabric?: string;
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
  /**
   * The pattern's fabrics, where it knits in more than one, each as a
   * fraction of the tension the pattern states.
   *
   * Most hats here are one fabric and leave this out: every stitch is a
   * stitch wide and every round a round tall. But a hat can be knitted in two
   * tensions at once and say so - 2026's Birsie Beanny prints one gauge
   * measured over its ribbed brim and another over its colourwork, "because
   * the brim is designed to be close-fitting while the top of the hat is
   * slouchy". A pattern that does that names its fabrics here, and its charts
   * and rounds say which one they are in; anything unnamed is knitted at the
   * stated tension.
   *
   * `stitch` is the only thing that decides how wide a round comes out,
   * because a round is its stitches laid end to end and nothing else - so a
   * fabric knitted narrower makes a smaller circle of the same number of
   * stitches, which is exactly what an increase round at a change of fabric
   * is for. `round` is how tall its rounds are, which is what decides whether
   * a facing knitted in one fabric reaches the depth of a brim knitted in
   * another.
   */
  tensions?: Record<string, { stitch?: number; round?: number }>;
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
