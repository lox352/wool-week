/**
 * Settle each hat once, and write down where it came to rest.
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
import { appendFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

/**
 * Say how it is going, durably.
 *
 * This takes about a minute a hat, so it needs to report progress - and Node
 * block-buffers stdout when it is not a terminal, which means a run piped to a
 * file looks completely silent until it exits. That silence is exactly what I
 * first mistook for the settle never finishing. So every line goes to a log as
 * well, where it can be watched with `tail -f settle.log`.
 */
const logPath = join(root, "settle.log");
writeFileSync(logPath, "");
const say = (line) => {
  process.stdout.write(line + "\n");
  appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
};
const port = 4319;
const base = `http://127.0.0.1:${port}/wool-week/`;

/** Positions are rounded: the hat is about a hundred units tall. */
const places = 2;

/**
 * How long to wait for the page to show any sign of settling.
 *
 * A hat that is going to settle says so within a few seconds. One that never
 * reports a step is not slow, it is wrong - the page is not running the
 * physics at all - and waiting out the full timeout to discover that is how an
 * afternoon disappears. So that case now fails immediately and says what it
 * found.
 */
const firstProgressMs = 30_000;

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

/**
 * The settings to settle with.
 *
 * The sibling sites' defaults, unchanged: measured against the alternatives in
 * scripts/bench.mjs, nothing beat them by enough to be worth diverging for on
 * a job that runs once per hat and takes about a minute. Larger steps finish
 * sooner but take a coarser path to get there, which is a poor trade when the
 * answer is committed and looked at for years.
 */
const tuning = {};

/*
 * The hats, from their chart files.
 *
 * This used to read the imports out of index.ts, which also matched
 * `import { HatPattern } from "./types"` - so the first thing it tried to
 * settle was a hat called "types". That page says it does not know the hat,
 * never starts the physics, and the script then sat waiting for a result that
 * was never coming. Every chart file is named for exactly one hat, so there is
 * nothing to parse.
 */
const known = readdirSync(join(root, "src/data/hats"))
  .filter((name) => name.endsWith(".charts.json"))
  .map((name) => name.replace(".charts.json", ""))
  .sort();

// Named on the command line, or all of them. Settling one hat takes a couple
// of minutes and gives an answer that is very slightly its own each time, so
// adding a year should be able to leave the years already settled alone.
const wanted = process.argv.slice(2);
const missing = wanted.filter((id) => !known.includes(id));
if (missing.length > 0) {
  say(`no such hat: ${missing.join(", ")}; this repository has ${known.join(", ")}`);
  process.exit(1);
}
const hatIds = wanted.length > 0 ? wanted : known;

if (hatIds.length === 0) {
  say("found no hats: src/data/hats holds no *.charts.json");
  process.exit(1);
}
say(`settling ${hatIds.length} hats: ${hatIds.join(", ")}`);

/*
 * Its own preview server, in its own process group.
 *
 * npx spawns a shell which spawns vite, so killing what we started leaves the
 * grandchild holding the port. Detaching puts the lot in one group that can be
 * killed together; without this a few interrupted runs leave a row of orphaned
 * servers behind, and the next run quietly talks to one of those instead.
 */
const server = spawn(
  "npx",
  ["vite", "preview", "--port", String(port), "--host", "127.0.0.1"],
  { cwd: root, stdio: "ignore", detached: true },
);
let stopped = false;
const stop = () => {
  if (stopped) return;
  stopped = true;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill();
  }
};
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
    say("the preview server never came up; is the site built?");
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

/*
 * PLAYWRIGHT_CHROMIUM says which browser to drive, for a machine whose
 * installed browsers do not match the version Playwright expects to find -
 * which is the case in the container this is usually run in, and the failure
 * is a launch that says the executable does not exist.
 */
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
});

for (const hatId of hatIds) {
  /*
   * Discover the pattern's sizes before settling. One-size hats keep their
   * historical unsuffixed file. A pattern with several selectable sizes is
   * settled once per size so different stitch counts or gauges can never
   * inherit another size's coordinates.
   */
  const discovery = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await discovery.goto(`${base}#/hat/${hatId}?settle=0&settled=0`, {
    waitUntil: "networkidle",
  });
  await discovery.waitForFunction(() => Array.isArray(window.__hatSizeIds), {
    timeout: firstProgressMs,
  });
  const sizeIds = await discovery.evaluate(() => window.__hatSizeIds);
  await discovery.close();

  const targets = sizeIds.length > 1 ? sizeIds : [undefined];

  for (const sizeId of targets) {
    const label = sizeId ? `${hatId}/${sizeId}` : hatId;
    const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
    page.on("pageerror", (error) => say(`  ${label}: ERROR ${error.message}`));

    const query = Object.entries({
      settle: 1,
      settled: 0,
      ...(sizeId ? { size: sizeId } : {}),
      stepBudgetMs,
      ...tuning,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    await page.goto(`${base}#/hat/${hatId}?${query}`, {
      waitUntil: "networkidle",
    });

    const started = Date.now();
    let reported = 0;
    const ticker = setInterval(async () => {
      const progress = await page
        .evaluate(() => window.__settleProgress)
        .catch(() => undefined);
      if (!progress || progress.steps === reported) return;
      reported = progress.steps;
      say(
        `  ${label}: ${progress.steps} steps, the average stitch moving ` +
          `${progress.moved.toFixed(5)} of its own width a step, ` +
          `${((Date.now() - started) / 1000).toFixed(0)}s`,
      );
    }, 5_000);

    await page
      .waitForFunction(() => window.__settleProgress, undefined, {
        timeout: firstProgressMs,
        polling: 500,
      })
      .catch(() => {
        clearInterval(ticker);
        say(
          `${label}: the page never started settling. Is it a hat the site ` +
            `knows, and did the build include it?`,
        );
        process.exit(1);
      });

    const positions = await page
      .waitForFunction(() => window.__settledPositions, undefined, {
        timeout: settleTimeoutMs,
        polling: 1_000,
      })
      .then((handle) => handle.jsonValue())
      .finally(() => clearInterval(ticker));

    const flat = [];
    for (const point of positions) {
      flat.push(
        Number(point.x.toFixed(places)),
        Number(point.y.toFixed(places)),
        Number(point.z.toFixed(places)),
      );
    }

    const filename =
      sizeIds.length > 1 ? `${hatId}--${sizeId}.json` : `${hatId}.json`;
    const out = join(root, "src/data/hats/settled", filename);
    writeFileSync(out, JSON.stringify(flat) + "\n");
    const kb = Math.round(JSON.stringify(flat).length / 1024);
    say(
      `${label}: ${positions.length} stitches settled in ` +
        `${((Date.now() - started) / 1000).toFixed(1)}s -> ${kb}kB`,
    );
    await page.close();
  }
}

await browser.close();
stop();
