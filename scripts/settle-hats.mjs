/**
 * Settle each hat once, and write down where it came to rest.
 *
 * NOTE: this does not work at the size these hats are, and nothing ships
 * settled positions. A step over ten thousand rigid bodies and twenty-five
 * thousand rope joints takes a second or two, rest needs hundreds of steps,
 * and left to run with no time limit it had not converged after forty minutes.
 * The site draws the hat from its built geometry instead - see the note in
 * README.md. This is kept against a workable approach, and is not part of any
 * build.
 *
 * A hat's shape depends only on its pattern, and these patterns are fixed, so
 * every knitter's copy of a given hat settles to the same shape. Working that
 * out in the browser meant ten thousand rigid bodies and twenty-five thousand
 * rope joints per visit - about 225MB of heap, which is more than a phone will
 * give a tab. So it is done here instead, and the answer is committed.
 *
 * It drives the site's own physics rather than reimplementing it, so what is
 * written down is exactly what the browser used to compute. Run it after
 * adding a hat, or after anything that changes the stitch geometry:
 *
 *     npm run build && npm run settle
 *
 * The script starts its own preview server against dist/.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const port = 4319;
const base = `http://127.0.0.1:${port}/wool-week/`;

/** Positions are rounded: the hat is about a hundred units tall. */
const places = 2;

/**
 * Long enough for a ten-thousand stitch hat.
 *
 * A single physics step over that many bodies and joints takes a second or
 * two, and coming to rest takes a few hundred steps, so this is minutes of
 * work rather than seconds. That is the whole reason it happens here.
 */
const settleTimeoutMs = 45 * 60_000;

/**
 * How long the page may spend stepping before giving the frame back.
 *
 * The site's own default keeps a browser responsive. Nobody is looking at
 * this one, so it runs flat out.
 */
const stepBudgetMs = 4_000;

const hatIds = [...readFileSync(join(root, "src/data/hats/index.ts"), "utf8")
  .matchAll(/from "\.\/([a-z0-9-]+)"/g)]
  .map((match) => match[1]);

if (hatIds.length === 0) {
  console.error("found no hats in src/data/hats/index.ts");
  process.exit(1);
}

const server = spawn(
  "npx",
  ["vite", "preview", "--port", String(port), "--host", "127.0.0.1"],
  { cwd: root, stdio: "ignore" },
);
const stop = () => server.kill();
process.on("exit", stop);
process.on("SIGINT", () => { stop(); process.exit(1); });

// Wait for it to answer before pointing a browser at it.
for (let attempt = 0; ; attempt++) {
  try {
    const response = await fetch(base);
    if (response.ok) break;
  } catch {
    // Not up yet.
  }
  if (attempt > 60) {
    console.error("the preview server never came up");
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? undefined,
});

for (const hatId of hatIds) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  page.on("pageerror", (error) => console.error(`  ${hatId}: ${error.message}`));

  /*
   * The site prefers a settled file over settling, so a rerun would find the
   * file it wrote last time and settle nothing. Hiding them forces the
   * physics, which is the whole point of the exercise.
   */
  await page.route("**/settled/*.json", (route) => route.abort());

  await page.addInitScript((budget) => {
    window.__settleBudgetMs = budget;
  }, stepBudgetMs);

  // ?settle=1 is what asks the page for the physics stage rather than a hat
  // drawn where it already came to rest.
  await page.goto(`${base}#/hat/${hatId}?settle=1`, { waitUntil: "networkidle" });

  const started = Date.now();
  let reported = 0;
  const ticker = setInterval(async () => {
    const progress = await page
      .evaluate(() => window.__settleProgress)
      .catch(() => undefined);
    if (!progress || progress.steps === reported) return;
    reported = progress.steps;
    process.stdout.write(
      `\r  ${hatId}: ${progress.steps} steps, motion ` +
        `${progress.motion.toFixed(3)} (resting under 0.15), ` +
        `${((Date.now() - started) / 1000).toFixed(0)}s   `,
    );
  }, 5_000);

  const positions = await page
    .waitForFunction(() => window.__settledPositions, undefined, {
      timeout: settleTimeoutMs,
      polling: 1_000,
    })
    .then((handle) => handle.jsonValue())
    .finally(() => {
      clearInterval(ticker);
      process.stdout.write("\n");
    });

  const flat = [];
  for (const point of positions) {
    flat.push(
      Number(point.x.toFixed(places)),
      Number(point.y.toFixed(places)),
      Number(point.z.toFixed(places)),
    );
  }

  const out = join(root, "src/data/hats/settled", `${hatId}.json`);
  writeFileSync(out, JSON.stringify(flat) + "\n");
  const kb = Math.round(JSON.stringify(flat).length / 1024);
  console.log(
    `${hatId}: ${positions.length} stitches settled in ` +
      `${((Date.now() - started) / 1000).toFixed(1)}s -> ${kb}kB`,
  );
  await page.close();
}

await browser.close();
stop();
