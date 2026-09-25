import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { hatById } from "../data/hats";
import { SlotId } from "../data/hats/types";
import { useHat } from "../knitting/useHat";
import { paletteOf, yarnFor } from "../knitting/palette";
import { totals, positionOf, currentRun } from "../knitting/progress";
import { keyEntryAt } from "../knitting/stitch-key";
import {
  Project as SavedProject,
  chartPath,
  knittingParam,
  overviewPath,
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
import { KeySheet } from "./KnitKey";
import WoolList from "./WoolList";
import { type Chosen } from "./YarnPicker";
import NextStep from "./ui/NextStep";
import BodyStrip from "./BodyStrip";
import { PreviewBanner } from "./ColourPreview";
import "./Project.css";

/** "Under 1%", "3%": how far through, never rounded up to done. */
const percentKnitted = (worked: number, percent: number) =>
  `${worked > 0 && percent < 1 ? "Under 1" : Math.floor(percent)}%`;

/**
 * The end of the chart page while you are not knitting: how far you have
 * got, and the ways on from here.
 */
const ChartPageFoot: React.FC<{
  percent: number;
  worked: number;
  total: number;
  round: number;
  rounds: number;
  finished: boolean;
  overview: string;
  onKnit: () => void;
}> = ({ percent, worked, total, round, rounds, finished, overview, onKnit }) => (
  <section className="section chart-foot" aria-label="Your progress">
    <div className="chart-foot-figure">
      <em>{finished ? "100%" : percentKnitted(worked, percent)}</em>
      <span className="quiet">knitted</span>
    </div>
    <div className="chart-foot-track">
      <span className="project-card-bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </span>
    </div>
    <p className="quiet">
      {finished
        ? `Finished · ${total.toLocaleString()} stitches`
        : `Round ${round} of ${rounds} · ${worked.toLocaleString()} of ${total.toLocaleString()} stitches`}
    </p>
    <div className="chart-foot-actions">
      <Link to="/" className="btn btn-quiet">
        Home
      </Link>
      <Link to={overview} className="btn btn-secondary">
        Overview &amp; colours
      </Link>
      <Button variant="primary" size="lg" className="chart-foot-knit" onClick={onKnit}>
        {finished ? "See the last stitch" : worked > 0 ? "Resume knitting" : "Start knitting"}
      </Button>
    </div>
  </section>
);

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

const Project: React.FC<{ view: "overview" | "chart" }> = ({ view }) => {
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

  /*
   * Opening or closing the knitting rearranges everything around the chart:
   * knitting fills the screen, without the header and title above it. Hold
   * the chart where it is on screen rather than letting it jump.
   */
  const chartHeld = useRef<{ left: number; top: number }>();
  useLayoutEffect(() => {
    const was = chartHeld.current;
    chartHeld.current = undefined;
    const sheet = document.querySelector(".chart-sheets");
    const scroller = sheet?.closest<HTMLElement>(".chart-scroll");
    if (!was || !sheet || !scroller) return;
    // Up and down by the page where it can scroll, and by the chart's own
    // window for what is left; sideways by the window, whose edges move
    // in by the frame's padding when the knitting is closed.
    window.scrollBy({ top: sheet.getBoundingClientRect().top - was.top, behavior: "instant" });
    const now = sheet.getBoundingClientRect();
    scroller.scrollTop += now.top - was.top;
    scroller.scrollLeft += now.left - was.left;
  }, [knitting]);

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

  // Knitting happens on the chart page; an old link that asked for it on the
  // overview is sent there.
  if (view === "overview" && knitting) {
    return <Navigate to={chartPath(project.id, true)} replace />;
  }

  return (
    <ProjectView
      view={view}
      hatId={hat.id}
      project={project}
      knitting={knitting}
      setKnitting={(on) => {
        const sheet = document.querySelector(".chart-sheets")?.getBoundingClientRect();
        chartHeld.current = sheet && { left: sheet.left, top: sheet.top };
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
  view: "overview" | "chart";
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
  view,
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

  const stageRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLElement>(null);
  const body = useMemo(() => ({ stitches, rounds }), [stitches, rounds]);

  // The full key, over the lower part of the screen while knitting.
  const [keyOpen, setKeyOpen] = useState(false);
  const closeKey = useCallback(() => setKeyOpen(false), []);
  useEffect(() => {
    if (!knitting) setKeyOpen(false);
  }, [knitting]);
  const run = currentRun(stitches, project.progress, index);
  const currentStitch = run ? keyEntryAt(stitches, run.startId, hat.stitchNotes)?.id : undefined;

  const title = project.name ?? hat.name;
  const eyebrow = `Shetland Wool Week ${hat.year} · ${size.label} · ${colourway.name}`;
  const knitLabel = counts.worked > 0 ? "Keep knitting" : "Start knitting";

  if (view === "chart") {
    return (
      <PageLayout
        title={title}
        eyebrow={eyebrow}
        showTitle={!knitting}
        className={knitting ? "knit-screen" : undefined}
      >
        <section className="section chart-page">
          <Chart
            contained
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

        {knitting ? (
          <KnittingPanel
            stitches={stitches}
            index={index}
            palette={palette}
            progress={project.progress}
            setProgress={setProgress}
            onStop={() => setKnitting(false)}
            canUndo={canUndo}
            onUndo={undo}
            notes={hat.stitchNotes}
            onOpenKey={() => setKeyOpen(true)}
          />
        ) : (
          <ChartPageFoot
            percent={counts.percent}
            worked={counts.worked}
            total={counts.total}
            round={position.round}
            rounds={position.totalRounds}
            finished={position.finished}
            overview={overviewPath(project.id)}
            onKnit={() => setKnitting(true)}
          />
        )}
        {knitting && keyOpen && (
          <KeySheet
            stitches={stitches}
            palette={palette}
            notes={hat.stitchNotes}
            current={currentStitch}
            onClose={closeKey}
          />
        )}
      </PageLayout>
    );
  }

  const stageEl = (
        <div className="project-stage" ref={stageRef}>
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
  );
  const figuresEl = (
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
  );
  const woolEl = (
      <section className="section" ref={choicesRef}>
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
                                <BodyStrip {...body} palette={optionPalette} className="colourway-motif" />
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
          body={body}
          palette={palette}
        />
      </section>
  );

  return (
    <PageLayout
      title={title}
      eyebrow={eyebrow}
      aside={
        <Link to={chartPath(project.id, !position.finished)} className="btn btn-primary">
          {position.finished ? "Open the chart" : knitLabel}
        </Link>
      }
    >
          <div className="project-layout">
            {stageEl}
            {figuresEl}
          </div>
          <div className="peerie-rule" aria-hidden="true" />
          {woolEl}
      <PreviewBanner body={body} palette={palette} stage={stageRef} choices={choicesRef} />

      <NextStep
        title={position.finished ? "All knitted" : counts.worked > 0 ? "Carry on" : "Ready to cast on?"}
        detail={
          position.finished
            ? "Every stitch is done. The chart is still there to look back over."
            : counts.worked > 0
              ? `You are on round ${position.round} of ${position.totalRounds}. The chart opens where you left off.`
              : `${counts.total.toLocaleString()} stitches over ${position.totalRounds} rounds. The chart follows you round by round.`
        }
      >
        {position.finished ? (
          <Link to={chartPath(project.id)} className="btn btn-primary btn-lg">
            Open the chart
          </Link>
        ) : (
          <>
            <Link to={chartPath(project.id)} className="btn btn-secondary">
              View the chart
            </Link>
            <Link to={chartPath(project.id, true)} className="btn btn-primary btn-lg">
              {knitLabel}
            </Link>
          </>
        )}
      </NextStep>
    </PageLayout>
  );
};

export default Project;
