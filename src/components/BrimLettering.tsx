import React, { useEffect, useMemo, useRef, useState } from "react";
import { HatPattern, partKey } from "../data/hats/types";
import { Palette, yarnFor } from "../knitting/palette";
import { glyphHeight } from "../knitting/lettering/font";
import { Fit, fitLettering, normalise } from "../knitting/lettering/fit";
import "./BrimLettering.css";

/** How long typing has to pause before the hat is rebuilt with the words. */
const settleMs = 350;

/** What the fitter made of the words, in a sentence. */
const saying = (fit: Fit, printed: string): string => {
  if (fit.ok) {
    const round = fit.copies > 1 ? `Repeated ${fit.copies} times round the brim` : "Once round the brim";
    return `${round}${fit.heartsBetweenWords ? ", with hearts between the words" : ""}.`;
  }
  switch (fit.reason) {
    case "empty":
      return `The pattern's own: ${printed}.`;
    case "unknown":
      return (
        `There is no ${fit.characters.join(" or ")} in the brim's lettering. ` +
        "It has A to Z, 0 to 9, ! . ' and hearts (type <3)."
      );
    case "too-long":
      return `Too long by ${fit.over} stitches, about ${Math.ceil(fit.over / 6)} letters. Shorter words will fit.`;
    case "unknittable":
      return (
        "Two of those letters leave a strand floating too far behind the work. " +
        "A space between them, or another letter, will fix it."
      );
  }
};

/**
 * The brim's lettering, and a box to put your own words in.
 *
 * Shown as the brim is worn: the chart's own borders above and below, and the
 * words in the rows between, in the hat's wool. Drawn straight from what the
 * fitter makes of the words as they are typed, so the preview keeps up with
 * the keys; the hat itself is only rebuilt once typing pauses.
 */
const BrimLettering: React.FC<{
  hat: HatPattern;
  /** The words chosen so far, or none for the pattern's own. */
  text?: string;
  onChange: (text: string | undefined) => void;
  /**
   * The words as they stand, the moment they fit, before typing has paused:
   * for anything that has to act on them straight away.
   */
  onDraft?: (text: string | undefined) => void;
  palette: Palette;
  /** Once the lettering is knitted, it is what it is. */
  knitted?: boolean;
}> = ({ hat, text, onChange, onDraft, palette, knitted = false }) => {
  const band = hat.lettering!;
  const chart = hat.charts.find((candidate) => candidate.id === band.chart)!;
  const round = chart.rows[band.row - 1].length;
  const printed = band.printed;

  const [draft, setDraft] = useState(text ?? "");
  useEffect(() => setDraft(text ?? ""), [text]);
  const fit = useMemo(() => fitLettering(draft, round), [draft, round]);

  // Hand the words on once typing settles, and only words that fit.
  const handed = useRef(text);
  const pending = useRef<{ next: string | undefined }>();
  useEffect(() => {
    const words = normalise(draft);
    // Words that will not fit are left in the box to be mended, not saved.
    if (words && !fit.ok) return;
    const next = words || undefined;
    onDraft?.(next);
    if (next === handed.current) return;
    pending.current = { next };
    const timer = window.setTimeout(() => {
      pending.current = undefined;
      handed.current = next;
      onChange(next);
    }, settleMs);
    return () => window.clearTimeout(timer);
  }, [draft, fit, onChange, onDraft]);

  // Leaving before typing has paused still keeps the words.
  const latest = useRef(onChange);
  latest.current = onChange;
  useEffect(
    () => () => {
      if (pending.current) latest.current(pending.current.next);
    },
    [],
  );

  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = element?.getContext("2d") ?? null;
    } catch {
      // No canvas here (a test environment).
    }
    if (!element || !ctx) return;
    // The rows either side of the letters too: the brim's borders.
    const first = Math.max(1, band.row - 3);
    const last = Math.min(chart.rows.length, band.row + glyphHeight + 2);
    element.width = round;
    element.height = last - first + 1;
    for (let row = first; row <= last; row++) {
      const line = row - band.row;
      chart.rows[row - 1].forEach((cell, x) => {
        const motif =
          fit.ok && line >= 0 && line < glyphHeight ? fit.columns[x][line] : cell.slot === "motif";
        ctx.fillStyle = yarnFor(palette, partKey(chart.id, row, motif ? "motif" : "ground")).hex;
        ctx.fillRect(x, row - first, 1, 1);
      });
    }
  }, [fit, chart, band.row, round, palette]);

  return (
    <section className="section brim-lettering">
      <h2>Brim lettering</h2>
      <p className="quiet">
        Knit your own words round the brim instead of the festival's name, in
        the pattern's own style of letter.
      </p>
      <canvas
        ref={canvas}
        className="brim-lettering-preview"
        role="img"
        aria-label={`The brim, lettered ${fit.ok ? normalise(draft) : printed}`}
      />
      {knitted ? (
        <p className="quiet">
          The lettering is knitted{text ? `: ${text}` : ""}. It can only be changed before you reach it.
        </p>
      ) : (
        <>
          <div className="brim-lettering-field">
            <label htmlFor="brim-words">Your words</label>
            <input
              id="brim-words"
              type="text"
              value={draft}
              maxLength={60}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={printed}
              onChange={(event) => setDraft(event.target.value)}
            />
            {draft && (
              <button type="button" className="btn btn-quiet" onClick={() => setDraft("")}>
                Use the pattern's
              </button>
            )}
          </div>
          <p className={`brim-lettering-status${fit.ok || fit.reason === "empty" ? "" : " is-problem"}`} role="status">
            {saying(fit, printed)}
          </p>
        </>
      )}
    </section>
  );
};

export default BrimLettering;
