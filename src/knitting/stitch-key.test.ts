import { describe, expect, it } from "vitest";
import { hatById } from "../data/hats";
import { buildHat } from "./engine";
import { stitchKey } from "./stitch-key";

const keyOf = (id: string) => {
  const hat = hatById(id)!;
  return stitchKey(buildHat(hat, hat.sizes[0].id).stitches, hat.stitchNotes);
};

describe("the stitch-symbol key", () => {
  it("lists a KFB once, and no make-one for its second loop", () => {
    const ids = keyOf("sww23-buggiflooer-beanie").map((entry) => entry.id);
    expect(ids).toContain("kfb");
    expect(ids).not.toContain("m1");
  });

  it("lists a make-one where one is picked up on its own", () => {
    const ids = keyOf("sww15-baa-ble-hat").map((entry) => entry.id);
    expect(ids).toContain("m1");
    expect(ids).not.toContain("kfb");
  });

  it("only lists stitches the hat uses", () => {
    const ids = keyOf("sww15-baa-ble-hat").map((entry) => entry.id);
    expect(ids).not.toContain("sk2p");
    expect(ids).not.toContain("k2togtbl");
  });

  it("carries what a pattern says about its own stitches", () => {
    const kfb = keyOf("sww14-shwook-hat").find((entry) => entry.id === "kfb");
    expect(kfb?.note).toMatch(/m1/);
  });
});
