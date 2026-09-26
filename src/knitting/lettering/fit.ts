import { filler, glyphHeight, glyphs, heart } from "./font";

/** One column of lettering, top row first: true where the letter's yarn is. */
export type Column = readonly boolean[];

/**
 * The longest a strand may float behind the work, in stitches. The printed
 * brim's letters keep to it in every row but one, and a longer float is one
 * that catches on fingers and rings.
 */
export const longestFloat = 7;

type Piece =
  | { kind: "glyph"; role: "letter" | "punct" | "heart" | "filler"; cols: Column[] }
  | { kind: "space"; role: "letter" | "word" | "heart"; width: number };

export type Fit =
  | {
      ok: true;
      /** The round, column by column, starting at a heart. */
      columns: Column[];
      /** How many times the text goes round. */
      copies: number;
      /** Whether hearts were put between the words to fill the round. */
      heartsBetweenWords: boolean;
    }
  | { ok: false; reason: "empty" }
  | { ok: false; reason: "unknown"; characters: string[] }
  | { ok: false; reason: "too-long"; over: number }
  | { ok: false; reason: "unknittable" };

const punctuation = new Set(["'", ".", "!"]);
const blank = (): Column => Array.from({ length: glyphHeight }, () => false);

const columnsOf = (character: string): Column[] => {
  const rows = glyphs[character];
  return Array.from({ length: rows[0].length }, (_, x) => rows.map((row) => row[x] === "#"));
};

/**
 * The filler, as wide as asked: the font's lattice, a stitch in every row and
 * never two alike side by side, so it floats nothing. Its phase is chosen so
 * the column against the heart is the one that meets it.
 */
const lattice = (width: number, phase: number): Column[] => {
  const [a, b] = columnsOf(filler);
  return Array.from({ length: width }, (_, x) => ((x + phase) % 2 === 0 ? a : b));
};

const same = (a: Column, b: Column) => a.every((value, i) => value === b[i]);

/** A letter a stitch narrower: one of a doubled stroke's columns taken out. */
const condensed = (cols: Column[]): Column[] | undefined => {
  const at = cols.findIndex((col, i) => i > 0 && same(col, cols[i - 1]) && col.some(Boolean));
  return at < 0 ? undefined : [...cols.slice(0, at), ...cols.slice(at + 1)];
};

/** A letter a stitch wider: its middle column doubled. */
const widened = (cols: Column[]): Column[] => {
  const middle = Math.floor(cols.length / 2);
  return [...cols.slice(0, middle), cols[middle], ...cols.slice(middle)];
};

/** Upper case, straight quotes, "<3" as a heart, single spaces. */
export const normalise = (text: string): string =>
  text
    .toUpperCase()
    .replace(/<3/g, heart)
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const columnsOfPieces = (pieces: Piece[]): Column[] =>
  pieces.flatMap((piece) =>
    piece.kind === "glyph" ? piece.cols : Array.from({ length: piece.width }, blank),
  );

/**
 * How far the floats go past the longest allowed, all told, in either yarn
 * and all the way round: the round has no ends, so a run can cross the join.
 */
export const floatExcess = (columns: Column[]): number => {
  let total = 0;
  for (let row = 0; row < glyphHeight; row++) {
    const cells = columns.map((col) => col[row]);
    // Start where the yarn changes, so a run over the join is counted once.
    const start = cells.findIndex((cell, i) => cell !== cells[(i + cells.length - 1) % cells.length]);
    if (start < 0) return Infinity;
    let run = 0;
    for (let i = 0; i < cells.length; i++) {
      const here = cells[(start + i) % cells.length];
      const before = cells[(start + i - 1 + cells.length) % cells.length];
      run = i > 0 && here === before ? run + 1 : 1;
      if (run > longestFloat) total++;
    }
  }
  return total;
};

const width = (pieces: Piece[]) =>
  pieces.reduce((sum, piece) => sum + (piece.kind === "glyph" ? piece.cols.length : piece.width), 0);

const heartPieces = (): Piece[] => [
  { kind: "space", role: "heart", width: 3 },
  { kind: "glyph", role: "heart", cols: columnsOf(heart) },
  { kind: "space", role: "heart", width: 3 },
];

/**
 * The text, once or more, each copy ending in a heart. Letters a stitch apart
 * and words three, as the pattern spaces its own.
 */
const layOut = (words: string[][], copies: number, heartsBetweenWords: boolean): Piece[] => {
  const pieces: Piece[] = [];
  for (let copy = 0; copy < copies; copy++) {
    words.forEach((word, w) => {
      word.forEach((character, c) => {
        pieces.push({
          kind: "glyph",
          role: punctuation.has(character) ? "punct" : "letter",
          cols: columnsOf(character),
        });
        if (c < word.length - 1) pieces.push({ kind: "space", role: "letter", width: 1 });
      });
      if (w < words.length - 1) {
        if (heartsBetweenWords) pieces.push(...heartPieces());
        else pieces.push({ kind: "space", role: "word", width: 3 });
      }
    });
    pieces.push(...heartPieces());
  }
  return pieces;
};

/**
 * The narrowest a space may close to. Words stay two apart. Letters may touch
 * where they still read as two, which is wherever no row has both of them
 * inked at the edge they meet on - a 6 and a 7 do not, and have to, since the
 * 6's open top and the 7's open foot would otherwise float eight stitches
 * between them - and punctuation may always touch its letters.
 */
const narrowest = (pieces: Piece[], i: number): number => {
  const piece = pieces[i];
  if (piece.kind !== "space") return 0;
  if (piece.role === "word") return 2;
  if (piece.role === "heart") return 1;
  const before = pieces[i - 1];
  const after = pieces[i + 1];
  if (before?.kind !== "glyph" || after?.kind !== "glyph") return 1;
  if (before.role === "punct" || after.role === "punct") return 0;
  const left = before.cols[before.cols.length - 1];
  const right = after.cols[0];
  return left.some((inked, row) => inked && right[row]) ? 1 : 0;
};

/** Close up spaces, a stitch at a time, while that shortens a float. */
const tighten = (pieces: Piece[]) => {
  for (;;) {
    const now = floatExcess(columnsOfPieces(pieces));
    if (now === 0) return;
    const closed = pieces.some((piece, i) => {
      if (piece.kind !== "space" || piece.width <= narrowest(pieces, i)) return false;
      piece.width--;
      if (floatExcess(columnsOfPieces(pieces)) < now) return true;
      piece.width++;
      return false;
    });
    if (!closed) return;
  }
};

/**
 * Settle the lattice against its neighbours: turn one over, or take a stitch
 * from the space beside it into it, while either shortens a float. The round
 * stays the same width throughout.
 */
const repair = (pieces: Piece[]) => {
  for (;;) {
    const now = floatExcess(columnsOfPieces(pieces));
    if (now === 0) return;
    const moved = pieces.some((piece, i) => {
      if (piece.kind !== "glyph" || piece.role !== "filler") return false;
      const flipped = lattice(piece.cols.length, piece.cols[0] === columnsOf(filler)[0] ? 1 : 0);
      const before = piece.cols;
      piece.cols = flipped;
      if (floatExcess(columnsOfPieces(pieces)) < now) return true;
      piece.cols = before;
      return [i - 1, i + 1].some((j) => {
        const space = pieces[j];
        if (space?.kind !== "space" || space.width <= narrowest(pieces, j)) return false;
        space.width--;
        for (const phase of [0, 1]) {
          piece.cols = lattice(before.length + 1, phase);
          if (floatExcess(columnsOfPieces(pieces)) < now) return true;
        }
        space.width++;
        piece.cols = before;
        return false;
      });
    });
    if (!moved) return;
  }
};

/**
 * One way of filling the round: this many copies, with or without hearts
 * between the words. Squeezes letters and spaces if it is over, and stretches
 * them, a stitch at a time and never past the float limit, if it is under.
 */
const attempt = (
  words: string[][],
  copies: number,
  heartsBetweenWords: boolean,
  round: number,
): { pieces: Piece[]; over: number } | undefined => {
  const pieces = layOut(words, copies, heartsBetweenWords);
  tighten(pieces);
  let slack = round - width(pieces);

  if (slack < 0) {
    const letters = pieces
      .filter((piece): piece is Extract<Piece, { kind: "glyph" }> => piece.kind === "glyph" && piece.role === "letter")
      .sort((a, b) => b.cols.length - a.cols.length);
    for (const letter of letters) {
      if (slack >= 0) break;
      const narrower = condensed(letter.cols);
      if (narrower) {
        letter.cols = narrower;
        slack++;
      }
    }
    for (const piece of pieces) {
      if (slack >= 0) break;
      if (piece.kind === "space" && piece.role === "word" && piece.width > 2) {
        piece.width--;
        slack++;
      }
    }
    if (slack < 0) return { pieces, over: -slack };
  }

  const fits = () => floatExcess(columnsOfPieces(pieces)) === 0;
  /** Grow each of these by a stitch in turn, up to a cap, while it knits. */
  const spread = (targets: Piece[], cap: number) => {
    let moved = true;
    while (slack > 0 && moved) {
      moved = false;
      for (const piece of targets) {
        if (slack === 0) break;
        if (piece.kind === "space") {
          if (piece.width >= cap) continue;
          piece.width++;
          if (fits()) {
            slack--;
            moved = true;
          } else piece.width--;
        } else {
          if (piece.cols.length >= cap) continue;
          const before = piece.cols;
          piece.cols = widened(before);
          if (fits()) {
            slack--;
            moved = true;
          } else piece.cols = before;
        }
      }
    }
  };
  const spaces = (role: "letter" | "word" | "heart") =>
    pieces.filter((piece) => piece.kind === "space" && piece.role === role);
  spread(spaces("heart"), 4);
  spread(spaces("word"), 4);
  spread(pieces.filter((piece) => piece.kind === "glyph" && piece.role === "letter"), 7);
  spread([...spaces("heart"), ...spaces("word")], 6);
  spread(spaces("letter"), 2);

  // Still short: the lattice, either side of the hearts, as wide as it takes.
  if (slack > 0) {
    const hearts = pieces.flatMap((piece, i) => (piece.kind === "glyph" && piece.role === "heart" ? [i] : []));
    const sides = hearts.length * 2;
    const widths = Array.from({ length: sides }, (_, side) =>
      Math.floor(slack / sides) + (side < slack % sides ? 1 : 0),
    );
    // From the end, so the indices of the hearts still to come stay put.
    for (let h = hearts.length - 1; h >= 0; h--) {
      const at = hearts[h];
      const after = widths[h * 2 + 1];
      const before = widths[h * 2];
      if (after > 0) pieces.splice(at + 1, 0, { kind: "glyph", role: "filler", cols: lattice(after, 0) });
      if (before > 0) pieces.splice(at, 0, { kind: "glyph", role: "filler", cols: lattice(before, before % 2) });
    }
    slack = 0;
    repair(pieces);
  }
  if (slack !== 0 || !fits()) return undefined;
  return { pieces, over: 0 };
};

/** Whether one score comes first, comparing the first place they differ. */
const ranksBefore = (a: number[], b: number[]) => {
  const i = a.findIndex((value, j) => value !== b[j]);
  return i >= 0 && a[i] < b[i];
};

/**
 * Lay text out round a brim of so many stitches, exactly.
 *
 * Tried every way that could work - once round, or repeated; spaced words or
 * hearts between them - and the plainest that fits is kept: the fewest
 * letters stretched past their own width, then one copy before several, then
 * spaces before hearts. Whatever comes back keeps every float, in both yarns,
 * to longestFloat.
 */
export const fitLettering = (text: string, round: number): Fit => {
  const clean = normalise(text);
  if (!clean) return { ok: false, reason: "empty" };
  const unknown = [...new Set([...clean.replace(/ /g, "")].filter((c) => !glyphs[c] || c === filler))];
  if (unknown.length > 0) return { ok: false, reason: "unknown", characters: unknown };
  const words = clean.split(" ").map((word) => [...word]);

  type Best = { score: number[]; pieces: Piece[]; copies: number; heartsBetweenWords: boolean };
  let best: Best | undefined;
  let leastOver = Infinity;
  for (const heartsBetweenWords of words.length > 1 ? [false, true] : [false]) {
    const natural = width(layOut(words, 1, heartsBetweenWords));
    for (let copies = 1; copies <= Math.floor(round / natural) + 1; copies++) {
      const tried = attempt(words, copies, heartsBetweenWords, round);
      if (!tried) continue;
      if (tried.over > 0) {
        if (copies === 1) leastOver = Math.min(leastOver, tried.over);
        continue;
      }
      const stretched = tried.pieces.filter((p) => p.kind === "glyph" && p.role === "letter" && p.cols.length > 6).length;
      const score = [stretched, copies > 1 ? 1 : 0, heartsBetweenWords ? 1 : 0];
      if (!best || ranksBefore(score, best.score)) {
        best = { score, pieces: tried.pieces, copies, heartsBetweenWords };
      }
    }
  }
  if (!best) {
    return Number.isFinite(leastOver)
      ? { ok: false, reason: "too-long", over: leastOver }
      : { ok: false, reason: "unknittable" };
  }

  // From the last heart's leading space, so no word is cut in two.
  const columns = columnsOfPieces(best.pieces);
  let at = 0;
  let start = 0;
  best.pieces.forEach((piece, i) => {
    if (piece.kind === "glyph" && piece.role === "heart") {
      const before = best!.pieces[i - 1];
      start = at - (before?.kind === "space" ? before.width : 0);
    }
    at += piece.kind === "glyph" ? piece.cols.length : piece.width;
  });
  return {
    ok: true,
    columns: [...columns.slice(start), ...columns.slice(0, start)],
    copies: best.copies,
    heartsBetweenWords: best.heartsBetweenWords,
  };
};
