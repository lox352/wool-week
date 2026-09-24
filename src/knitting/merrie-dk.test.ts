import { expect, it } from "vitest";
import hat from "../data/hats/sww18-merrie-dancers-toorie";
import { buildHat } from "./engine";

it("replays the 2018 DK source counts and omitted rib rows", () => {
  const { rounds, roundLabels, stitches } = buildHat(hat, "yw1");
  expect(rounds).toHaveLength(71); // cast-on plus 70 worked rounds
  expect(rounds[0]).toHaveLength(108);
  expect(rounds[12]).toHaveLength(132);
  expect(rounds[48]).toHaveLength(120);
  expect(rounds.at(-1)).toHaveLength(10);
  expect(roundLabels.filter(s => /chart A/i.test(s))).toHaveLength(10);
  expect(rounds[12].filter(id => stitches[id].type === "kfb")).toHaveLength(24);
  expect(hat.colourways.filter(c => c.sizeIds?.includes("yw1")).every(c => c.yarn === "DK")).toBe(true);
});
