import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  projectsChanged,
  writeProject,
} from "../helpers/projects";
import PageLayout from "./ui/PageLayout";
import Button from "./ui/Button";
import ProgressRing from "./ProgressRing";
import HatModel from "./HatModel";
import Chart from "../knitting/Chart";
import KnittingPanel from "./KnittingPanel";
import WoolList from "./WoolList";
import { type Chosen } from "./YarnPicker";
import "./Project.css";

/**
 * A project: one hat, one knitter, one row counter.
 *
 * Progress is written straight to storage on every change, because the thing
 * that actually happens to a knitting app is that the phone locks mid-round.
 * Undo steps back through every change made in this visit, and lives only in
 * memory: it is for a run tapped twice or a jump to the wrong stitch, not a
 * record of the project.
 */
/** How many changes Undo can step back through. */
const undoLimit = 100;

const Project: React.FC = () => {
  const { projectId } = useParams();
  const [params, setParams] = useSearchParams();
  const [project, setProject] = useState<SavedProject | undefined>(() =>
    projectId ? readProject(projectId) : undefined,
  );
  /** Where progress was before each change, most recent last. */
  const [history, setHistory] = useState<number[]>([]);
  const currentProject = useRef(project);
  const adopt = useCallback((next: SavedProject | undefined) => {
    currentProject.current = next;
    setProject(next);
  }, []);
  const change = useCallback((edit: (current: SavedProject) => SavedProject) => {
    const current = currentProject.current;
    if (current) adopt(writeProject(edit(current)));
  }, [adopt]);

  const knitting = params.get(knittingParam) === "1";
  const hat = project ? hatById(project.hatId) : undefined;

  useEffect(() => {
    adopt(projectId ? readProject(projectId) : undefined);
    setHistory([]);
    const refresh = (event: StorageEvent) => {
      if (event.key === null || event.key === `project-${projectId}`) {
        adopt(projectId ? readProject(projectId) : undefined);
        setHistory([]);
      }
    };
    window.addEventListener("storage", refresh);
    const refreshLocal = () => {
      const next = projectId ? readProject(projectId) : undefined;
      if (next?.updatedAt !== currentProject.current?.updatedAt) setHistory([]);
      adopt(next);
    };
    window.addEventListener(projectsChanged, refreshLocal);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(projectsChanged, refreshLocal);
    };
  }, [projectId, adopt]);

  const setProgress = useCallback(
    (next: number) => {
      change((current) => {
        const progress = Math.max(next, 0);
        if (progress !== current.progress) {
          const from = current.progress;
          setHistory((past) => [...past.slice(-(undoLimit - 1)), from]);
        }
        return { ...current, progress };
      });
    },
    [change],
  );

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (previous === undefined) return;
    change(current => ({ ...current, progress: previous }));
    setHistory((past) => past.slice(0, -1));
  }, [history, change]);

  const setColourway = useCallback((colourwayId: string) => {
    change(current => ({ ...current, colourwayId }));
  }, [change]);

  const setShade = useCallback((slots: SlotId[], chosen: Chosen | undefined) => {
    change((current) => {
      const shades = { ...current.shades };
      slots.forEach((slot) => {
        if (chosen) shades[slot] = chosen;
        else delete shades[slot];
      });
      return {
        ...current,
        shades: Object.keys(shades).length > 0 ? shades : undefined,
      };
    });
  }, [change]);

  const restoreShades = useCallback(() => {
    change(current => ({ ...current, shades: undefined }));
  }, [change]);

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
      canUndo={history.length > 0}
      setColourway={setColourway}
      setShade={setShade}
      restoreShades={restoreShades}
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
  setShade: (slots: SlotId[], chosen: Chosen | undefined) => void;
  restoreShades: () => void;
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
  restoreShades,
}) => {
  const hat = hatById(hatId)!;
  const size = hat.sizes.find((s) => s.id === project.sizeId) ?? hat.sizes[0];
  const { stitches, rounds, roundHeight, roundLabels, turns, index } =
    useHat(hat, size.id);

  const colourways = hat.colourways.filter(c => !c.sizeIds || c.sizeIds.includes(size.id));
  const colourway = colourways.find((c) => c.id === project.colourwayId) ?? colourways[0];
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
                sizeId={size.id}
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
            {/*
              The pattern's own colourways first, because they are where most
              people start, then the wool itself. Choosing one sets every yarn
              at once; a row below changes any of them afterwards.
            */}
            <div className="chooser">
              {colourways.map((option) => {
                const optionPalette = paletteOf(option, {}, hat.charts);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`colourway-option${option.id === colourway.id ? " is-chosen" : ""}`}
                    aria-pressed={option.id === colourway.id}
                    onClick={() => setColourway(option.id)}
                  >
                    <span className="colourway-swatches" aria-hidden="true">
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
            </div>
            <WoolList
              colourway={colourway}
              sizeId={project.sizeId}
              overrides={project.shades ?? {}}
              onChange={setShade}
              onRestoreAll={restoreShades}
            />
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
          onJump={knitting ? setProgress : undefined}
          labels={roundLabels}
          turns={turns}
          stitchNotes={hat.stitchNotes}
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
