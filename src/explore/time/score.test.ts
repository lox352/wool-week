import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { hatById } from "../../data/hats";
import { featuresOf } from "./features";
import { scenarios, scoreRun, Run } from "./score";

const seeds = Number(process.env.SEEDS ?? 2);
it("scores every approach", () => {
  const runs: Run[] = [];
  for (const [hat, size] of [["sww26-birsie-beanny", "medium"], ["sww25-aal-ower-toorie", "medium"]] as const) {
    const features = featuresOf(hatById(hat)!, size);
    for (const scenario of scenarios) for (let seed = 1; seed <= seeds; seed++) {
      runs.push(scoreRun(features, hat, scenario, seed));
    }
  }
  writeFileSync(process.env.OUT ?? "/tmp/claude-0/time-results.json", JSON.stringify(runs, null, 1));
}, 3_600_000);
