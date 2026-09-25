import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { hatById } from "../data/hats";
import { SlotId } from "../data/hats/types";
import { useHat } from "../knitting/useHat";
import { ballsOf, paletteOf, type Overrides } from "../knitting/palette";
import { totals } from "../knitting/progress";
import { chartPath, startProject } from "../helpers/projects";
import PageLayout from "./ui/PageLayout";
import Button from "./ui/Button";
import HatModel from "./HatModel";
import WoolList from "./WoolList";
import { type Chosen } from "./YarnPicker";
import NextStep from "./ui/NextStep";
import BodyStrip from "./BodyStrip";
import { PreviewBanner } from "./ColourPreview";
import "./Hat.css";

/**
 * One hat: what it is, what it is made of, and a way to start knitting it.
 *
 * Most hats use one knitting script at every size, but a pattern is allowed
 * to change its stitch counts and chart sequence by size. Shwook does: Size 1
 * is shorter and takes a different route through the charts.
 */
const Hat: React.FC = () => {
  const { hatId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hat = hatId ? hatById(hatId) : undefined;
  const requestedSize = params.get("size");
  const initialSize =
    (requestedSize && hat?.sizes.some((size) => size.id === requestedSize)
      ? requestedSize
      : undefined) ??
    hat?.sizes[1]?.id ??
    hat?.sizes[0]?.id ??
    "";

  const [sizeId, setSizeId] = useState(initialSize);
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
  const size = hat.sizes.find((s) => s.id === sizeId) ?? hat.sizes[0];
  const stageRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLElement>(null);
  const { stitches, rounds, roundHeight, index } =
    useHat(hat, size.id);

  useEffect(() => {
    (window as unknown as { __hatSizeIds?: string[] }).__hatSizeIds =
      hat.sizes.map((candidate) => candidate.id);
  }, [hat]);
  const colourways = hat.colourways.filter(c => !c.sizeIds || c.sizeIds.includes(size.id));
  const colourway = colourways.find((c) => c.id === colourwayId) ?? colourways[0];
  const palette = useMemo(
    () => paletteOf(colourway, own, hat.charts),
    [colourway, own, hat],
  );
  const counts = totals(index, 0);
  const anyApproximate = ballsOf(colourway, size.id, own).some(
    (ball) => ball.yarn.approximate,
  );

  /*
   * A ball of wool does every yarn of the pattern it is put in, so choosing
   * one sets them together. See WoolList.
   */
  const choose = useCallback(
    (slots: SlotId[], chosen: Chosen | undefined) =>
      setOwn((current) => {
        const next = { ...current };
        slots.forEach((slot) => {
          if (chosen) next[slot] = chosen;
          else delete next[slot];
        });
        return next;
      }),
    [setOwn],
  );

  // A project is made only now, so browsing hats never leaves one behind.
  const start = () => {
    const project = startProject(hat.id, size.id, colourway.id, own);
    navigate(chartPath(project.id, true));
  };

  const body = useMemo(() => ({ stitches, rounds }), [stitches, rounds]);
  const stageEl = (
        <div className="hat-stage" ref={stageRef}>
          <HatModel
            hatId={hat.id}
            sizeId={size.id}
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
  );
  const aboutEl = (
        <div className="hat-about">
          <p>{hat.story}</p>
          <p>
            <a href={hat.patternUrl} target="_blank" rel="noreferrer">
              Pattern source
            </a>
            . {hat.credit}
            {hat.hashtag ? ` · ${hat.hashtag}` : ""}
          </p>
        </div>
  );
  const colourEl = (
      <section className="section" ref={choicesRef}>
        <h2>Colourway</h2>
        <div className="chooser">
          {colourways.map((option) => {
            const optionPalette = paletteOf(option, {}, hat.charts);
            return (
              <button
                key={option.id}
                type="button"
                className={`colourway-option${option.id === colourway.id ? " is-chosen" : ""}`}
                aria-pressed={option.id === colourway.id}
                onClick={() => setColourwayId(option.id)}
              >
                                <BodyStrip {...body} palette={optionPalette} className="colourway-motif" />
                <strong>{option.name}</strong>
                <span className="quiet">{option.brand}</span>
              </button>
            );
          })}
        </div>

        <h3>Your wool</h3>
        <WoolList
          colourway={colourway}
          sizeId={size.id}
          overrides={own}
          onChange={choose}
          onRestoreAll={() => setOwn({})}
          body={body}
          palette={palette}
        />

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
            ? " Some shades use approximate colours where an exact match" +
              " is unavailable. These are marked in the wool list."
            : ""}
        </p>
      </section>
  );
  const sizeEl = (
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
              {option.toFitCm !== undefined && (
                <span className="quiet">to fit {option.toFitCm}cm</span>
              )}
              {option.toFitRangeCm && <span className="quiet">to fit {option.toFitRangeCm.join("–")}cm</span>}
            </button>
          ))}
        </div>
        <dl className="measurements">
          <div>
            <dt>{size.circumferenceLabel ?? "Finished circumference"}</dt>
            <dd>{size.circumferenceCm}cm{size.circumferenceEstimated ? " (estimated)" : ""}</dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>{size.lengthCm}cm{size.lengthEstimated ? " (estimated)" : ""}</dd>
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
        {size.measurementNote && <p className="measurement-note">{size.measurementNote}</p>}
        <p className="quiet">
          {hat.sizes.some((option) => option.sections)
            ? "This pattern changes its stitch counts and round sequence by size; " +
              "the chart follows the size you select."
            : "Every size of this hat uses the same knitting; the size is in " +
              "the needles and tension."}
        </p>
      </section>
  );

  return (
    <PageLayout
      title={hat.name}
      eyebrow={`Shetland Wool Week ${hat.year}`}
      lede={`By ${hat.designer}`}
      aside={
        <Button variant="primary" onClick={start}>
          Start knitting this
        </Button>
      }
    >
          <div className="hat-layout">
            {stageEl}
            {aboutEl}
          </div>
          <div className="peerie-rule" aria-hidden="true" />
          {colourEl}
          {sizeEl}
      <PreviewBanner body={body} palette={palette} stage={stageRef} choices={choicesRef} />

      <NextStep
        title="Ready to cast on?"
        detail={
          `${colourway.name}, ${size.label.toLowerCase()} size: ` +
          `${counts.total.toLocaleString()} stitches over ${rounds.length} rounds. ` +
          "Your progress is saved in this browser as you go."
        }
      >
        <Button variant="primary" size="lg" onClick={start}>
          Start knitting
        </Button>
      </NextStep>
    </PageLayout>
  );
};

export default Hat;
