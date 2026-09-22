import React, { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { hatById } from "../data/hats";
import { ballsFor, SlotId } from "../data/hats/types";
import { useHat } from "../knitting/useHat";
import {
  distinctShades,
  paletteOf,
  inkOn,
  yarnFor,
  type Overrides,
} from "../knitting/palette";
import { totals } from "../knitting/progress";
import { bareIdFor, knittingParam, startProject } from "../helpers/projects";
import PageLayout from "./ui/PageLayout";
import Button from "./ui/Button";
import HatModel from "./HatModel";
import Chart from "../knitting/Chart";
import YarnEditor from "./YarnEditor";
import { type Chosen } from "./YarnPicker";
import "./Hat.css";

/**
 * One hat: what it is, what it is made of, and a way to start knitting it.
 *
 * The size picker is the odd one out compared with the other two hat sites,
 * where you choose a stitch count. You cannot do that here - the designer
 * chose it, and every size of these patterns casts on the same number. What
 * a size changes is the needles and the tension, so what it changes here is
 * the measurements, not the chart.
 */
const Hat: React.FC = () => {
  const { hatId } = useParams();
  const navigate = useNavigate();
  const hat = hatId ? hatById(hatId) : undefined;

  const [sizeId, setSizeId] = useState(hat?.sizes[1]?.id ?? hat?.sizes[0]?.id ?? "");
  const [colourwayId, setColourwayId] = useState(hat?.colourways[0]?.id ?? "");
  /*
   * The wool a knitter has chosen for themselves. Held beside the colourway
   * rather than instead of it, so that "your own colours" starts from
   * whichever colourway is showing and changes only what you change.
   */
  const [own, setOwn] = useState<Overrides>({});

  if (!hat) {
    return (
      <PageLayout title="Not a hat we know">
        <p>
          <Link to="/">Back to the hats</Link>
        </p>
      </PageLayout>
    );
  }

  return (
    <HatPage
      key={hat.id}
      hatId={hat.id}
      sizeId={sizeId}
      setSizeId={setSizeId}
      colourwayId={colourwayId}
      setColourwayId={setColourwayId}
      own={own}
      setOwn={setOwn}
      navigate={navigate}
    />
  );
};

const HatPage: React.FC<{
  hatId: string;
  sizeId: string;
  setSizeId: (id: string) => void;
  colourwayId: string;
  setColourwayId: (id: string) => void;
  own: Overrides;
  setOwn: React.Dispatch<React.SetStateAction<Overrides>>;
  navigate: ReturnType<typeof useNavigate>;
}> = ({
  hatId,
  sizeId,
  setSizeId,
  colourwayId,
  setColourwayId,
  own,
  setOwn,
  navigate,
}) => {
  const hat = hatById(hatId)!;
  const { stitches, rounds, roundHeight, roundLabels, index } = useHat(hat);

  const size = hat.sizes.find((s) => s.id === sizeId) ?? hat.sizes[0];
  const colourway =
    hat.colourways.find((c) => c.id === colourwayId) ?? hat.colourways[0];
  const palette = useMemo(
    () => paletteOf(colourway, own, hat.charts),
    [colourway, own, hat],
  );
  const counts = totals(index, 0);
  const shades = distinctShades(colourway, own);
  const anyApproximate = shades.some((entry) => entry.yarn.approximate);
  const yours = Object.keys(own).length > 0;

  /** Whether the yarn-by-yarn editor is showing. */
  const [choosing, setChoosing] = useState(false);
  const choose = useCallback(
    (slot: SlotId, chosen: Chosen | undefined) =>
      setOwn((current) => {
        const next = { ...current };
        if (chosen) next[slot] = chosen;
        else delete next[slot];
        return next;
      }),
    [setOwn],
  );

  return (
    <PageLayout
      title={hat.name}
      eyebrow={`Shetland Wool Week ${hat.year}`}
      lede={`By ${hat.designer}`}
      aside={
        <Button
          variant="primary"
          onClick={() => {
            const project = startProject(hat.id, size.id, colourway.id, own);
            navigate(`/project/${bareIdFor(project.id)}?${knittingParam}=1`);
          }}
        >
          Start knitting this
        </Button>
      }
    >
      <div className="hat-layout">
        <div className="hat-stage">
          <HatModel
            hatId={hat.id}
            stitches={stitches}
            rounds={rounds}
            roundHeight={roundHeight}
            palette={palette}
            progress={stitches[stitches.length - 1]?.id ?? 0}
            target={{
              acrossCm: size.circumferenceCm / Math.PI,
              tallCm: size.lengthCm,
            }}
          />
          <p className="quiet hat-stage-note">
            Drag to turn it. {counts.total.toLocaleString()} stitches over{" "}
            {rounds.length} rounds.
          </p>
        </div>

        <div className="hat-about">
          <p>{hat.story}</p>
          <p>
            <a href={hat.patternUrl} target="_blank" rel="noreferrer">
              Buy the pattern from Shetland Wool Week
            </a>
            . {hat.credit}
            {hat.hashtag ? ` · ${hat.hashtag}` : ""}
          </p>
        </div>
      </div>

      <div className="peerie-rule" aria-hidden="true" />

      <section className="section">
        <h2>Colourway</h2>
        <div className="chooser">
          {hat.colourways.map((option) => {
            const optionPalette = paletteOf(option, {}, hat.charts);
            return (
              <button
                key={option.id}
                type="button"
                className={`colourway-option${option.id === colourway.id ? " is-chosen" : ""}`}
                aria-pressed={option.id === colourway.id}
                onClick={() => setColourwayId(option.id)}
              >
                <span className="colourway-swatches" aria-hidden="true">
                  {/*
                    The colourway's own wool, not the pattern's full set of
                    yarns: a hat drawn in parts can be offered in a colourway
                    that uses fewer than the pattern names, and 2026's last two
                    do. Asking for a yarn it has not got draws a grey blank.
                  */}
                  {option.shades.map((shade) => (
                    <span
                      key={shade.slot}
                      style={{ background: yarnFor(optionPalette, shade.slot).hex }}
                    />
                  ))}
                </span>
                <strong>{option.name}</strong>
                <span className="quiet">{option.brand}</span>
              </button>
            );
          })}
          {/*
            Not a colourway of the pattern's: whatever is showing, with the
            wool you have put in it. It sits with the others because that is
            where someone looks for it.
          */}
          <button
            type="button"
            className={`colourway-option${choosing || yours ? " is-chosen" : ""}`}
            aria-pressed={choosing || yours}
            // Nothing changed yet, so tapping it again just puts it away.
            onClick={() => setChoosing((open) => yours || !open)}
          >
            <span className="colourway-swatches" aria-hidden="true">
              {colourway.shades.map((shade) => (
                <span
                  key={shade.slot}
                  style={{ background: yarnFor(palette, shade.slot).hex }}
                />
              ))}
            </span>
            <strong>Your own colours</strong>
            <span className="quiet">
              {yours
                ? `${Object.keys(own).length} of your own`
                : "Yarn by yarn"}
            </span>
          </button>
        </div>

        <h3>What to buy</h3>
        <ul className="shade-list">
          {shades.map((entry) => (
            <li key={`${entry.yarn.name}-${entry.slots.join()}`}>
              <span
                className="shade-chip"
                style={{
                  background: entry.yarn.hex,
                  color: inkOn(entry.yarn.hex),
                }}
              >
                {entry.slots.join(" + ")}
              </span>
              <span>
                <strong>{entry.yarn.name}</strong>
                {entry.yarn.code ? ` (${entry.yarn.code})` : ""} ·{" "}
                {Math.max(
                  ...entry.slots.map((slot) =>
                    ballsFor(colourway, slot as SlotId, size.id),
                  ),
                )}{" "}
                ball
                {Math.max(
                  ...entry.slots.map((slot) =>
                    ballsFor(colourway, slot as SlotId, size.id),
                  ),
                ) === 1
                  ? ""
                  : "s"}
                {entry.yarn.approximate && (
                  <span className="quiet"> · colour approximate</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="quiet">
          {colourway.brand} {colourway.yarn}
          {colourway.ballMetres !== undefined &&
          colourway.ballGrams !== undefined
            ? `, ${colourway.ballMetres}m per ${colourway.ballGrams}g ball`
            : ""}{" "}
          ·{" "}
          <a href={colourway.url} target="_blank" rel="noreferrer">
            {colourway.url.replace(/^https?:\/\//, "")}
          </a>
        </p>
        <p className="quiet">
          The colours come from the spinners' own photographs of the wool, so
          they are close rather than exact.
          {anyApproximate
            ? " Two of these spinners do not sell online in a form that can be" +
              " read, so their shades are considered stand-ins."
            : ""}
        </p>

        {(choosing || yours) && (
          <>
            <h3>Your wool</h3>
            <p className="quiet">
              Any of these can be the ball actually in your hands - out of the
              whole Shetland library, or any colour you like.
            </p>
            <YarnEditor
              slots={colourway.shades.map((shade) => shade.slot)}
              palette={palette}
              overrides={own}
              onChange={choose}
              suggest={colourway.wool}
            />
            {yours && (
              <p>
                <Button variant="quiet" onClick={() => setOwn({})}>
                  Back to {colourway.name} throughout
                </Button>
              </p>
            )}
          </>
        )}
      </section>



      <section className="section">
        <h2>Size</h2>
        <div className="chooser">
          {hat.sizes.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`size-option${option.id === size.id ? " is-chosen" : ""}`}
              aria-pressed={option.id === size.id}
              onClick={() => setSizeId(option.id)}
            >
              <strong>{option.label}</strong>
              <span className="quiet">to fit {option.toFitCm}cm</span>
            </button>
          ))}
        </div>
        <dl className="measurements">
          <div>
            <dt>Finished circumference</dt>
            <dd>{size.circumferenceCm}cm</dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>{size.lengthCm}cm</dd>
          </div>
          <div>
            <dt>Tension</dt>
            <dd>
              {size.stitchesPer10cm} sts &amp; {size.roundsPer10cm} rounds to
              10cm
            </dd>
          </div>
          <div>
            <dt>Needles</dt>
            <dd>
              {size.ribNeedlesMm ? `${size.ribNeedlesMm}mm rib, ` : ""}
              {size.needlesMm}mm
            </dd>
          </div>
        </dl>
        <p className="quiet">
          Every size of this hat casts on the same number of stitches; the size
          is in the needles and the tension, so the chart is the same whichever
          you knit.
        </p>
      </section>

      <section className="section">
        <h2>The chart</h2>
        <Chart
          stitches={stitches}
          rounds={rounds}
          palette={palette}
          progress={0}
          labels={roundLabels}
        />
      </section>
    </PageLayout>
  );
};

export default Hat;
