/**
 * Prototypes: ways of showing a colourway you have changed. Chosen by
 * `?cw=` in the address, on a project's overview:
 *
 *   mine    changing a yarn makes a tile of your own, "My colourway"
 *   saved   the same, but you can keep several, each named
 *   badge   the pattern's tile shows your colours and says what changed
 *   start   the pattern's colourways are only a starting point
 *
 * Add `&ask=1` to see what switching colourway asks, where it asks anything.
 */
import React from "react";
import type { Colourway } from "../../data/hats/types";
import { paletteOf, type Overrides, type Palette } from "../../knitting/palette";
import type { HatPattern } from "../../data/hats/types";
import BodyStrip from "../../components/BodyStrip";
import type { Body } from "../../components/ColourPreview";
import Button from "../../components/ui/Button";
import "./Options.css";

export const colourwayPrototype = (): string | undefined => {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("cw") ?? undefined;
};
const asking = () => new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("ask") === "1";

interface Props {
  hat: HatPattern;
  colourways: Colourway[];
  colourway: Colourway;
  overrides: Overrides;
  palette: Palette;
  body: Body;
}

const changedCount = (overrides: Overrides) => Object.keys(overrides).length;
const yarns = (n: number) => `${n} ${n === 1 ? "yarn" : "yarns"}`;

const Tile: React.FC<{
  body: Body;
  palette: Palette;
  name: string;
  detail: React.ReactNode;
  chosen?: boolean;
  mine?: boolean;
  tools?: React.ReactNode;
}> = ({ body, palette, name, detail, chosen, mine, tools }) => (
  <div className={`colourway-option cw-tile${chosen ? " is-chosen" : ""}${mine ? " cw-mine" : ""}`}>
    {tools && <span className="cw-tools">{tools}</span>}
    <BodyStrip {...body} palette={palette} className="colourway-motif" />
    <strong>{name}</strong>
    <span className="quiet">{detail}</span>
  </div>
);

const Ask: React.FC<{ title: string; text: string; yes: string; no: string }> = ({ title, text, yes, no }) => (
  <div className="cw-ask" role="dialog" aria-label={title}>
    <strong>{title}</strong>
    <p>{text}</p>
    <div className="cw-ask-actions">
      <Button variant="secondary">{no}</Button>
      <Button variant="primary">{yes}</Button>
    </div>
  </div>
);

export const ColourwayOptions: React.FC<Props> = ({ hat, colourways, colourway, overrides, palette, body }) => {
  const kind = colourwayPrototype();
  const n = changedCount(overrides);
  const original = (c: Colourway) => paletteOf(c, {}, hat.charts);
  const others = colourways.filter((c) => c.id !== colourway.id);
  const del = <button type="button" className="cw-icon" aria-label="Delete">×</button>;
  const edit = <button type="button" className="cw-icon" aria-label="Rename">✎</button>;

  if (kind === "mine") {
    return (
      <>
        <div className="chooser">
          <Tile body={body} palette={palette} name="My colourway" detail={`From ${colourway.name} · ${yarns(n)} changed`} chosen mine tools={del} />
          {colourways.map((c) => (
            <Tile key={c.id} body={body} palette={original(c)} name={c.name} detail={c.brand} />
          ))}
        </div>
        <p className="quiet cw-note">
          Changing any yarn made <em>My colourway</em>, and Vintage stays as the pattern has it. Tap Vintage to go back to it: your
          own stays here to come back to. The × deletes it. Changing a yarn again changes My colourway.
        </p>
        {asking() && (
          <Ask
            title="Delete My colourway?"
            text={`Your ${yarns(n)} go, and the hat goes back to ${colourway.name}.`}
            yes="Delete"
            no="Keep it"
          />
        )}
      </>
    );
  }

  if (kind === "saved") {
    const autumn = paletteOf(colourway, { ...overrides, C: { name: "Rust", hex: "#a4532e" }, D: { name: "Gold", hex: "#d9a441" } }, hat.charts);
    return (
      <>
        <div className="chooser">
          <Tile body={body} palette={palette} name="Poppy and sky" detail={`From ${colourway.name} · ${yarns(n)} changed`} chosen mine tools={<>{edit}{del}</>} />
          <Tile body={body} palette={autumn} name="Autumn" detail={`From ${colourway.name} · ${yarns(n + 2)} changed`} mine tools={<>{edit}{del}</>} />
          {colourways.map((c) => (
            <Tile key={c.id} body={body} palette={original(c)} name={c.name} detail={c.brand} />
          ))}
        </div>
        <p className="quiet cw-note">
          Changing a yarn on a pattern colourway makes a new one of your own, named for you to change. Changing a yarn on one of
          yours changes that one. Keep as many as you like, and flick between them to compare.
        </p>
        {asking() && (
          <Ask title="Name this colourway" text="Poppy and sky" yes="Save" no="Cancel" />
        )}
      </>
    );
  }

  if (kind === "badge") {
    return (
      <>
        <div className="chooser">
          <Tile
            body={body}
            palette={palette}
            name={colourway.name}
            detail={
              <>
                <span className="cw-pill">{yarns(n)} changed</span> <button type="button" className="cw-link">Reset</button>
              </>
            }
            chosen
          />
          {others.map((c) => (
            <Tile key={c.id} body={body} palette={original(c)} name={c.name} detail={c.brand} />
          ))}
        </div>
        <p className="quiet cw-note">
          One colourway at a time, shown honestly: the chosen tile is your hat as it is, and says how much of it is yours. Reset puts
          the pattern's yarns back.
        </p>
        {asking() && (
          <Ask
            title="Switch to Kaleyard?"
            text={`You've changed ${yarns(n)} in ${colourway.name}. Kaleyard replaces every yarn, yours too.`}
            yes="Switch"
            no={`Keep ${colourway.name}`}
          />
        )}
      </>
    );
  }

  if (kind === "start") {
    return (
      <>
        <div className="cw-yours">
          <BodyStrip {...body} palette={palette} className="cw-yours-strip" />
          <div>
            <strong>Your colourway</strong>
            <span className="quiet">
              Started from {colourway.name}, with {yarns(n)} of your own
            </span>
          </div>
        </div>
        <p className="cw-start-title">Start again from one of the pattern's</p>
        <div className="chooser cw-small">
          {colourways.map((c) => (
            <Tile key={c.id} body={body} palette={original(c)} name={c.name} detail={c.brand} />
          ))}
        </div>
        <p className="quiet cw-note">
          There is only ever your colourway. The pattern's are starting points: choosing one sets every yarn, and nothing is
          highlighted afterwards, because your hat isn't any of them once you've changed it.
        </p>
        {asking() && (
          <Ask
            title="Start again from Kaleyard?"
            text={`Every yarn changes to Kaleyard's, including your ${yarns(n)}.`}
            yes="Start again"
            no="Cancel"
          />
        )}
      </>
    );
  }

  return null;
};
