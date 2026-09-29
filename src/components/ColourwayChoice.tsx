import React, { useState } from "react";
import type { Colourway, HatPattern } from "../data/hats/types";
import { ownBalls, paletteOf, type Overrides, type Palette } from "../knitting/palette";
import BodyStrip from "./BodyStrip";
import type { Body } from "./ColourPreview";
import Dialog from "./ui/Dialog";
import "./ColourwayChoice.css";

const balls = (n: number) => `${n} ${n === 1 ? "yarn" : "yarns"}`;

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
}> = ({ hat, colourways, colourway, sizeId, overrides, palette, body, onStartFrom }) => {
  const [asking, setAsking] = useState<Colourway>();
  const own = ownBalls(colourway, sizeId, overrides);
  const choose = (option: Colourway) => {
    if (own > 0) setAsking(option);
    else if (option.id !== colourway.id) onStartFrom(option.id);
  };

  return (
    <>
      <div className="your-colourway">
        <BodyStrip {...body} palette={palette} className="your-colourway-strip" />
        <strong>Your colourway</strong>
        <span className="quiet">
          {own > 0
            ? `Started from ${colourway.name}, with ${balls(own)} of your own`
            : `${colourway.name}, as the pattern gives it · ${colourway.brand}`}
        </span>
      </div>
      <p className="colourway-starts-title">
        {own > 0 ? "Start again from one of the pattern's" : "Or start from another of the pattern's"}
      </p>
      <div className="chooser colourway-starts">
        {/* Back to where you started is only a choice once some of the wool is yours. */}
        {colourways.filter((option) => own > 0 || option.id !== colourway.id).map((option) => (
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
