// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("keeps expensive settlement behind an explicit opt-in", () => {
  const source = readFileSync(new URL("./HatModel.tsx", import.meta.url), "utf8");
  expect(source).toContain('options().get("settle") === "1"');
});
