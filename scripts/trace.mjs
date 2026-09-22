/**
 * Watch a hat settle, and ask when it stopped changing shape.
 *
 * Which is not the same question as when it stopped moving, and the gap
 * between the two is the whole reason this exists: the rest detector waits on
 * mean velocity, and by eye a hat looks finished long before that clears.
 * Either the eye is missing something or the detector is asking the wrong
 * thing, and the way to find out is to record the settle and measure each
 * moment of it against where it ended up.
 *
 *     npm run build && node scripts/trace.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logPath = join(root, "trace.log");
writeFileSync(logPath, "");
const say = (line) => {
  process.stdout.write(line + "\n");
  appendFileSync(logPath, line + "\n");
};

const hatId = process.argv[2] ?? "sww25-aal-ower-toorie";
const port = 4333;
const base = `http://127.0.0.1:${port}/wool-week/`;

const server = spawn(
  "npx",
  ["vite", "preview", "--port", String(port), "--host", "127.0.0.1"],
  { cwd: root, stdio: "ignore", detached: true },
);
const stop = () => {
  try { process.kill(-server.pid, "SIGTERM"); } catch { server.kill(); }
};
process.on("exit", stop);

for (let attempt = 0; ; attempt++) {
  try { if ((await fetch(base)).ok) break; } catch { /* not up */ }
  if (attempt > 60) { say("the preview server never came up"); process.exit(1); }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium",
});
const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
page.on("pageerror", (error) => say(`ERROR ${error.message}`));

// settled=0 so it settles rather than loading the answer; stepBudgetMs so it
// runs flat out rather than politely.
await page.goto(`${base}#/hat/${hatId}?settle=1&settled=0&stepBudgetMs=4000`, {
  waitUntil: "networkidle",
});
await page.waitForFunction(() => window.__settleProgress, undefined, {
  timeout: 60_000,
  polling: 250,
});

const started = Date.now();
const samples = [];
while (true) {
  const sample = await page.evaluate(() => {
    const at = window.__livePositions?.();
    if (!at) return null;
    const progress = window.__settleProgress;
    return {
      steps: progress.steps,
      motion: progress.motion,
      moved: progress.moved,
      done: Boolean(window.__settledPositions),
      at: at.map((p) => [p.x, p.y, p.z]),
    };
  });
  if (!sample) break;
  samples.push({ ...sample, at: sample.at, seconds: (Date.now() - started) / 1000 });
  if (sample.done) break;
  if (Date.now() - started > 15 * 60_000) { say("gave up waiting"); break; }
  await new Promise((resolve) => setTimeout(resolve, 700));
}

const final = samples[samples.length - 1].at;
/** How far the hat still had to travel, per stitch, in stitch widths. */
const away = (at) => {
  let total = 0;
  let worst = 0;
  for (let id = 1; id < final.length; id++) {
    const gap = Math.hypot(
      at[id][0] - final[id][0],
      at[id][1] - final[id][1],
      at[id][2] - final[id][2],
    );
    total += gap;
    worst = Math.max(worst, gap);
  }
  return { mean: total / (final.length - 1) / 2, worst: worst / 2 };
};

say(`${hatId}: ${samples.length} samples, settled after ${samples[samples.length - 1].steps} steps`);
say("");
say("  time   steps    motion     moved   still to go   worst stitch");
for (const sample of samples) {
  const { mean, worst } = away(sample.at);
  say(
    `${sample.seconds.toFixed(1).padStart(6)}s ${String(sample.steps).padStart(7)} ` +
      `${sample.motion.toFixed(4).padStart(9)} ${sample.moved.toFixed(5).padStart(9)} ` +
      `${mean.toFixed(4).padStart(13)} ${worst.toFixed(3).padStart(14)}`,
  );
}
say("");
say("moved and the last two columns are in stitch widths: 0.01 is a hundredth of a stitch.");

await browser.close();
stop();
