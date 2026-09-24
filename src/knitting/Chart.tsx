import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Stitch } from "../types/Stitch";
import { layOut } from "./layout";
import { Palette } from "./palette";
import { cellAt, chartSize, drawChart, drawProgress } from "./draw-chart";
import ChartSvg from "./ChartSvg";
import { StitchLegend, TextRound } from "./ChartHelp";
import { useSettings } from "../helpers/settings";
import type { HatPattern } from "../data/hats/types";
import { maxCell, minCell, usePinchZoom } from "./usePinchZoom";
import "./Chart.css";


/** How many turns are below a round: which region it is in, and its parity. */
const regionsBelow = (turns: number[], round: number): number =>
  turns.filter((at) => at < round).length;

/**
 * How far above the panel the stitch being worked should sit, in rounds.
 *
 * Enough that the round you are on and the few just finished are all clear of
 * it, rather than the stitch you want hugging its top edge.
 */
const clearance = 5;

/**
 * The largest canvas to ask a browser for, in pixels along either side.
 *
 * Safari on iOS will not allocate one much beyond this, and a canvas it
 * refuses comes back blank rather than throwing, so the chart is drawn at
 * whatever pixel ratio keeps it inside the limit.
 */
const maxCanvasSide = 2048;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Which renderer to draw the chart with.
 *
 * Vectors, unless "?chart=canvas" asks otherwise. The canvas one is kept so
 * the bench can hold the two against each other - `npm run bench -- --chart`
 * runs both - rather than either being replaced on an argument.
 */
const renderer = (): "svg" | "canvas" =>
  new URLSearchParams(
    typeof window === "undefined" ? "" : (window.location.hash.split("?")[1] ?? ""),
  ).get("chart") === "canvas"
    ? "canvas"
    : "svg";

/**
 * A colour from the stylesheet, so the canvas is painted in the same palette
 * as everything round it. Read once and remembered: asking for it forces a
 * style recalculation, and this is on the path of every stitch worked.
 */
const tokens = new Map<string, string>();
const token = (name: string, fallback: string): string => {
  const known = tokens.get(name);
  if (known) return known;
  const value =
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback;
  tokens.set(name, value);
  return value;
};

interface ChartProps {
  stitches: Stitch[];
  rounds: number[][];
  palette: Palette;
  progress: number;
  /** Mark the next stitch and keep it in view. */
  follow?: boolean;
  labels?: string[];
  /**
   * Rounds after which the work is turned inside out.
   *
   * Drawn as a rule across the chart, because it is the one boundary that
   * changes how the chart is read: the rounds either side of it go on
   * opposite faces of the tube, and so the other way about the hat.
   */
  turns?: number[];
  /** What the pattern says about its stitches, for the symbol key. */
  stitchNotes?: HatPattern["stitchNotes"];
}

/**
 * The chart, drawn onto a canvas.
 *
 * It used to be a CSS grid holding one div per stitch. For a ten thousand
 * stitch hat that was ten thousand elements to lay out, and ten thousand
 * React components to reconcile every time a stitch was worked: about six
 * hundred milliseconds a stitch on a phone, for a page whose whole job is
 * counting stitches.
 *
 * Now the colours and marks are drawn once onto a canvas kept off screen,
 * because nothing about them changes while you knit, and what does change -
 * how much is done, and which stitch is next - is painted over the top. That
 * costs one blit and one rectangle per round, so working a stitch takes the
 * same time on a ten thousand stitch hat as on a small one.
 */
const Chart: React.FC<ChartProps> = ({
  stitches,
  rounds,
  palette,
  progress,
  follow = false,
  labels,
  turns,
  stitchNotes,
}) => {
  const [zoom, setZoom] = useState(16);
  const { highContrast: contrast, writtenRounds } = useSettings();
  const [textRound, setTextRound] = useState(1);
  const [showText, setShowText] = useState(false);
  const cellSize = contrast ? Math.max(28, zoom) : zoom;
  const shownPalette = useMemo(() => contrast ? Object.fromEntries(
    Object.entries(palette).map(([key, yarn]) => [key, { ...yarn, hex: "#ffffff" }]),
  ) : palette, [palette, contrast]);
  const yarnLabels = useMemo(() => {
    const names = [...new Set(Object.values(palette).map(yarn => `${yarn.name}|${yarn.hex}`))];
    return Object.fromEntries(Object.entries(palette).map(([key, yarn]) => [key, String(names.indexOf(`${yarn.name}|${yarn.hex}`) + 1)]));
  }, [palette]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const zoomTo = useCallback((cell: number) => setZoom(Math.round(cell)), []);
  usePinchZoom(scrollRef, sheetRef, cellSize, zoomTo, follow);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const nextId = follow ? progress + 1 : undefined;
  const preferredRenderer = useMemo(() => renderer(), []);
  const drawWith = contrast ? "svg" : preferredRenderer;

  const layout = useMemo(() => layOut(stitches, rounds), [stitches, rounds]);
  /*
   * The turns that actually fall inside the chart, in order. One at the very
   * top or bottom would divide nothing, and there would be no fabric either
   * side of it to draw the rule across.
   */
  const marked = useMemo(
    () =>
      [...new Set(turns ?? [])]
        .filter((round) => round > 0 && round < layout.rounds)
        .sort((a, b) => a - b),
    [turns, layout.rounds],
  );
  const { width, height } = chartSize(layout, cellSize);

  const ratio = useMemo(() => {
    const wanted = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const longest = Math.max(width, height);
    return Math.max(1, Math.min(wanted, 2, maxCanvasSide / longest));
  }, [width, height]);

  const drawn = useMemo(
    () => stitches.filter((stitch) => stitch.id !== 0),
    [stitches],
  );

  /**
   * Sizes a canvas for the chart, and says whether it had to be resized.
   *
   * Assigning to width or height reallocates the backing store and wipes it,
   * so it is only done when the size has actually changed - otherwise every
   * stitch worked would throw away two megapixels and make them again.
   */
  const size = (canvas: HTMLCanvasElement) => {
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    return true;
  };

  // The chart itself, redrawn only when the knitting or the wool changes.
  useLayoutEffect(() => {
    if (drawWith !== "canvas") return;
    const canvas = baseRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    size(canvas);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawChart(
      ctx,
      drawn,
      layout,
      palette,
      cellSize,
      token("--ink-faint", "#a29a91"),
      marked,
    );
    // Size is derived from the same values this already depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawn, layout, palette, width, height, ratio, drawWith]);

  /*
   * And the two things that change as you knit, on a sheet of their own over
   * the top. Keeping them separate is what makes a stitch cheap: the chart
   * underneath is never touched, so working one costs a clear and a rectangle
   * per round rather than redrawing ten thousand stitches.
   */
  useLayoutEffect(() => {
    if (drawWith !== "canvas") return;
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!size(canvas)) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    drawProgress(
      ctx,
      layout,
      rounds,
      progress,
      nextId,
      cellSize,
      token("--paper", "#eae7e4"),
      token("--crimson", "#bb2c43"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, rounds, progress, nextId, ratio, width, height, drawWith]);

  /*
   * A chart is read from the bottom right, so that is where it opens. Only
   * once: after that the knitter's own scrolling, and the follow below, decide
   * where it sits.
   */
  const opened = useRef(false);
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || opened.current) return;
    opened.current = true;
    scroller.scrollLeft = scroller.scrollWidth;
  }, []);

  const at = nextId === undefined ? undefined : layout.cells.get(nextId);

  // Sideways: keep the stitch being worked in the middle, so the chart follows
  // the knitter rather than having to be hunted for.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !at) return;
    const { x } = cellAt(layout, at.round, at.column, cellSize);
    scroller.scrollTo({
      left: Math.max(x - scroller.clientWidth / 2 + cellSize / 2, 0),
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [at, layout, cellSize]);

  /*
   * And down the page, but only when the round changes. Within a round the
   * stitch moves sideways, which the effect above handles, and scrolling the
   * page once per stitch would have the whole chart twitching.
   */
  const focusRound = at?.round;
  useEffect(() => {
    const sheets = scrollRef.current?.querySelector(".chart-sheets");
    if (!sheets || focusRound === undefined) return;
    const { y } = cellAt(layout, focusRound, 1, cellSize);
    /*
     * The panel is stuck to the bottom of the screen while you work, so the
     * part of the page you can see ends at its top edge. Its height, not
     * wherever it happens to be sitting: it comes unstuck at the very bottom
     * of the page and rides higher than it will once the page has scrolled.
     */
    const panel = document.querySelector<HTMLElement>(".knitting-panel");
    const floor = window.innerHeight - (panel?.offsetHeight ?? 0);
    const bottom = sheets.getBoundingClientRect().top + y + cellSize;
    const delta = bottom - (floor - clearance * cellSize);
    if (Math.abs(delta) < 1) return;
    window.scrollBy({ top: delta, behavior: reducedMotion() ? "auto" : "smooth" });
    // Re-aim only when the round changes; the rest is in the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRound, cellSize]);

  if (layout.rounds === 0) return <p>This pattern has no stitches to chart.</p>;

  return (
    <div className="chart-frame">
      {contrast && <ul className="chart-yarn-numbers">{Object.entries(palette).filter(([key], i, entries) => entries.findIndex(([other]) => yarnLabels[other] === yarnLabels[key]) === i).map(([key, yarn]) => <li key={key}>{yarnLabels[key]}: {yarn.name}</li>)}</ul>}
      <div
        className="chart-scroll"
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label="Scrollable knitting chart. Plus and minus zoom it."
        onKeyDown={(event) => {
          if (event.metaKey || event.ctrlKey || event.altKey) return;
          const step = event.key === "+" || event.key === "=" ? 4 : event.key === "-" ? -4 : 0;
          if (!step) return;
          event.preventDefault();
          zoomTo(Math.min(maxCell, Math.max(minCell, cellSize + step)));
        }}
      >
        <div
          ref={sheetRef}
          className="chart-sheets"
          style={{ width, height }}
          role="img"
          aria-label={
            `The chart: ${layout.columns} stitches at its widest and ` +
            `${layout.rounds} rounds.` +
            (marked.length > 0
              ? ` The work is turned inside out after ${
                  marked.length === 1 ? "round" : "rounds"
                } ${marked.join(", ")}.`
              : "") +
            (focusRound && labels?.[focusRound - 1]
              ? ` You are on ${labels[focusRound - 1]}.`
              : "") +
            (focusRound && regionsBelow(marked, focusRound) > 0
              ? " You are working it inside out."
              : "")
          }
        >
          {drawWith === "svg" ? (
            <ChartSvg
              stitches={drawn}
              rounds={rounds}
              layout={layout}
              palette={shownPalette}
              yarnLabels={contrast ? yarnLabels : undefined}
              progress={progress}
              nextStitchId={nextId}
              cell={cellSize}
              turns={marked}
            />
          ) : (
            <>
              <canvas ref={baseRef} style={{ width, height }} />
              <canvas ref={overlayRef} style={{ width, height }} />
            </>
          )}
        </div>
      </div>
      <StitchLegend stitches={stitches} notes={stitchNotes} />
      {writtenRounds && <details className="chart-help" onToggle={e => setShowText(e.currentTarget.open)}>
        <summary>Text round instructions</summary>
        <label>Read round <select value={follow && focusRound ? focusRound : textRound} disabled={follow && !!focusRound} onChange={e => setTextRound(Number(e.target.value))}>
          {rounds.map((_, i) => <option key={i} value={i + 1}>{i + 1} · {labels?.[i]}</option>)}
        </select></label>
        {showText && <TextRound stitches={stitches} rounds={rounds} round={follow && focusRound ? focusRound : textRound} labels={labels} palette={palette} />}
      </details>}
      <p className="chart-caption">
        {layout.columns} stitches at its widest, {layout.rounds} rounds. Read
        from the bottom right, working right to left; scroll sideways to see a
        whole round, and pinch to zoom. Where a round is shorter than the one below it, stitches
        have been decreased away.
      </p>
      {marked.length > 0 && (
        <p className="chart-caption chart-turn-note">
          <span className="chart-key-turn" aria-hidden="true" />
          <span>
            The work is turned inside out after{" "}
            {marked.length === 1 ? "round" : "rounds"} {marked.join(", ")}.
            Each rule divides two regions worked on opposite faces of the hat:
            the rounds below it go on the other way about, so they read back to
            front against the rounds above. Which, with the fold, is why a brim
            charted this way comes out the right way round once it is turned
            up.
          </span>
        </p>
      )}
    </div>
  );
};

export default Chart;
