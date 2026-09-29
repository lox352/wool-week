import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import type { Colourway, HatPattern } from "../data/hats/types";
import { ownBalls, paletteOf, type Overrides, type Palette } from "../knitting/palette";
import BodyStrip from "./BodyStrip";
import { bodyRounds, stitchScale } from "./bodyScale";
import type { Body } from "./ColourPreview";
import Dialog from "./ui/Dialog";
import "./ColourwayChoice.css";

const balls = (n: number) => `${n} ${n === 1 ? "yarn" : "yarns"}`;

/** How tall the strip grows to once it is the banner, in CSS pixels. */
const BANNER = 96;
/** How far the page scrolls while the strip opens out into the banner. */
const OPEN = 96;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const between = (from: number, to: number, at: number) => from + (to - from) * at;

/**
 * The colourway's strip, which becomes the banner at the top of the screen
 * once the page scrolls it there, so the hat stays in sight while the wool
 * below is chosen.
 *
 * Reaching the top, it stays, and opens out to the banner, taller and wider
 * together, smoothly, as the page scrolls on. The banner is drawn once, at
 * its full size and crisp, and shown through a window: at first shrunk to
 * match the strip exactly, stitch for stitch, then growing about the strip's
 * middle while the window opens like curtains onto more of the hat on either
 * side. Nothing slides sideways, and nothing is redrawn while it moves. It is
 * pushed off again with the end of `until`, where the choosing ends.
 */
const DockingStrip: React.FC<{ body: Body; palette: Palette; until?: RefObject<Element> }> = ({ body, palette, until }) => {
  const slot = useRef<HTMLDivElement>(null);
  const window_ = useRef<HTMLDivElement>(null);
  const banner = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => bodyRounds(body.rounds).length, [body.rounds]);

  useEffect(() => {
    let frame = 0;
    const place = () => {
      frame = 0;
      const own = slot.current?.getBoundingClientRect();
      const strip = slot.current?.firstElementChild?.getBoundingClientRect();
      const shown = window_.current;
      const drawn = banner.current;
      if (!own || !strip || !shown || !drawn) return;
      const screen = document.documentElement.clientWidth;
      drawn.style.width = `${screen}px`;
      if (own.top > 0) {
        shown.style.visibility = "hidden";
        return;
      }
      const open = clamp(-own.top / OPEN);
      const density = window.devicePixelRatio || 1;

      // The window: from the strip in the card to the banner across the top.
      const height = between(own.height, BANNER, open);
      const end = until?.current?.getBoundingClientRect().bottom ?? Infinity;
      const top = Math.min(0, end - height);
      const left = between(own.left, 0, open);
      Object.assign(shown.style, {
        visibility: "visible",
        top: `${top}px`,
        left: `${left}px`,
        right: `${between(screen - own.right, 0, open)}px`,
        height: `${height}px`,
      });
      shown.style.setProperty("--open", String(open));

      // The banner in it: at first the same size as the strip's stitches,
      // and in the same place, then its own, about the strip's middle.
      const small = stitchScale(strip.height * density, rows);
      const large = stitchScale(BANNER * density, rows);
      const smallTop = Math.round((strip.height * density - rows * small) / 2) / density;
      const largeTop = Math.round((BANNER * density - rows * large) / 2) / density;
      const from = small / large;
      const scale = between(from, 1, open);
      const middle = between(strip.left + strip.width / 2, screen / 2, open);
      const down = between(strip.top - own.top + smallTop - from * largeTop, 0, open);
      drawn.style.transform = `translate(${middle - (scale * screen) / 2 - left}px, ${down}px) scale(${scale})`;
    };
    const later = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", later);
      window.removeEventListener("resize", later);
    };
  }, [until, rows]);

  return (
    <>
      <div className="your-colourway-slot" ref={slot}>
        <BodyStrip {...body} palette={palette} className="your-colourway-strip" centred />
      </div>
      <div className="colourway-banner" ref={window_} aria-hidden="true">
        <div className="colourway-banner-hat" ref={banner}>
          <BodyStrip {...body} palette={palette} centred />
        </div>
      </div>
    </>
  );
};

/**
 * The hat's colours: there is only ever the knitter's own colourway.
 *
 * The pattern's colourways are starting points. Choosing one sets every
 * yarn to it, and none of them is marked as chosen afterwards, because once
 * a yarn is changed the hat isn't any of them. Starting again over wool of
 * the knitter's own asks first, since it can't be undone.
 */
const ColourwayChoice: React.FC<{
  hat: HatPattern;
  colourways: Colourway[];
  colourway: Colourway;
  sizeId: string;
  overrides: Overrides;
  palette: Palette;
  body: Body;
  onStartFrom: (colourwayId: string) => void;
  /** Where choosing the wool ends, and the strip stops being the banner. */
  until?: RefObject<Element>;
}> = ({ hat, colourways, colourway, sizeId, overrides, palette, body, onStartFrom, until }) => {
  const [asking, setAsking] = useState<Colourway>();
  const own = ownBalls(colourway, sizeId, overrides);
  const choose = (option: Colourway) => {
    if (own > 0) setAsking(option);
    else if (option.id !== colourway.id) onStartFrom(option.id);
  };

  return (
    <>
      <div className="your-colourway">
        <DockingStrip body={body} palette={palette} until={until} />
        <strong>Your colourway</strong>
        <span className="quiet">
          {own > 0
            ? `Started from ${colourway.name}, with ${balls(own)} of your own`
            : `${colourway.name}, as the pattern gives it · ${colourway.brand}`}
        </span>
      </div>
      <p className="colourway-starts-title">
        {own > 0 ? "Start again from one of the pattern's" : "Start from one of the pattern's"}
      </p>
      <div className="chooser colourway-starts">
        {/* All of them, always: choosing the one you're already on changes nothing. */}
        {colourways.map((option) => (
          <button key={option.id} type="button" className="colourway-option" onClick={() => choose(option)}>
            <BodyStrip {...body} palette={paletteOf(option, {}, hat.charts)} className="colourway-motif" />
            <strong>{option.name}</strong>
            <span className="quiet">{option.brand}</span>
          </button>
        ))}
      </div>
      <Dialog
        open={asking !== undefined}
        title={`Start again from ${asking?.name ?? ""}?`}
        text={`Every yarn changes to ${asking?.name ?? ""}'s, including the ${own === 1 ? "one" : own} of your own.`}
        confirmLabel="Start again"
        onConfirm={() => {
          if (asking) onStartFrom(asking.id);
          setAsking(undefined);
        }}
        onCancel={() => setAsking(undefined)}
      />
    </>
  );
};

export default ColourwayChoice;
