import { Overrides } from "../knitting/palette";

/**
 * A project is a hat you are knitting.
 *
 * It is tiny, and deliberately so. The stitches are a pure function of the
 * pattern and the size, and the colours a pure function of the colourway, so
 * none of that is worth storing: an id, a couple of choices and how far you
 * have got is the whole of it. That also means a project saved today still
 * opens after a chart is corrected, because it never held a copy of one.
 */

export const currentVersion = 1;

export interface Project {
  version: number;
  /** Full storage key, e.g. "project-1736300000000". */
  id: string;
  name?: string;
  hatId: string;
  sizeId: string;
  colourwayId: string;
  shades?: Overrides;
  /** Id of the last stitch worked. 0 means nothing knitted yet. */
  progress: number;
  startedAt: string;
  updatedAt: string;
}

const prefix = "project-";

/** Fired after any write, so open views can re-read. */
export const projectsChanged = "projectsChanged";

/** Marks a link as "open this straight into knitting mode". */
export const knittingParam = "knitting";

export const storageKeyFor = (id: string) =>
  id.startsWith(prefix) ? id : `${prefix}${id}`;

export const bareIdFor = (id: string) => id.replace(new RegExp(`^${prefix}`), "");

export const notifyChanged = () =>
  window.dispatchEvent(new CustomEvent(projectsChanged));

const isProject = (value: unknown): value is Project => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<Project>;
  return (
    typeof candidate.hatId === "string" &&
    typeof candidate.sizeId === "string" &&
    typeof candidate.colourwayId === "string" &&
    typeof candidate.progress === "number"
  );
};

/**
 * Read one project, migrating it forward if it was written by an older build.
 *
 * A single unreadable entry must never take down the page that lists them, so
 * anything that cannot be understood is reported as missing rather than thrown.
 */
export const readProject = (id: string): Project | undefined => {
  try {
    const raw = localStorage.getItem(storageKeyFor(id));
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!isProject(parsed)) return undefined;
    const savedAt = new Date(Number(bareIdFor(storageKeyFor(id))));
    const stamp = Number.isFinite(savedAt.getTime())
      ? savedAt.toISOString()
      : new Date(0).toISOString();
    return {
      ...parsed,
      version: currentVersion,
      id: storageKeyFor(id),
      startedAt: parsed.startedAt ?? stamp,
      updatedAt: parsed.updatedAt ?? parsed.startedAt ?? stamp,
    };
  } catch {
    return undefined;
  }
};

export const listProjects = (): Project[] => {
  const out: Project[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const project = readProject(key);
    if (project) out.push(project);
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const writeProject = (project: Project): Project => {
  const updated = { ...project, version: currentVersion, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(updated.id, JSON.stringify(updated));
    notifyChanged();
  } catch {
    // A browser with no room left is not worth interrupting a knitter over.
  }
  return updated;
};

export const startProject = (
  hatId: string,
  sizeId: string,
  colourwayId: string,
  /** Any wool chosen before starting, on the hat's own page. */
  shades: Overrides = {},
): Project =>
  writeProject({
    version: currentVersion,
    id: `${prefix}${Date.now()}`,
    hatId,
    sizeId,
    colourwayId,
    shades: Object.keys(shades).length > 0 ? shades : undefined,
    progress: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

export const deleteProject = (id: string) => {
  try {
    localStorage.removeItem(storageKeyFor(id));
    notifyChanged();
  } catch {
    // Nothing to do.
  }
};

export const renameProject = (id: string, name: string) => {
  const project = readProject(id);
  if (project) writeProject({ ...project, name: name.trim() || undefined });
};
