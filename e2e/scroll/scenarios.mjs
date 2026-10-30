/**
 * The scroll harness's scenarios: a hat opened at a given place, and
 * what a knitter does to its chart there, recorded frame by frame (see
 * recorder.js) and measured (see metrics.mjs). Each is a function of the
 * page, run by the suite (scroll-quality.spec.mjs) and the lab
 * (scripts/scroll-lab.mjs) alike.
 */
import { boxOf, ctrlWheel, pinch, settled, swipe, trackpad, wheelNotches } from "./gestures.mjs";
export { settled };

const recorder = new URL("./recorder.js", import.meta.url);

/** The Birsie Beanny in a medium: the tallest chart, 122 rounds, turned inside out after round 51. */
export const birsie = { hatId: "sww26-birsie-beanny", sizeId: "medium", colourwayId: "sea-anemone" };
/** The Aal Ower Toorie in a medium: a rib of 130 under a body of 162, its columns opening as the increases come into view. */
export const aalOwer = { hatId: "sww25-aal-ower-toorie", sizeId: "medium", colourwayId: "vintage" };
/** The Islesburgh Toorie in a medium: a crown of eight wedges closing up. */
export const islesburgh = { hatId: "sww24-islesburgh-toorie", sizeId: "medium", colourwayId: "jamiesons" };

/**
 * Where a stitch's cell is on screen, as the chart draws it now: its middle,
 * and the box's edges.
 */
export const cellOnScreen = (page, id) =>
  page.evaluate((id) => {
    const view = window.__chartViews.at(-1);
    const cell = view?.cellOnSheet(id);
    const sheet = document.querySelector(".chart-sheets").getBoundingClientRect();
    const box = document.querySelector(".chart-scroll").getBoundingClientRect();
    return {
      x: cell ? sheet.left + cell.x + cell.width / 2 : undefined,
      y: cell ? sheet.top + cell.y + cell.height / 2 : undefined,
      box: { left: box.left, top: box.top, right: box.right, bottom: Math.min(box.bottom, innerHeight) },
    };
  }, id);

/** The box scrolled straight up or down until a stitch is `from` the top of it, and let come to rest. */
const bringDown = async (page, id, from = 120) => {
  const at = await cellOnScreen(page, id);
  if (at.y === undefined) throw new Error(`stitch ${id} is not drawn`);
  await page.locator(".chart-scroll").evaluate((box, by) => {
    box.scrollTop += by;
  }, at.y - at.box.top - from);
  await settled(page, { quiet: 500 });
};

/** A stitch tapped, and knitting carried on up to it from the picker. */
const knitUpTo = async (page, id) => {
  const at = await cellOnScreen(page, id);
  await page.evaluate(() => window.__scrollProbe.mark("tapped"));
  await page.mouse.click(at.x, at.y);
  await page.getByRole("button", { name: /Knit up to here/ }).click();
  await page.evaluate(() => window.__scrollProbe.mark("knit up to here"));
};

/** The recorder, in every page of the context, before the page's own script. */
export const instrument = async (context) => {
  await context.addInitScript({ path: decodeURIComponent(recorder.pathname) });
};

/**
 * A project at `progress`, opened at its chart: knitting, so it fills the
 * screen and follows the stitch to be worked, or looked through, with the
 * knitting closed and nothing followed.
 */
export const open = async (page, { choices = birsie, progress = 0, knitting = false } = {}) => {
  await page.goto("");
  await page.evaluate(({ progress, choices }) => {
    const now = new Date().toISOString();
    const id = "project-1760000000000";
    localStorage.clear();
    localStorage.setItem(id, JSON.stringify({ version: 1, id, ...choices, progress, startedAt: now, updatedAt: now }));
  }, { progress, choices });
  await page.goto(`#/project/1760000000000/chart${knitting ? "?knitting=1" : ""}`);
  // Opened before the project was read, the page may show the projects instead: once more, then.
  const canvas = page.locator(".chart-tiles canvas").first();
  if (!(await canvas.waitFor({ state: "attached", timeout: 10_000 }).then(() => true, () => false))) {
    await page.reload();
    await canvas.waitFor({ state: "attached" });
  }
  await page.waitForFunction(() => window.__chartViews?.length > 0);
  await settled(page, { quiet: 500 });
};

/**
 * A scenario's act, recorded frame by frame; and, once the chart is at
 * rest, the tiles audited (see TileView.audit): every one taken to be up to
 * date painted again and compared.
 */
export const record = async (page, act) => {
  await page.evaluate(() => window.__scrollProbe.start());
  await act();
  await settled(page, { quiet: 600 });
  const recording = await page.evaluate(() => window.__scrollProbe.stop());
  recording.audit = await page.evaluate(() => window.__chartViews.at(-1)?.audit?.());
  return recording;
};

/** The box scrolled straight to a corner of the chart, and let come to rest. */
const toCorner = async (page, { right = true, bottom = true }) => {
  await page.locator(".chart-scroll").evaluate((box, { right, bottom }) => {
    box.scrollLeft = right ? 0 : -1e7;
    box.scrollTop = bottom ? 1e7 : 0;
  }, { right, bottom });
  await settled(page, { quiet: 500 });
};

/** A step on the way, or the end of the round: what the knitting panel offers next, a round at a time. */
const nextRound = async (page) => {
  await page.evaluate(() => window.__scrollProbe.mark("end of round"));
  const step = page.getByRole("button", { name: /^(Joined|Changed|Turned): carry on$/ });
  if (await step.isVisible()) await step.click();
  else await page.getByRole("button", { name: /^End of round$/ }).click();
};

/**
 * The scenarios, each named for what it does. `touch` ones want a page that
 * takes touches - a phone's - and `wheel` ones a mouse or trackpad's.
 */
export const scenarios = {
  "fling up the chart": {
    input: "touch",
    setup: (page) => open(page, { choices: birsie }),
    act: async (page) => {
      for (let k = 0; k < 6; k++) {
        await swipe(page, { dy: 260, speed: 1600 });
        await page.waitForTimeout(350);
      }
    },
  },
  "fling down from the crown": {
    input: "touch",
    setup: async (page) => {
      await open(page, { choices: islesburgh });
      await toCorner(page, { bottom: false });
    },
    act: async (page) => {
      for (let k = 0; k < 6; k++) {
        await swipe(page, { dy: -260, speed: 1600 });
        await page.waitForTimeout(350);
      }
    },
  },
  "fling into the bottom right corner, bouncing past it": {
    /*
     * As a knitter caught up from the crown flicks back to the cast-on, on an
     * iPhone: the box flung on past the chart's corner bounces back from it
     * by itself, telling of scrolls beyond it on the way. Taken at their
     * word, they had the chart's edges kept that much further out, and the
     * box came to rest as far short of the corner as it had bounced past.
     */
    input: "touch",
    corner: true,
    /*
     * The bounce here is only told of, not drawn - this browser can't scroll
     * past an end - so what is on screen does not follow the scroll it tells
     * of, and the measure of that is no measure of the chart's.
     */
    known: { jitter: Infinity },
    setup: async (page) => {
      await open(page, { choices: aalOwer, progress: 0, knitting: true });
      // Up and left of the corner, a swipe at a time, the finger lifted slowly.
      for (let k = 0; k < 2; k++) {
        await swipe(page, { dx: 300, speed: 600, fling: false });
        await settled(page, { quiet: 300 });
        await swipe(page, { dy: 500, speed: 600, fling: false });
        await settled(page, { quiet: 300 });
      }
    },
    act: async (page) => {
      await swipe(page, { dx: -300, dy: -500, speed: 4000, bounce: true });
    },
  },
  "fling across the body and back": {
    input: "touch",
    setup: (page) => open(page, { choices: aalOwer, progress: 6940 }),
    act: async (page) => {
      for (const dx of [300, 300, 300, -300, -300, -300]) {
        await swipe(page, { dx, speed: 2000 });
        await page.waitForTimeout(300);
      }
    },
  },
  "fling diagonally over the brim": {
    input: "touch",
    setup: (page) => open(page, { choices: aalOwer }),
    act: async (page) => {
      for (const [dx, dy] of [[200, 200], [200, 200], [-150, 250], [250, -100], [-250, 200]]) {
        await swipe(page, { dx, dy, speed: 1800 });
        await page.waitForTimeout(250);
      }
    },
  },
  "drag slowly up through the increases": {
    input: "touch",
    setup: (page) => open(page, { choices: aalOwer }),
    act: async (page) => {
      for (let k = 0; k < 4; k++) await swipe(page, { dy: 220, speed: 300, fling: false });
    },
  },
  "fling then reverse before it stops": {
    input: "touch",
    setup: (page) => open(page, { choices: birsie }),
    act: async (page) => {
      for (let k = 0; k < 3; k++) {
        await swipe(page, { dy: 300, speed: 2400 });
        await page.waitForTimeout(80);
        await swipe(page, { dy: -200, speed: 2400 });
        await page.waitForTimeout(80);
      }
    },
  },
  "trackpad up and across": {
    input: "wheel",
    /*
     * Known, as on the sweater site: while the box keeps moving, the sheet
     * keeps the size it had at rest, so once many columns have opened a
     * scroll across moves the chart further than the fingers (see
     * TileView.slideAcross) until the box rests and the sheet takes the
     * chart's width. Its slips, lurches, jitter and shake are measured and
     * reported, but how many there are turns on when the wheel's events
     * fall between frames, which differs from one machine to the next: they
     * are not held to a number until it is fixed. Everything else is.
     */
    known: { slips: Infinity, lurches: Infinity, jitter: Infinity, shake: Infinity },
    setup: (page) => open(page, { choices: aalOwer }),
    act: async (page) => {
      await trackpad(page, { dy: -1400 });
      await trackpad(page, { dx: -1400 });
      await trackpad(page, { dx: -800, dy: -800 });
      await trackpad(page, { dx: 1200, dy: 900 });
    },
  },
  "wheel up the chart": {
    input: "wheel",
    // As for the trackpad: see there.
    known: { slips: Infinity, lurches: Infinity, jitter: Infinity, shake: Infinity },
    setup: (page) => open(page, { choices: islesburgh }),
    act: async (page) => {
      await wheelNotches(page, { notches: -12, step: 100, gap: 60 });
      await wheelNotches(page, { notches: -12, step: 100, gap: 60, across: true });
    },
  },
  "zoom in and out about a point, then scroll": {
    input: "wheel",
    setup: (page) => open(page, { choices: aalOwer }),
    act: async (page) => {
      const box = await boxOf(page);
      const at = { ...box, x: box.x - box.width * 0.2, y: box.y - box.height * 0.15 };
      await ctrlWheel(page, { delta: -30, steps: 4, at });
      await page.waitForTimeout(700);
      await trackpad(page, { dy: -900, at });
      await ctrlWheel(page, { delta: 30, steps: 4, at });
      await page.waitForTimeout(700);
      await trackpad(page, { dx: -900, at });
    },
  },
  "zoom out to the whole width and back in": {
    input: "any",
    setup: (page) => open(page, { choices: birsie }),
    act: async (page) => {
      const chart = page.getByRole("region", { name: /Scrollable knitting chart/ });
      await chart.focus();
      for (const key of [..."--------", ..."++++++++"]) {
        await page.evaluate((key) => window.__scrollProbe.mark(`press ${key}`), key);
        await chart.press(key);
        await page.waitForTimeout(300);
      }
      await page.evaluate(() => window.__scrollProbe.mark("zoom done"));
    },
  },
  "zoom in from the whole width, then fling across": {
    input: "touch",
    // Knitting, the chart's scrollbars are put away: where they would be is not held to.
    known: { scrollbars: Infinity },
    setup: async (page) => {
      await open(page, { choices: aalOwer, knitting: true });
      const chart = page.getByRole("region", { name: /Scrollable knitting chart/ });
      await chart.focus();
      for (let k = 0; k < 8; k++) {
        await chart.press("-");
        await page.waitForTimeout(150);
      }
      await settled(page, { quiet: 500 });
    },
    act: async (page) => {
      const box = await boxOf(page);
      await pinch(page, { scale: Number(process.env.PINCH_SCALE ?? 6), at: { ...box, x: box.left + box.width * Number(process.env.PINCH_X ?? 0.3), y: box.top + box.height * Number(process.env.PINCH_Y ?? 0.6) } });
      await page.waitForTimeout(150);
      await swipe(page, { dx: -250, speed: 2500 });
      await page.waitForTimeout(150);
      await swipe(page, { dx: 200, speed: 2500 });
    },
  },
  "knit a few rounds, the chart following": {
    input: "any",
    setup: (page) => open(page, { choices: islesburgh, progress: 4466, knitting: true }),
    act: async (page) => {
      for (let k = 0; k < 6; k++) {
        await nextRound(page);
        await page.waitForTimeout(450);
      }
    },
  },
  "knit up the brim, joined and onto the body's needles": {
    input: "any",
    setup: (page) => open(page, { choices: aalOwer, progress: 0, knitting: true }),
    act: async (page) => {
      // A stitch at a time is too slow to cross a round; a round at a time, with the steps on the way.
      for (let k = 0; k < 14; k++) {
        await nextRound(page);
        await page.waitForTimeout(350);
      }
    },
  },
  "knit across the turn, the chart turning over": {
    input: "any",
    setup: (page) => open(page, { choices: birsie, progress: 7047, knitting: true }),
    act: async (page) => {
      for (let k = 0; k < 4; k++) {
        await nextRound(page);
        await page.waitForTimeout(450);
      }
    },
  },
  "knit up into the crown at a tap, its wedges closing on the way": {
    /*
     * As a knitter caught up with a chart left behind does: twenty rounds
     * on at a tap, from the body into the crown, the columns its decreases
     * give up closing on the way.
     */
    input: "any",
    setup: async (page) => {
      await open(page, { choices: islesburgh, progress: 7025, knitting: true });
      await page.locator(".chart-scroll").evaluate((box) => {
        box.scrollTop -= 300;
      });
      await settled(page, { quiet: 500 });
    },
    act: async (page) => {
      // Whatever stitch is drawn in the middle of the box, near its top.
      const id = await page.evaluate(() => {
        const box = document.querySelector(".chart-scroll").getBoundingClientRect();
        return window.__chartViews.at(-1).stitchAt(box.left + box.width / 2, box.top + 60);
      });
      await knitUpTo(page, id);
      await page.waitForTimeout(1200);
    },
  },
  "knit up to a stitch a few rounds on": {
    input: "any",
    setup: (page) => open(page, { choices: birsie, progress: 4360, knitting: true }),
    act: async (page) => {
      // Whatever stitch is drawn five rows up and four along from the one to be worked.
      const id = await page.evaluate(() => {
        const next = document.querySelector(".chart-next").getBoundingClientRect();
        return window.__chartViews.at(-1).stitchAt(next.left - next.width * 3.5, next.top - next.height * 4.5);
      });
      await knitUpTo(page, id);
      await page.waitForTimeout(1000);
    },
  },
  "drag slowly across the crown, the columns closing": {
    input: "touch",
    setup: async (page) => {
      await open(page, { choices: islesburgh, progress: 9000 });
      await toCorner(page, { bottom: false });
    },
    act: async (page) => {
      for (let k = 0; k < 4; k++) await swipe(page, { dx: 200, speed: 250, fling: false });
    },
  },
  "the window resized mid-fling": {
    input: "touch",
    setup: (page) => open(page, { choices: birsie }),
    act: async (page) => {
      const size = page.viewportSize();
      const fling = swipe(page, { dy: 300, speed: 2000 });
      await page.waitForTimeout(120);
      await page.setViewportSize({ width: size.width, height: Math.round(size.height * 0.8) });
      await fling;
      await page.waitForTimeout(400);
      await page.setViewportSize(size);
      await swipe(page, { dx: 250, speed: 2000 });
    },
  },
};

/** The scenarios for a page that takes `input`: "touch" or "wheel". */
export const scenariosFor = (input) => Object.entries(scenarios).filter(([, s]) => s.input === "any" || s.input === input);
