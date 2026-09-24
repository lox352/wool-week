import { afterEach, expect, it, vi } from "vitest";
import { getStorageNotice, listProjects, readProject, retrySaving, startProject, writeProject } from "./projects";

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

it("rejects stale progress instead of overwriting a newer saved version", () => {
  const old = startProject("h", "s", "c");
  const newer = writeProject({ ...old, progress: 10 });
  expect(writeProject({ ...old, progress: 1 })).toEqual(newer);
  expect(readProject(old.id)?.progress).toBe(10);
  expect(getStorageNotice()).toContain("another tab");
});
