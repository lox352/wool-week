import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import App from "../App";
import { bareIdFor, getStorageNotice, readProject, startProject } from "../helpers/projects";

vi.mock("./HatModel", () => ({ default: () => null }));
vi.mock("../knitting/Chart", () => ({ default: () => null }));
afterEach(() => { localStorage.clear(); window.location.hash = ""; vi.restoreAllMocks(); });

it("saves once per action under StrictMode and undoes more than one step", async () => {
  const project = startProject("sww18-merrie-dancers-toorie", "yw2", "jamieson-smith");
  window.location.hash = `#/project/${bareIdFor(project.id)}?knitting=1`;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const saves = vi.spyOn(Storage.prototype, "setItem");
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
    expect(saves).not.toHaveBeenCalled();
    summary.remove();
    await click("End of round");
    expect(saves).toHaveBeenCalledTimes(1);
    expect(readProject(project.id)?.progress).toBe(120);
    expect(getStorageNotice()).toBe("");
    await click("End of round");
    expect(saves).toHaveBeenCalledTimes(2);
    expect(readProject(project.id)?.progress).toBe(240);
    await click("Undo");
    expect(saves).toHaveBeenCalledTimes(3);
    expect(readProject(project.id)?.progress).toBe(120);
    await click("Undo");
    expect(readProject(project.id)?.progress).toBe(0);
  } finally { await act(async () => root.unmount()); host.remove(); }
});
