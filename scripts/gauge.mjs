/**
 * Settle a hat under different physics and measure what it came out as.
 *
 * The question this answers is narrow and the whole point: does the plain
 * body of the settled hat have the tension the pattern asks for? A knitter's
 * tension is stitches and rounds to ten centimetres, and between them they
 * say what shape a stitch is - so the ratio of the gap across to the gap up
 * is the one number a settled hat has to get right. Measured over a band of
 * the plain body, because the crown is meant to pull in and the rib is meant
 * to pull in, and averaging those in says nothing about either.
 *
 *     npm run build && npm run gauge -- --sweep ropes
 *
 * Sweeps: ropes, springs, head, all. It drives the site's own physics rather
 * than reimplementing it, and measures with the site's own measureGauge,
 * which has tests against the hat as the pattern builds it.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

/*
 * Say how it is going, durably. Node block-buffers stdout when it is not a
 * terminal, so a run piped to a file looks silent until it exits - and that
 * silence is indistinguishable from a run that has hung.
 */
const logPath = join(root, `gauge-${(process.argv.includes("--sweep") ? process.argv[process.argv.indexOf("--sweep") + 1] : "ropes")}.log`);
const say = (line) => {
  process.stdout.write(line + "\n");
  appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
};

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? fallback : argv[at + 1];
};

const hats = (flag("hats", "sww25-aal-ower-toorie")).split(",");
const which = flag("sweep", "ropes");
/** Give up on one configuration rather than the whole run. */
const settleTimeoutMs = Number(flag("timeout", 20 * 60_000));

/** Earth, in the units the hat is built in: one stitch is two of them. */
const earth = 9.81;

/*
 * The configurations.
 *
 * Gravity is signed, and the sign is a modelling choice rather than a detail.
 * Upwards is the sibling sites' trick for a hat with nothing inside it: the
 * hat is pinned at the cast-on and blown out from below. Downwards is what
 * actually happens to a hat, and only makes sense with something inside it
 * for the fabric to drape over - which is what headRadius is for.
 */
const sweeps = {
  /*
   * A rope caps how far apart two stitches may be and does nothing to stop
   * them closing up, and these hats are built with every joint already taut.
   * So the settled hat can only be smaller than the built one, and the only
   * lever on its tension is how much shorter the joints to the round below
   * are than the joints across the round.
   */
  ropes: [
    { name: "as it ships", gravity: 1 },
    { name: "earth, up", gravity: earth },
    { name: "earth, up, round 0.90", gravity: earth, roundSlack: 0.9 },
    { name: "earth, up, round 0.80", gravity: earth, roundSlack: 0.8 },
    { name: "earth, up, round 0.70", gravity: earth, roundSlack: 0.7 },
    { name: "earth, up, round 0.60", gravity: earth, roundSlack: 0.6 },
  ],
  /*
   * A spring pulls back both ways, so a round that closes up is pushed open
   * again. Stiffness is the unknown: too little and it is a rope with extra
   * steps, too much and the solver shakes the hat apart.
   */
  springs: (() => {
    /*
     * A stitch is a ball collider of radius 0.02 at density 1, so it weighs
     * about 3.4e-5 - which is what makes the obvious stiffness numbers wrong
     * by five orders of magnitude. What matters is stiffness against weight:
     * the force that holds a stitch up is its mass times gravity, so a spring
     * only does anything interesting when k times a fraction of a stitch is
     * somewhere near that. Hence a sweep by decade rather than by guess, with
     * damping set from each stiffness rather than fixed.
     */
    const mass = (4 / 3) * Math.PI * 0.02 ** 3;
    return [3e-4, 1e-3, 3e-3, 1e-2, 1e-1].map((stiffness) => ({
      name: `spring k=${stiffness}`,
      joints: "spring",
      gravity: earth,
      stiffness,
      // Half of critical, so it can still move but does not ring.
      springDamping: Number((Math.sqrt(stiffness * mass)).toPrecision(3)),
    }));
  })(),

  /*
   * Where the rope sweep lands: the joints to the round below are taut at
   * whatever they are allowed to be, so the tension out is the gap across
   * over that length, and the length that makes it right is near 0.96.
   */
  fine: [0.98, 0.96, 0.94].map((roundSlack) => ({
    name: `earth, up, round ${roundSlack}`,
    gravity: earth,
    roundSlack,
  })),

  /*
   * Inflation.
   *
   * The ropes across a round already know how wide it should be - n stitches
   * on ropes of length a enclose at most a circle of circumference n*a,
   * which is the circumference the knitting has - and nothing ever pushes a
   * round out to it. So the rounds ripple instead, keeping their stitch gaps
   * while enclosing two thirds of the width. This pushes them out against
   * their own ropes, which means the crown still tapers, because a crown
   * round has fewer stitches to be held out by.
   */
  pressure: [
    { name: "inflate 2, earth up", gravity: earth, pressure: 2 },
    { name: "inflate 5, earth up", gravity: earth, pressure: 5 },
    { name: "inflate 20, earth up", gravity: earth, pressure: 20 },
    { name: "inflate 20, no gravity", gravity: 0, pressure: 20 },
    { name: "inflate 20, earth up, round 0.96", gravity: earth, pressure: 20, roundSlack: 0.96 },
  ],

  /*
   * Gravity the right way up, over something to drape on. A hat's shape is
   * mostly decided by the head in it, and this is the only model here that
   * says so.
   */
  head: [
    { name: "head 40, down", gravity: -earth, headRadius: 40 },
    { name: "head 48, down", gravity: -earth, headRadius: 48 },
    { name: "head 48, down, spring", joints: "spring", gravity: -earth, headRadius: 48, stiffness: 200, springDamping: 20 },
  ],

  /*
   * The head the hat was knitted for.
   *
   * Not a guess: the body is 162 stitches round at two units each, so it
   * fits a head of radius 162*2/(2*pi), near enough 52. A smaller one and
   * the fabric gathers - head 40 came out with stitch gaps of 1.63 where the
   * wool makes 2.00 - and a larger one it cannot reach.
   */
  "head-fitted": [
    { name: "head 52, down", gravity: -earth, headRadius: 52 },
    { name: "head 52, down, half gravity", gravity: -earth / 2, headRadius: 52 },
    { name: "head 52, up", gravity: earth, headRadius: 52 },
  ],
};
/*
 * The ones worth looking at side by side, on both hats.
 *
 * Two routes to the pattern's tension, and they want opposite rope lengths:
 * shortening the round joints to 0.96 gets the tension right and leaves the
 * hat narrow, and leaving them at full length gets it right by way of
 * blocking, which fixes the width too.
 */
/*
 * A head rather than a ball, and a ball in an upside-down bag.
 *
 * The first asks what changes when the thing inside the hat is head-shaped -
 * longer front to back, fuller behind - rather than perfectly round, which no
 * head is and no hat drawn on one looks like. The second keeps the ball but
 * turns gravity back over: the hat hangs from its cast-on and is blown out
 * over something that stops it closing in, which is a different machine for
 * the same job.
 */
sweeps.skulls = [
  { name: "skull 52, down", gravity: -earth, headRadius: 52, head: "head", headTall: 60 },
  { name: "skull 52, up (bag)", gravity: earth, headRadius: 52, head: "head", headTall: 60 },
  { name: "skull 52, tall 70, up (bag)", gravity: earth, headRadius: 52, head: "head", headTall: 70 },
];

sweeps.heads = [
  { name: "ball 52, down", gravity: -earth, headRadius: 52 },
  { name: "head 52, down", gravity: -earth, headRadius: 52, head: "head", headTall: 60 },
  { name: "head 52, tall 75, down", gravity: -earth, headRadius: 52, head: "head", headTall: 75 },
  { name: "ball 52, up (bag)", gravity: earth, headRadius: 52 },
  { name: "head 52, up (bag)", gravity: earth, headRadius: 52, head: "head", headTall: 60 },
  { name: "inflate 5, earth up", gravity: earth, pressure: 5 },
];

sweeps.finalists = [
  { name: "as it ships", gravity: 1 },
  { name: "earth, up", gravity: earth },
  { name: "earth, up, round 0.96", gravity: earth, roundSlack: 0.96 },
  { name: "earth, up, inflated", gravity: earth, pressure: 20 },
];

/*
 * The soft end of the spring sweep, given the time it actually needs.
 *
 * These were cut off at five minutes still moving, which is not the same as
 * not settling: the motion was falling steadily throughout. Worth running out
 * rather than reporting a timeout as a result.
 */
sweeps["springs-long"] = (() => {
  const mass = (4 / 3) * Math.PI * 0.02 ** 3;
  return [3e-3].map((stiffness) => ({
    name: `spring k=${stiffness} (long)`,
    joints: "spring",
    gravity: earth,
    stiffness,
    springDamping: Number(Math.sqrt(stiffness * mass).toPrecision(3)),
  }));
})();

sweeps.all = [...sweeps.ropes, ...sweeps.springs, ...sweeps.head];

const runs = sweeps[which];
if (!runs) {
  say(`no sweep called "${which}"; try ${Object.keys(sweeps).join(", ")}`);
  process.exit(1);
}

writeFileSync(logPath, "");
say(`${runs.length} configurations x ${hats.length} hats`);

const port = 4321;
const base = `http://127.0.0.1:${port}/wool-week/`;

/*
 * Its own preview server, in its own process group: npx spawns a shell which
 * spawns vite, so killing what we started leaves the grandchild holding the
 * port and the next run quietly talks to the orphan.
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
    // Not up yet.
  }
  if (attempt > 60) {
    say("the preview server never came up; is the site built?");
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium",
});

const shots = join(root, "gauge-shots");
mkdirSync(shots, { recursive: true });
const rows = [];

for (const hatId of hats) {
  for (const run of runs) {
    const { name, ...tuning } = run;
    const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
    page.on("pageerror", (error) => say(`  ERROR ${error.message}`));

    const query = Object.entries({ settle: 1, settled: 0, stepBudgetMs: 4000, ...tuning })
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    await page.goto(`${base}#/hat/${hatId}?${query}`, { waitUntil: "networkidle" });

    const started = Date.now();
    let reported = 0;
    const ticker = setInterval(async () => {
      const progress = await page.evaluate(() => window.__settleProgress).catch(() => undefined);
      if (!progress || progress.steps === reported) return;
      reported = progress.steps;
      say(`  ${name}: ${progress.steps} steps, motion ${progress.motion.toFixed(3)}, ${((Date.now() - started) / 1000).toFixed(0)}s`);
    }, 15_000);

    const gauge = await page
      .waitForFunction(() => window.__settledPositions, undefined, {
        timeout: settleTimeoutMs,
        polling: 1_000,
      })
      .then(() =>
        page.evaluate(() => {
          const at = window.__settledPositions;
          const measured = window.__hat.gauge(at);
          /*
           * And the hat's own size, which the gauge deliberately says nothing
           * about: it measures a band of the body, so a hat could have
           * perfect tension and still be the wrong hat.
           */
          let low = Infinity;
          let high = -Infinity;
          let widest = 0;
          for (let id = 1; id < at.length; id++) {
            const point = at[id];
            if (!point) continue;
            low = Math.min(low, point.y);
            high = Math.max(high, point.y);
            widest = Math.max(widest, Math.hypot(point.x, point.z));
          }
          /*
           * And what the same hat measures once it is blocked - pulled out to
           * the circle each round's own stitches make, as a knitter blocks a
           * finished hat over a board. The settle is unchanged; this only
           * says what blocking it would be worth.
           */
          const blocked = window.__hat.blocked(at, 1);
          return {
            ...measured,
            tall: high - low,
            widest,
            blockedRatio: blocked.ratio,
            blockedRadius: blocked.radius,
            blockedFrill: blocked.frill,
          };
        }),
      )
      .catch((error) => ({ failed: String(error).split("\n")[0] }));
    clearInterval(ticker);

    /*
     * And a picture, because the numbers cannot say whether it looks like a
     * hat. A model can have the tension the pattern asks for across the band
     * measured and still be a sack.
     */
    if (!gauge.failed) {
      const slug = `${hatId}-${name.replace(/[^a-z0-9]+/gi, "-")}`;
      // The stage itself, not the page around it.
      const stage = await page.$("canvas");
      await (stage ?? page)
        .screenshot({ path: join(shots, `${slug}.png`) })
        .catch(() => undefined);
    }

    const seconds = (Date.now() - started) / 1000;
    if (gauge.failed) {
      say(`${hatId} ${name}: FAILED after ${seconds.toFixed(0)}s - ${gauge.failed}`);
      rows.push({ hatId, name, seconds, failed: true });
    } else {
      rows.push({ hatId, name, seconds, ...gauge });
      say(
        `${hatId} ${name}: ratio ${gauge.ratio.toFixed(3)} (wants ${gauge.wanted.toFixed(3)}), ` +
          `across ${gauge.across.toFixed(2)} up ${gauge.up.toFixed(2)}, ` +
          `radius ${gauge.radius.toFixed(1)}, frill ${gauge.frill.toFixed(2)}, tall ${gauge.tall.toFixed(0)}, ` +
          `${seconds.toFixed(0)}s`,
      );
    }
    await page.close();
  }
}

/** Built radius, so "how much of its width did it keep" has something to be against. */
const table = [
  "hat                        configuration            ratio   wants    err   across     up  radius   frill    tall  blk-rat  blk-rad  settle",
  ...rows.map((r) =>
    r.failed
      ? `${r.hatId.padEnd(26)} ${r.name.padEnd(24)} failed after ${r.seconds.toFixed(0)}s`
      : [
          r.hatId.padEnd(26),
          r.name.padEnd(24),
          r.ratio.toFixed(3).padStart(5),
          r.wanted.toFixed(3).padStart(7),
          `${(100 * (r.ratio / r.wanted - 1)).toFixed(0)}%`.padStart(6),
          r.across.toFixed(2).padStart(7),
          r.up.toFixed(2).padStart(6),
          r.radius.toFixed(1).padStart(7),
          r.frill.toFixed(2).padStart(7),
          r.tall.toFixed(0).padStart(7),
          (r.blockedRatio ?? 0).toFixed(3).padStart(8),
          (r.blockedRadius ?? 0).toFixed(1).padStart(8),
          `${r.seconds.toFixed(0)}s`.padStart(8),
        ].join(" "),
  ),
];
say("\n" + table.join("\n"));
writeFileSync(join(root, `gauge-${which}.json`), JSON.stringify(rows, null, 2) + "\n");

await browser.close();
stop();
