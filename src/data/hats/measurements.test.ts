import { expect, it } from "vitest";
import { hatById } from "./index";
it("preserves published ranges and distinguishes estimates", () => {
  expect(hatById("sww15-baa-ble-hat")!.sizes[0].toFitRangeCm).toEqual([52, 57]);
  expect(hatById("sww18-merrie-dancers-toorie")!.sizes.every(s => s.toFitCm === undefined && s.lengthEstimated)).toBe(true);
  expect(hatById("sww16-crofthoose-hat")!.sizes[0].circumferenceEstimated).toBe(true);
  expect(hatById("sww19-roadside-beanie")!.sizes[0].measurementNote).toContain("52.5cm");
});
