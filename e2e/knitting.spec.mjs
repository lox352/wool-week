import { test, expect } from "playwright/test";
import { readFile } from "node:fs/promises";

const pattern = "#/hat/sww18-merrie-dancers-toorie";
const position = page => page.locator(".knitting-panel [role=status]");
async function openSettings(page) {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  return page.getByRole("dialog", { name: "Settings", exact: true });
}
async function start(page) {
  await page.goto(pattern);
  await page.getByRole("button", { name: "Start knitting this", exact: true }).click();
  await expect(page.getByRole("button", { name: "End of round", exact: true })).toBeVisible();
}

test("all patterns remain usable without WebGL; default visits never request live physics", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind.startsWith("webgl") ? null : original.call(this, kind, ...args);
    };
  });
  const physics = [];
  page.context().on("request", request => { if (/\/ChainModel-/.test(request.url())) physics.push(request.url()); });
  await page.goto("");
  const links = await page.locator(".hat-card").evaluateAll(nodes => nodes.map(node => node.href));
  expect(links).toHaveLength(13);
  for (const href of links) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start knitting this", exact: true })).toBeVisible();
    await expect(page.getByText("The 3D preview is unavailable.", { exact: false })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(physics).toEqual([]);
});

test("DK selection, accessible chart controls and text instructions", async ({ page }) => {
  await page.goto(pattern);
  await page.getByRole("button", { name: "Yarn weight 1 · DK", exact: true }).click();
  await expect(page.getByRole("button", { name: "Yarn weight 1 · DK", exact: true })).toHaveAttribute("aria-pressed", "true");
  const sheetWidth = () => page.locator(".chart-sheets").evaluate(node => node.offsetWidth);
  const unzoomed = await sheetWidth();
  await page.getByRole("region", { name: /Scrollable knitting chart/ }).press("+");
  await expect.poll(sheetWidth).toBeGreaterThan(unzoomed);
  const settings = await openSettings(page);
  await settings.getByRole("switch", { name: "High contrast chart" }).check();
  await settings.getByRole("switch", { name: "Written round instructions" }).check();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".chart-yarn-numbers li")).not.toHaveCount(0);
  await page.getByText("Text round instructions", { exact: true }).click();
  await expect(page.getByText(/Cast on 108 stitches/)).toBeVisible();
  await page.getByLabel("Read round").selectOption("2");
  await expect(page.getByText("Round 2:", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("progress survives reload and undo; a second tab stays in sync", async ({ page, context }) => {
  await start(page);
  const original = await position(page).textContent();
  await page.getByRole("button", { name: "End of round", exact: true }).click();
  const advanced = await position(page).textContent();
  expect(advanced).not.toBe(original);
  await page.getByRole("button", { name: "End of round", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position(page)).toHaveText(advanced);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position(page)).toHaveText(original);
  await page.getByRole("button", { name: "End of round", exact: true }).click();
  await page.reload();
  await expect(position(page)).toHaveText(advanced);
  const other = await context.newPage();
  await other.goto(page.url());
  await page.getByRole("button", { name: "End of round", exact: true }).click();
  const further = await position(page).textContent();
  await expect(position(other)).toHaveText(further);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position(other)).toHaveText(advanced);
});

test("tapping a stitch on the chart carries on from it, and can be undone", async ({ page }) => {
  await start(page);
  const original = await position(page).textContent();
  // Round 20, the fourth stitch from the right-hand edge.
  await page.locator(".chart-sheets").evaluate(sheet => {
    const cell = 16;
    const box = sheet.getBoundingClientRect();
    const columns = Math.round((box.width - Math.round(cell * 2.2)) / cell);
    sheet.dispatchEvent(new MouseEvent("click", { bubbles: true,
      clientX: box.left + (columns - 3.5) * cell, clientY: box.bottom - 19.5 * cell }));
  });
  const picker = page.getByRole("dialog", { name: "Round 20, stitch 4" });
  await expect(picker).toBeVisible();
  await picker.getByRole("button", { name: "Knit up to here" }).click();
  await expect(position(page)).toContainText("Round 20, stitch 4.");
  await expect(picker).toBeHidden();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(position(page)).toHaveText(original);
});

test("backup restores copies and rename/delete require their dialogs", async ({ page }) => {
  await start(page);
  const downloadPromise = page.waitForEvent("download");
  await (await openSettings(page)).getByRole("button", { name: "Save", exact: true }).click();
  const download = await downloadPromise;
  const buffer = await readFile(await download.path());
  expect(JSON.parse(buffer.toString()).projects).toHaveLength(1);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("link", { name: "Wool Week Toories", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Wool Week Toories", level: 1, exact: true })).toBeVisible();
  await (await openSettings(page)).getByLabel("Import project backup").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer });
  await page.getByRole("button", { name: "Restore copies", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("button", { name: "Rename", exact: true })).toHaveCount(2);
  await page.getByRole("button", { name: "Rename", exact: true }).first().click();
  await page.getByRole("textbox", { name: "Name this project" }).fill("Regression test hat");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Regression test hat", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("button", { name: "Rename", exact: true })).toHaveCount(2);
});

test("quota failures preserve progress and offer a recovery export", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage full", "QuotaExceededError"); };
  });
  await start(page);
  await page.getByRole("button", { name: "End of round", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Progress is not being saved");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export recovery backup", exact: true }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(backup.projects[0].progress).toBeGreaterThan(0);
});

test("a prepared project reloads and saves progress offline", async ({ page, context }) => {
  await start(page);
  await expect(page.getByText(/Ready for offline knitting/)).toBeVisible({ timeout: 45_000 });
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "End of round", exact: true }).click();
  const progress = await position(page).textContent();
  await page.reload();
  await expect(position(page)).toHaveText(progress);
});
