import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import App from "../App";
import { bareIdFor, getStorageNotice, readProject, startProject } from "../helpers/projects";
import { actionsOf, readLog } from "../knitting/timing/log";

vi.mock("./HatModel", () => ({ default: () => null }));
vi.mock("../knitting/Chart", () => ({ default: () => null }));
afterEach(() => { localStorage.clear(); window.location.hash = ""; vi.restoreAllMocks(); });

it("saves once per action under StrictMode and undoes more than one step", async () => {
  const project = startProject("sww18-merrie-dancers-toorie", "yw2", "jamieson-smith");
  window.location.hash = `#/project/${bareIdFor(project.id)}?knitting=1`;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const writes = vi.spyOn(Storage.prototype, "setItem");
  // The project itself; the knitting-time log beside it is written separately.
  const saves = { get calls() { return writes.mock.calls.filter(([key]) => key.startsWith("project-")); } };
  const click = async (label: string) => {
    const button = [...host.querySelectorAll("button")].find(b => b.textContent?.trim() === label);
    expect(button, label).toBeDefined();
    await act(async () => button!.click());
  };
  try {
    await act(async () => root.render(<StrictMode><App /></StrictMode>));
    const summary = document.createElement("summary");
    host.append(summary);
    await act(async () => summary.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true })));
    expect(saves.calls).toHaveLength(0);
    summary.remove();
    await click("End of round");
    expect(saves.calls).toHaveLength(1);
    expect(readProject(project.id)?.progress).toBe(120);
    expect(getStorageNotice()).toBe("");
    // Joined in the round, a step of its own.
    await click("Joined: carry on");
    expect(saves.calls).toHaveLength(2);
    expect(readProject(project.id)?.progress).toBe(121);
    await click("End of round");
    expect(saves.calls).toHaveLength(3);
    expect(readProject(project.id)?.progress).toBe(241);
    await click("Undo");
    expect(saves.calls).toHaveLength(4);
    expect(readProject(project.id)?.progress).toBe(121);
    await click("Undo");
    expect(readProject(project.id)?.progress).toBe(120);
    // Every change went into the knitting-time log once, the undos marked,
    // after one opening (by link, since the app was loaded before the address
    // was set): StrictMode's double mount writes nothing extra.
    const rows = readLog(project.id);
    expect(rows.filter(row => row[2] !== undefined && row[2] >= 10).map(row => row[2])).toEqual([10]);
    expect(actionsOf(rows).map(({ from, to, undo }) => [from, to, !!undo])).toEqual([
      [0, 120, false], [120, 121, false], [121, 241, false], [241, 121, true], [121, 120, true],
    ]);
  } finally { await act(async () => root.unmount()); host.remove(); }
});
