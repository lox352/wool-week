/**
 * Writes a simulated knitter's log, in the site's own format, for the
 * statistics-view prototypes: `OUT=... npx vitest run src/explore/time/demo-log.test.ts`.
 */
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { hatById } from "../../data/hats";
import { featuresOf } from "./features";
import { simulate } from "./simulate";

const codes = { enter: 10, exit: 11, load: 12, hide: 13, show: 14 } as const;

it("writes demo logs", () => {
  for (const [hat, size, style, upTo] of [
    ["sww25-aal-ower-toorie", "medium", "runs", 6800],
    ["sww25-aal-ower-toorie", "medium", "mixed", 6800],
  ] as const) {
    const features = featuresOf(hatById(hat)!, size);
    const sim = simulate(features, { name: "demo", style, exits: "always", screen: "locks", messy: true }, 3);
    // Moved to a week before now, so the dates read naturally.
    const shift = Date.UTC(2026, 8, 21, 19) - sim.actions[0].t;
    const rows: number[][] = [];
    let last = 0;
    let progress = 0;
    let p = 0;
    const push = (t: number, row: number[]) => {
      const s = Math.round((t + shift) / 1000);
      rows.push([rows.length ? s - last : s, ...row]);
      last = s;
    };
    for (let i = 0; i < sim.actions.length; i++) {
      const a = sim.actions[i];
      if (a.from >= upTo) break;
      for (; p < sim.page.length && sim.page[p].seq <= i; p++) push(sim.page[p].t, [0, codes[sim.page[p].kind]]);
      const to = Math.min(a.to, upTo);
      push(a.t, a.kind === "undo" ? [to - progress, 1] : [to - progress]);
      progress = to;
    }
    writeFileSync(`${process.env.OUT ?? "/tmp/claude-0/stats"}/${hat}-${style}.json`, JSON.stringify({ progress, rows }));
  }
});
