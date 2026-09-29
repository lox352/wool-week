import React, { RefObject, useEffect, useRef, useState } from "react";
import type { Colourway, HatPattern } from "../data/hats/types";
import { ownBalls, paletteOf, type Overrides, type Palette } from "../knitting/palette";
import BodyStrip from "./BodyStrip";
import type { Body } from "./ColourPreview";
import Dialog from "./ui/Dialog";
import "./ColourwayChoice.css";

const balls = (n: number) => `${n} ${n === 1 ? "yarn" : "yarns"}`;

/** How tall the strip grows to once it is the banner, in CSS pixels. */
const BANNER = 96;
/** How far the page scrolls while the banner widens to the screen's edges. */
const WIDEN = 64;
const clamp = (x: number) => Math.min(1, Math.max(0, x));

/**
 * The colourway's strip, which becomes the banner at the top of the screen
 * once the page scrolls it there, so the hat stays in sight while the wool
 * below is chosen. Reaching the top, it stays, and grows: first taller, to
 * the banner's height, then wider, to the screen's edges. Wider shows more
 * of the hat, not the same stretched, because the strip repeats round it.
 * It is pushed off again with the end of `until`, where the choosing ends.
 */
const DockingStrip: React.FC<{ body: Body; palette: Palette; until?: RefObject<Element> }> = ({ body, palette, until }) => {
  const slot = useRef<HTMLDivElement>(null);
  const [dock, setDock] = useState<React.CSSProperties & { "--dock"?: number }>();
  const [banner, setBanner] = useState(false);

  useEffect(() => {
    let frame = 0;
    const place = () => {
      frame = 0;
      const own = slot.current?.getBoundingClientRect();
      if (!own || own.top > 0) {
        setDock(undefined);
        setBanner(false);
        return;
      }
      const scrolled = -own.top;
      const grow = Math.max(0, BANNER - own.height);
      const height = own.height + Math.min(scrolled, grow);
      const widen = grow === 0 ? clamp(scrolled / WIDEN) : clamp((scrolled - grow) / WIDEN);
      const screen = document.documentElement.clientWidth;
      const end = until?.current?.getBoundingClientRect().bottom ?? Infinity;
      setDock({
        position: "fixed",
        top: Math.min(0, end - height),
        left: own.left * (1 - widen),
        right: (screen - own.right) * (1 - widen),
        height,
        margin: 0,
        borderRadius: 2 * (1 - widen),
        "--dock": widen,
      });
      setBanner(widen >= 1);
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
  }, [until]);

  return (
    <div className="your-colourway-slot" ref={slot}>
      <BodyStrip
        {...body}
        palette={palette}
        className={`your-colourway-strip${dock ? " is-docked" : ""}${banner ? " is-banner" : ""}`}
        style={dock}
      />
    </div>
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
