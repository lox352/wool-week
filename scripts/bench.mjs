/**
 * A bench for the hat: how well does it settle, and how fast does it draw?
 *
 * Settling has a lot of dials on it and no obvious way to tell which of them
 * matter, so this turns them and measures. It drives the site's own physics in
 * a real browser rather than reimplementing anything, so what it reports is
 * what the site would do.
 *
 *   npm run bench                          the standard set of runs
 *   npm run bench -- --hat sww24-…         one hat
 *   npm run bench -- --only derived        one named run
 *   npm run bench -- --render              frame times instead of settling
 *   npm run bench -- --geometry            can this hat settle at all?
 *   npm run bench -- --set iterations=8 --set ropes=derived --minutes 3
 *
 * A word on reading the numbers. Frame times from this machine are software
 * rasterised - there is no GPU behind headless Chromium - so treat --render
 * frame times as an upper bound and a way of comparing two builds, never as
 * what a phone would do. The settle numbers are honest: that is all CPU.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Say it out loud, and write it down.
 *
 * A sweep is minutes of work per run, so it has to report as it goes - and
 * Node block-buffers stdout when it is not a terminal, so a run piped to a
 * file or captured by a tool says nothing at all until it exits. Watching
 * bench.log with `tail -f` shows the runs as they finish.
 */
const logPath = join(root, "bench.log");
writeFileSync(logPath, "");
const say = (line = "") => {
  process.stdout.write(line + "\n");
  appendFileSync(logPath, line + "\n");
};
const port = 4321;
const base = `http://127.0.0.1:${port}/wool-week/`;

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? fallback : argv[at + 1];
};
const has = (name) => argv.includes(`--${name}`);
const sets = argv.reduce((all, arg, index) => {
  if (arg !== "--set") return all;
  const [key, value] = (argv[index + 1] ?? "").split("=");
  if (key) all[key] = value;
  return all;
}, {});

const hat = flag("hat", "sww25-aal-ower-toorie");
const minutes = Number(flag("minutes", 4));
const only = flag("only", null);

/**
 * The runs worth making.
 *
 * Each is a hypothesis. The first is the sibling sites' settings unchanged,
 * which is the thing to beat.
 */
const runs = [
  { name: "baseline", tuning: {} },
  {
    name: "derived",
    why: "let a joint be as long as the pattern already makes it",
    tuning: { ropes: "derived" },
  },
  {
    name: "derived+slack",
    why: "as derived, with a tenth of give everywhere",
    tuning: { ropes: "derived", ropeSlack: 1.1 },
  },
  {
    name: "fewer-iterations",
    why: "is the solver's effort per step buying anything?",
    tuning: { iterations: 8 },
  },
  {
    name: "derived+fewer-iterations",
    why: "a feasible start may not need a hard-working solver",
    tuning: { ropes: "derived", iterations: 8 },
  },
  {
    name: "bigger-step",
    why: "fewer, larger steps for the same simulated time",
    tuning: { ropes: "derived", timeStep: 0.3 },
  },
  {
    name: "no-gravity",
    why: "the hat already starts the right shape; is gravity only distorting it?",
    tuning: { gravity: 0 },
  },
  {
    name: "light-gravity",
    why: "enough to relax the fabric, not enough to stretch the tube",
    tuning: { gravity: 1 },
  },
  {
    name: "more-damping",
    why: "take the energy out faster",
    tuning: { ropes: "derived", damping: 8 },
  },
];

/*
 * Its own preview server, in its own process group: npx spawns a shell which
 * spawns vite, so killing what we started would leave the grandchild holding
 * the port for the next run to talk to by mistake.
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

for (let attempt = 0; ; attempt++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {
    /* not up yet */
  }
  if (attempt > 80) {
    say("the preview server never came up; is the site built?");
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

/*
 * The environment may have a browser in a place Playwright does not look, so
 * PLAYWRIGHT_CHROMIUM names it if the usual lookup is going to fail.
 */
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
});

const query = (tuning) =>
  Object.entries({ settle: 1, stepBudgetMs: 4000, ...tuning, ...sets })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

/** Runs one settle and says how it went. */
async function settle({ name, why, tuning }) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));

  await page.goto(`${base}#/hat/${hat}?${query(tuning)}`, {
    waitUntil: "networkidle",
  });

  const started = Date.now();
  const deadline = started + minutes * 60_000;
  const curve = [];
  let settled = null;
  let last = null;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const state = await page
      .evaluate(() => ({
        progress: window.__settleProgress,
        done: !!window.__settledPositions,
      }))
      .catch(() => null);
    if (!state) break;
    if (state.progress) {
      last = state.progress;
      curve.push({ at: Math.round((Date.now() - started) / 1000), ...last });
    }
    if (state.done) {
      settled = Math.round((Date.now() - started) / 1000);
      break;
    }
  }

  /*
   * What shape it came out. The settle can reach rest and still be wrong: rope
   * joints only cap how far apart two stitches may be, so nothing stops a
   * round closing up, and gravity will happily trade a hat's circumference for
   * its height until it is a tall thin cone. So the run is judged on the shape
   * as well as on whether it stopped moving.
   */
  const shape = settled
    ? await page
        .evaluate(() => {
          const flat = window.__settledPositions;
          const { stitches, target } = window.__hat ?? {};
          const extent = (points, at) => {
            let radius = 0;
            let low = Infinity;
            let high = -Infinity;
            for (const p of points) {
              const q = at(p);
              radius = Math.max(radius, Math.hypot(q.x, q.z));
              low = Math.min(low, q.y);
              high = Math.max(high, q.y);
            }
            return { across: 2 * radius, tall: high - low };
          };
          return {
            settled: extent(flat, (p) => p),
            built: extent(stitches ?? [], (s) => s.position),
            target,
          };
        })
        .catch(() => null)
    : null;

  await page.close();

  const steps = last?.steps ?? 0;
  const seconds = (Date.now() - started) / 1000;
  return {
    name,
    why,
    settled,
    steps,
    perStep: steps ? (seconds / steps).toFixed(2) : "-",
    motion: last?.motion,
    // Is it still coming down, or has it stalled short of rest?
    trend: curve.length > 3
      ? (curve.at(-1).motion - curve.at(-4).motion).toFixed(2)
      : "-",
    shape,
    failures,
  };
}

/** Frame times and what the GPU is being asked for. */
async function render() {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.goto(`${base}#/hat/${hat}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(12_000);

  const frames = await page.evaluate(async () => {
    const times = [];
    let last = performance.now();
    let going = true;
    const tick = () => {
      const now = performance.now();
      times.push(now - last);
      last = now;
      if (going) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    for (let i = 0; i < 20; i++) {
      window.scrollBy(0, 60);
      await new Promise((r) => setTimeout(r, 50));
    }
    going = false;
    times.sort((a, b) => a - b);
    return {
      median: Math.round(times[Math.floor(times.length / 2)]),
      worst: Math.round(times.at(-1)),
    };
  });

  const page2 = await page.evaluate(() => ({
    heapMB: Math.round(performance.memory.usedJSHeapSize / 1048576),
    nodes: document.getElementsByTagName("*").length,
  }));

  say(`\n${hat}, 390x844 at 6x CPU throttling`);
  say(`  scroll frames: median ${frames.median}ms, worst ${frames.worst}ms`);
  say(`  heap ${page2.heapMB}MB, ${page2.nodes} DOM nodes`);
  say("  (software rasterised here - compare builds, not devices)");
  await page.close();
}

/**
 * Can this hat be settled at all with inextensible yarn?
 *
 * The question that turned out to matter. A joint that starts longer than it
 * is allowed to be is not by itself a problem - the earth site's hats have
 * more of them than these do, and settle fine, because the fabric can
 * rearrange until they are satisfied. The trouble is a crown that asks for
 * more fabric than exists: sixteen rounds, twenty-five units of knitting, sent
 * to cover forty-nine units of radius. No arrangement satisfies that, so the
 * solver does not converge slowly, it cannot converge at all.
 */
async function geometry() {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.goto(`${base}#/hat/${hat}?settle=1&ropes=derived`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => window.__hat, undefined, { timeout: 60_000 });

  const report = await page.evaluate(() => {
    const { stitches, rounds } = window.__hat;
    const adjacent = 2;
    const vertical = 1.6;
    let joints = 0;
    let over = 0;
    let worst = 0;
    let excess = 0;
    for (const s of stitches) {
      for (const link of s.links) {
        const other = stitches[link];
        if (!other) continue;
        joints++;
        const max = s.id - link === 1 ? adjacent : vertical;
        const d = Math.hypot(
          s.position.x - other.position.x,
          s.position.y - other.position.y,
          s.position.z - other.position.z,
        );
        if (d / max > 1.001) {
          over++;
          excess += d - max;
          worst = Math.max(worst, d / max);
        }
      }
    }

    // Where the rounds stop growing and start pulling in: the crown.
    const radii = rounds.map((round) => {
      const at = stitches[round[0]].position;
      return Math.hypot(at.x, at.z);
    });
    let widest = 0;
    radii.forEach((r, i) => {
      if (r >= radii[widest]) widest = i;
    });
    const crownRounds = radii.length - widest - 1;
    return {
      stitches: stitches.length,
      joints,
      over,
      worst,
      excess,
      crownRounds,
      radiusToCover: radii[widest] - radii[radii.length - 1],
      fabricAvailable: crownRounds * vertical,
    };
  });

  const pct = ((100 * report.over) / report.joints).toFixed(1);
  say(`\n${hat}`);
  say(`  ${report.stitches} stitches, ${report.joints} joints`);
  say(`  over-long at the start: ${report.over} (${pct}%), ` +
    `worst ${report.worst.toFixed(2)}x, ${report.excess.toFixed(0)} units of excess`);
  say(`  crown: ${report.crownRounds} rounds, ` +
    `${report.fabricAvailable.toFixed(0)} units of fabric ` +
    `to cover ${report.radiusToCover.toFixed(0)} units of radius`);
  const ratio = report.radiusToCover / report.fabricAvailable;
  say(
    ratio > 1
      ? `  -> short by ${ratio.toFixed(2)}x: no arrangement of inextensible ` +
        `yarn closes this crown, so joints must be allowed to start stretched`
      : `  -> the fabric reaches; fixed joint lengths should settle`,
  );
  await page.close();
}

if (has("geometry")) {
  await geometry();
} else if (has("render")) {
  await render();
} else {
  const chosen = only ? runs.filter((r) => r.name === only) : runs;
  say(`settling ${hat}, up to ${minutes} minutes each\n`);
  say(
    "run                        settled  steps  tall:wide  built  width kept",
  );
  say("-".repeat(74));
  for (const run of chosen) {
    const result = await settle(run);
    const shape = result.shape;
    const ratio = shape ? shape.settled.tall / shape.settled.across : null;
    const built = shape ? shape.built.tall / shape.built.across : null;
    const width = shape ? shape.settled.across / shape.built.across : null;
    say(
      result.name.padEnd(26) +
        String(result.settled === null ? "no" : `${result.settled}s`).padEnd(9) +
        String(result.steps).padEnd(7) +
        (ratio === null ? "-" : ratio.toFixed(2)).padEnd(11) +
        (built === null ? "-" : built.toFixed(2)).padEnd(8) +
        (width === null ? "-" : `${(100 * width).toFixed(0)}%`),
    );
    if (result.why) say(`  ${result.why}`);
    for (const failure of result.failures) say(`  ERROR: ${failure}`);
  }
  say(
    "\nsettled: how long until the hat came to rest, or 'no' if it never did.\n" +
      "built: the proportions the pattern's own tension gives, before settling.\n" +
      "width kept: how much of that width survived. Rope joints only cap how\n" +
      "far apart stitches may be, so nothing stops a round closing up, and a\n" +
      "settle that loses width has traded the hat's circumference for height.",
  );
}

await browser.close();
stop();
