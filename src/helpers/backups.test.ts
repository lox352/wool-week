import { afterEach, expect, it } from "vitest";
import { hats } from "../data/hats";
import { backupText, parseBackup, restoreBackup } from "./backups";
import { listProjects, startProject } from "./projects";
afterEach(() => localStorage.clear());
it("round trips without overwriting existing projects", () => {
  const h = hats[0];
  const p = startProject(h.id, h.sizes[0].id, h.colourways[0].id);
  const copies = parseBackup(backupText());
  expect(copies[0].id).not.toBe(p.id);
  restoreBackup(copies);
  expect(listProjects()).toHaveLength(2);
});
it("rejects malformed and future-version backups without writes", () => {
  expect(() => parseBackup('{"format":"wool-week-projects","version":2,"projects":[]}')).toThrow();
  expect(() => parseBackup('{"format":"wool-week-projects","version":1,"projects":[{}]}')).toThrow();
  expect(listProjects()).toHaveLength(0);
});
