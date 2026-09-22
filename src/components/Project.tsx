import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { hatById } from "../data/hats";
import { SlotId } from "../data/hats/types";
import { useHat } from "../knitting/useHat";
import { paletteOf, yarnFor } from "../knitting/palette";
import { totals, positionOf } from "../knitting/progress";
import {
  Project as SavedProject,
  knittingParam,
  readProject,
  writeProject,
} from "../helpers/projects";
import PageLayout from "./ui/PageLayout";
import Button from "./ui/Button";
import ProgressRing from "./ProgressRing";
import HatModel from "./HatModel";
import Chart from "../knitting/Chart";
import KnittingPanel from "./KnittingPanel";
import YarnEditor from "./YarnEditor";
import { type Chosen } from "./YarnPicker";
import "./Project.css";

/**
 * A project: one hat, one knitter, one row counter.
 *
 * Progress is written straight to storage on every change, because the thing
 * that actually happens to a knitting app is that the phone locks mid-round.
 * Undo is one step and lives only in memory, which is the right size for the
 * mistake it exists to fix - a stitch counted twice.
 */
const Project: React.FC = () => {
  const { projectId } = useParams();
  const [params, setParams] = useSearchParams();
  const [project, setProject] = useState<SavedProject | undefined>(() =>
    projectId ? readProject(projectId) : undefined,
  );
  const [previous, setPrevious] = useState<number>();

  const knitting = params.get(knittingParam) === "1";
  const hat = project ? hatById(project.hatId) : undefined;

  useEffect(() => {
    if (projectId) setProject(readProject(projectId));
  }, [projectId]);

  const setProgress = useCallback(
    (next: number) => {
      setProject((current) => {
        if (!current) return current;
        setPrevious(current.progress);
        return writeProject({ ...current, progress: Math.max(next, 0) });
      });
    },
    [],
  );

  const undo = useCallback(() => {
    if (previous === undefined) return;
    setProject((current) =>
      current ? writeProject({ ...current, progress: previous }) : current,
    );
    setPrevious(undefined);
  }, [previous]);

  const setColourway = useCallback((colourwayId: string) => {
    setProject((current) =>
      current ? writeProject({ ...current, colourwayId }) : current,
    );
  }, []);

  const setShade = useCallback((slot: SlotId, chosen: Chosen | undefined) => {
    setProject((current) => {
      if (!current) return current;
      const shades = { ...current.shades };
      if (chosen) shades[slot] = chosen;
      else delete shades[slot];
      return writeProject({
        ...current,
        shades: Object.keys(shades).length > 0 ? shades : undefined,
      });
    });
  }, []);

  if (!project || !hat) {
    return (
      <PageLayout title="No such project">
        <p>
          It may have been deleted, or saved in another browser.{" "}
          <Link to="/">Back to the hats</Link>.
        </p>
      </PageLayout>
    );
  }

  return (
    <ProjectView
      hatId={hat.id}
      project={project}
      knitting={knitting}
      setKnitting={(on) => {
        const next = new URLSearchParams(params);
        if (on) next.set(knittingParam, "1");
        else next.delete(knittingParam);
        setParams(next, { replace: true });
      }}
      setProgress={setProgress}
      undo={undo}
      canUndo={previous !== undefined}
      setColourway={setColourway}
      setShade={setShade}
    />
  );
};

const ProjectView: React.FC<{
  hatId: string;
  project: SavedProject;
  knitting: boolean;
  setKnitting: (on: boolean) => void;
  setProgress: (next: number) => void;
  undo: () => void;
  canUndo: boolean;
  setColourway: (id: string) => void;
  setShade: (slot: SlotId, chosen: Chosen | undefined) => void;
}> = ({
  hatId,
  project,
  knitting,
  setKnitting,
  setProgress,
  undo,
  canUndo,
  setColourway,
  setShade,
}) => {
  const hat = hatById(hatId)!;
  const { stitches, rounds, roundHeight, roundLabels, index } = useHat(hat);

  const colourway =
    hat.colourways.find((c) => c.id === project.colourwayId) ?? hat.colourways[0];
  const size = hat.sizes.find((s) => s.id === project.sizeId) ?? hat.sizes[0];
  const palette = useMemo(
    () => paletteOf(colourway, project.shades, hat.charts),
    [colourway, project.shades, hat.charts],
  );

  const counts = totals(index, project.progress);
  const position = positionOf(stitches, project.progress, index);

  return (
    <PageLayout
      title={project.name ?? hat.name}
      eyebrow={`Shetland Wool Week ${hat.year} · ${size.label} · ${colourway.name}`}
      showTitle={!knitting}
      aside={
        !knitting && (
          <Button variant="primary" onClick={() => setKnitting(true)}>
            {counts.worked > 0 ? "Keep knitting" : "Start knitting"}
          </Button>
        )
      }
    >
      {!knitting && (
        <>
          <div className="project-layout">
            <div className="project-stage">
              <HatModel
                hatId={hat.id}
                stitches={stitches}
                rounds={rounds}
                roundHeight={roundHeight}
                palette={palette}
                progress={project.progress}
                target={{
                  acrossCm: size.circumferenceCm / Math.PI,
                  tallCm: size.lengthCm,
                }}
              />
              <p className="quiet hat-stage-note">
                The wool fills in as you knit. Drag to turn it.
              </p>
            </div>
            <div className="project-figures">
              <ProgressRing percent={counts.percent} />
              <dl className="measurements">
                <div>
                  <dt>Knitted</dt>
                  <dd>
                    {counts.worked.toLocaleString()} of{" "}
                    {counts.total.toLocaleString()} stitches
                  </dd>
                </div>
                <div>
                  <dt>Round</dt>
                  <dd>
                    {position.finished
                      ? "Finished"
                      : `${position.round} of ${position.totalRounds}`}
                  </dd>
                </div>
                <div>
                  <dt>Left to go</dt>
                  <dd>{counts.remaining.toLocaleString()} stitches</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="peerie-rule" aria-hidden="true" />

          <section className="section">
            <h2>Your wool</h2>
            <p className="quiet">
              Set any of these to the ball actually in your hands - out of the
              whole Shetland library, or any colour you like - and the chart
              and the hat will follow.
            </p>
            <YarnEditor
              slots={colourway.shades.map((shade) => shade.slot)}
              palette={palette}
              overrides={project.shades ?? {}}
              onChange={setShade}
              suggest={colourway.wool}
            />
            <div className="chooser">
              {hat.colourways.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`size-option${option.id === colourway.id ? " is-chosen" : ""}`}
                  aria-pressed={option.id === colourway.id}
                  onClick={() => setColourway(option.id)}
                >
                  <strong>{option.name}</strong>
                  <span className="quiet">{option.brand}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="section">
        {!knitting && <h2>The chart</h2>}
        <Chart
          stitches={stitches}
          rounds={rounds}
          palette={palette}
          progress={project.progress}
          follow={knitting}
          labels={roundLabels}
        />
        <ul className="chart-key">
          {hat.slots.map((slot) => (
            <li key={slot}>
              <span
                className="swatch"
                style={{ background: yarnFor(palette, slot).hex }}
              />
              {slot} · {yarnFor(palette, slot).name}
            </li>
          ))}
        </ul>
      </section>

      {knitting && (
        <KnittingPanel
          stitches={stitches}
          index={index}
          palette={palette}
          progress={project.progress}
          setProgress={setProgress}
          onStop={() => setKnitting(false)}
          canUndo={canUndo}
          onUndo={undo}
        />
      )}
    </PageLayout>
  );
};

export default Project;
