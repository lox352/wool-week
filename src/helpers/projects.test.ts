import { afterEach, expect, it, vi } from "vitest";
import { getStorageNotice, listProjects, readProject, retrySaving, startProject, writeProject } from "./projects";
import { hatById } from "../data/hats";
import { buildHat } from "../knitting/engine";

afterEach(() => { vi.restoreAllMocks(); retrySaving(); localStorage.clear(); });

it("retains failed saves for recovery and retries them", () => {
  const fail = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
  const project = startProject("hat", "size", "colour");
  expect(getStorageNotice()).toContain("not being saved");
  expect(readProject(project.id)).toEqual(project);
  expect(listProjects()).toContainEqual(project);
  fail.mockRestore();
  retrySaving();
  expect(getStorageNotice()).toBe("");
  expect(JSON.parse(localStorage.getItem(project.id)!)).toEqual(project);
});

it("never collides when starting projects in the same millisecond", () => {
  expect(startProject("h", "s", "c").id).not.toBe(startProject("h", "s", "c").id);
});

it("ignores malformed storage entries without breaking the project list", () => {
  const good = startProject("h", "s", "c");
  for (const bad of [{ updatedAt: 123 }, { progress: -1 }, { progress: 1.5 }, { shades: { A: { name: 7 } } }]) {
    localStorage.setItem("project-bad", JSON.stringify({ ...good, ...bad }));
    expect(listProjects()).toEqual([good]);
  }
});

it("rejects stale progress instead of overwriting a newer saved version", () => {
  const old = startProject("h", "s", "c");
  const newer = writeProject({ ...old, progress: 10 });
  expect(writeProject({ ...old, progress: 1 })).toEqual(newer);
  expect(readProject(old.id)?.progress).toBe(10);
  expect(getStorageNotice()).toContain("another tab");
});

it("recovers failed saves as copies when another tab changed the persisted project", () => {
  const original = startProject("h", "s", "c");
  const fail = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
  writeProject({ ...original, progress: 5 });
  fail.mockRestore();
  const otherTab = { ...original, progress: 20, updatedAt: new Date(Date.now() + 5000).toISOString() };
  localStorage.setItem(original.id, JSON.stringify(otherTab));
  retrySaving();
  expect(readProject(original.id)?.progress).toBe(20);
  expect(listProjects().find(p => p.id !== original.id)?.progress).toBe(5);
  expect(getStorageNotice()).toContain("recovered copy");
});

it("brings a version 1 project's progress past the needle changes it did not have", () => {
  // Version 1 numbered the stitches without the steps for changing needles,
  // so the same stitch had an id one lower for each change before it.
  const { stitches } = buildHat(hatById("sww26-birsie-beanny")!, "medium");
  const steps = stitches.filter((stitch) => stitch.type === "needles").map((stitch) => stitch.id);
  const target = stitches.find((stitch) => stitch.id > steps[3] && stitch.type === "k1")!;
  const project = startProject("sww26-birsie-beanny", "medium", "col-1");
  localStorage.setItem(project.id, JSON.stringify({ ...project, version: 1, progress: target.id - 4 }));
  expect(readProject(project.id)).toMatchObject({ version: 2, progress: target.id });
  // Before any change, nothing moves.
  localStorage.setItem(project.id, JSON.stringify({ ...project, version: 1, progress: 5 }));
  expect(readProject(project.id)?.progress).toBe(5);
});
