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

it("rejects a colourway incompatible with the selected yarn-weight variant", () => {
  const hat = hats.find(h => h.year === 2018)!;
  const wrong = startProject(hat.id, "yw1", hat.colourways.find(c => c.sizeIds?.includes("yw2"))!.id);
  expect(() => parseBackup(backupText())).toThrow("colourway");
  expect(listProjects()).toEqual([wrong]);
});

it("keeps a brim's own words, and refuses words the brim cannot knit", () => {
  const hat = hats.find(h => h.lettering)!;
  startProject(hat.id, hat.sizes[0].id, hat.colourways[0].id, {}, "HAPPY BIRTHDAY MUM");
  expect(parseBackup(backupText())[0].brimText).toBe("HAPPY BIRTHDAY MUM");
  localStorage.clear();
  startProject(hat.id, hat.sizes[0].id, hat.colourways[0].id, {}, "CAFÉ");
  expect(() => parseBackup(backupText())).toThrow("lettering");
  localStorage.clear();
  const plain = hats.find(h => !h.lettering)!;
  startProject(plain.id, plain.sizes[0].id, plain.colourways[0].id, {}, "HELLO");
  expect(() => parseBackup(backupText())).toThrow("lettering");
});
