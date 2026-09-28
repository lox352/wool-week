import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { hatById } from "../../data/hats";
import { featuresOf } from "./features";
import { EventRun, scoreEvents } from "./score-events";
import { ExitHabit, Screen, Style } from "./simulate";

const seeds = Number(process.env.SEEDS ?? 1);
it("scores what the page's events add", () => {
  const runs: EventRun[] = [];
  for (const [hat, size] of [["sww26-birsie-beanny", "medium"], ["sww25-aal-ower-toorie", "medium"]] as const) {
    const features = featuresOf(hatById(hat)!, size);
    for (const style of ["runs", "rounds", "mixed"] as Style[])
      for (const exits of ["breaks", "always", "sometimes", "never"] as ExitHabit[])
        for (const screen of ["locks", "on"] as Screen[])
          for (let seed = 1; seed <= seeds; seed++)
            runs.push(scoreEvents(features, hat, { name: `${style} ${exits} ${screen}`, style, exits, screen, messy: true }, seed));
  }
  if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify(runs));
}, 3_600_000);
