import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { hats, hatById } from "../data/hats";
import {
  Project,
  bareIdFor,
  deleteProject,
  knittingParam,
  listProjects,
  projectsChanged,
  renameProject,
} from "../helpers/projects";
import { hatStitches } from "../knitting/useHat";
import { indexRounds, totals } from "../knitting/progress";
import { paletteOf, yarnFor } from "../knitting/palette";
import PageLayout from "./ui/PageLayout";
import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import NameDialog from "./ui/NameDialog";
import ProgressRing from "./ProgressRing";
import ChartMotif from "./ChartMotif";
import "./Home.css";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/** How far through a project is, and what it is called. */
const describe = (project: Project) => {
  const hat = hatById(project.hatId);
  if (!hat) return undefined;
  const { rounds, roundLabels } = hatStitches(hat, project.sizeId);
  const index = indexRounds(rounds, roundLabels);
  const counts = totals(index, project.progress);
  const colourway =
    hat.colourways.find((c) => c.id === project.colourwayId) ?? hat.colourways[0];
  const size = hat.sizes.find((s) => s.id === project.sizeId) ?? hat.sizes[0];
  return { hat, counts, colourway, size, index };
};

const ProjectCard: React.FC<{
  project: Project;
  onRename: () => void;
  onDelete: () => void;
}> = ({ project, onRename, onDelete }) => {
  const navigate = useNavigate();
  const described = describe(project);
  if (!described) return null;
  const { hat, counts, colourway, size } = described;
  const id = bareIdFor(project.id);
  const palette = paletteOf(colourway, project.shades, hat.charts);
  const done = counts.percent >= 100;

  return (
    <li className="project-card">
      <Link to={`/project/${id}`} className="project-card-body">
        <ProgressRing percent={counts.percent} />
        <span className="project-card-text">
          <strong>{project.name ?? hat.name}</strong>
          <span className="quiet">
            {hat.year} · {size.label} · {colourway.name}
          </span>
          <span className="quiet">
            {done
              ? `Finished · ${counts.total.toLocaleString()} stitches`
              : `${counts.worked.toLocaleString()} of ${counts.total.toLocaleString()} stitches · started ${formatDate(project.startedAt)}`}
          </span>
        </span>
        <span className="project-card-yarns" aria-hidden="true">
          {colourway.shades.map((shade) => (
            <span
              key={shade.slot}
              className="swatch"
              style={{ background: yarnFor(palette, shade.slot).hex }}
            />
          ))}
        </span>
      </Link>
      <div className="project-card-actions">
        <Button
          variant="primary"
          onClick={() =>
            navigate(
              done ? `/project/${id}` : `/project/${id}?${knittingParam}=1`,
            )
          }
        >
          {done ? "See it" : counts.worked > 0 ? "Keep knitting" : "Start knitting"}
        </Button>
        <Button variant="quiet" onClick={onRename}>
          Rename
        </Button>
        <Button variant="quiet" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
};

const Home: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [renaming, setRenaming] = useState<Project>();
  const [deleting, setDeleting] = useState<Project>();

  const refresh = useCallback(() => setProjects(listProjects()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(projectsChanged, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(projectsChanged, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return (
    <PageLayout
      title="Wool Week Toories"
      eyebrow="Shetland Wool Week"
      lede={
        <>
          A place to keep track of the toories. Pick a year, pick your wool,
          and watch the hat come up stitch by stitch as you knit it.
        </>
      }
    >
      {projects.length > 0 && (
        <section className="section">
          <h2>On your needles</h2>
          <ul className="project-list">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onRename={() => setRenaming(project)}
                onDelete={() => setDeleting(project)}
              />
            ))}
          </ul>
        </section>
      )}

      <div className="peerie-rule" aria-hidden="true" />

      <section className="section">
        <h2>The hats</h2>
        <ul className="hat-list">
          {hats.map((hat) => {
            const palette = paletteOf(hat.colourways[0], {}, hat.charts);
            return (
              <li key={hat.id}>
                <Link to={`/hat/${hat.id}`} className="hat-card">
                  <ChartMotif hat={hat} palette={palette} />
                  <span className="hat-card-text">
                    <span className="eyebrow">{hat.year}</span>
                    <strong>{hat.name}</strong>
                    <span className="quiet">{hat.designer}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="quiet">
          {hats.length} Shetland Wool Week hats, {Math.min(...hats.map(hat => hat.year))}–{Math.max(...hats.map(hat => hat.year))}.
          Choose a hat to explore its sizes, wool and chart.
        </p>
      </section>

      {renaming && (
        <NameDialog
          open
          title="Name this project"
          text="Something to tell it apart from the others."
          initialValue={renaming.name ?? ""}
          onCancel={() => setRenaming(undefined)}
          onConfirm={(name) => {
            renameProject(renaming.id, name);
            setRenaming(undefined);
          }}
        />
      )}
      {deleting && (
        <Dialog
          open
          title="Delete this project?"
          text="This only forgets how far you had got. The pattern itself is not going anywhere."
          confirmLabel="Delete"
          confirmVariant="danger"
          onCancel={() => setDeleting(undefined)}
          onConfirm={() => {
            deleteProject(deleting.id);
            setDeleting(undefined);
          }}
        />
      )}
    </PageLayout>
  );
};

export default Home;
