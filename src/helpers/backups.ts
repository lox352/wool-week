import { hatById } from "../data/hats";
import { buildHat } from "../knitting/engine";
import { currentVersion, listProjects, type Project, writeProject } from "./projects";

export const backupText = () => JSON.stringify({ format: "wool-week-projects", version: 1,
  exportedAt: new Date().toISOString(), projects: listProjects() }, null, 2);

export function parseBackup(text: string): Project[] {
  if (text.length > 2_000_000) throw new Error("Backup is too large (maximum 2 MB).");
  const data = JSON.parse(text);
  if (data?.format !== "wool-week-projects" || data.version !== 1 ||
    !Array.isArray(data.projects) || data.projects.length > 1000) throw new Error("Not a supported Wool Week backup.");
  return data.projects.map((p: Project) => {
    const hat = p && hatById(p.hatId);
    if (!hat || !hat.sizes.some(s => s.id === p.sizeId) ||
      !hat.colourways.some(c => c.id === p.colourwayId && (!c.sizeIds || c.sizeIds.includes(p.sizeId))) ||
      p.version !== currentVersion || !Number.isSafeInteger(p.progress) || p.progress < 0 ||
      p.progress >= buildHat(hat, p.sizeId).stitches.length ||
      (p.name !== undefined && (typeof p.name !== "string" || p.name.length > 200)) ||
      typeof p.startedAt !== "string" || !Number.isFinite(Date.parse(p.startedAt))) {
      throw new Error("A project contains an unknown pattern, size, colourway or invalid progress.");
    }
    if (p.shades !== undefined) {
      if (!p.shades || typeof p.shades !== "object" || Array.isArray(p.shades)) throw new Error("Invalid yarn choices.");
      for (const [slot, shade] of Object.entries(p.shades)) {
        if (!hat.slots.some(known => known === slot) || !shade || typeof shade !== "object" ||
          Object.keys(shade).some(k => !["wool", "name", "code", "hex"].includes(k)) ||
          Object.values(shade).some(v => typeof v !== "string" || v.length > 200) ||
          (shade.hex !== undefined && !/^#[0-9a-f]{6}$/i.test(shade.hex))) throw new Error("Invalid yarn choices.");
      }
    }
    return { version: currentVersion, id: `project-${crypto.randomUUID()}`, name: p.name,
      hatId: p.hatId, sizeId: p.sizeId, colourwayId: p.colourwayId, progress: p.progress,
      shades: p.shades, startedAt: p.startedAt, updatedAt: new Date().toISOString() };
  });
}

/** Restore as copies: never overwrite a knitter's existing work. */
export const restoreBackup = (projects: Project[]) => projects.map(writeProject);

export function downloadBackup() {
  const url = URL.createObjectURL(new Blob([backupText()], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `wool-week-projects-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
