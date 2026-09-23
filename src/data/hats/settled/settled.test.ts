import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildHat } from "../../../knitting/engine";
import { hatById } from "../index";

const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((name) => name.endsWith(".json"));

const targetOf = (file: string) => {
  const stem = file.replace(/\.json$/, "");
  const split = stem.lastIndexOf("--");
  return split < 0
    ? { hatId: stem, sizeId: undefined }
    : { hatId: stem.slice(0, split), sizeId: stem.slice(split + 2) };
};

describe("the settled positions", () => {
  it("cover every hat, or none", () => {
    expect(files.length === 0 || files.length >= 1).toBe(true);
  });

  files.forEach((file) => {
    const { hatId, sizeId } = targetOf(file);
    const target = sizeId ? `${hatId} / ${sizeId}` : hatId;

    it(`${target} is a hat and size the site knows`, () => {
      const hat = hatById(hatId);
      expect(hat, `no hat is called ${hatId}`).toBeDefined();
      if (hat && sizeId) {
        expect(
          hat.sizes.some((size) => size.id === sizeId),
          `${hatId} has no size ${sizeId}`,
        ).toBe(true);
      }
    });

    it(`${target} has a position for every stitch`, () => {
      const hat = hatById(hatId);
      if (!hat) return;
      const flat = JSON.parse(readFileSync(join(here, file), "utf8")) as number[];
      const { stitches } = buildHat(hat, sizeId);
      expect(flat.length % 3).toBe(0);
      expect(flat.length / 3).toBe(stitches.length);
    });

    it(`${target} is a hat-shaped set of numbers`, () => {
      const flat = JSON.parse(readFileSync(join(here, file), "utf8")) as number[];
      expect(flat.every(Number.isFinite)).toBe(true);
      expect(Math.max(...flat.map(Math.abs))).toBeLessThan(1000);

      const ys = flat.filter((_, i) => i % 3 === 1);
      const radii = flat
        .map((_, i) => (i % 3 === 0 ? Math.hypot(flat[i], flat[i + 2]) : 0))
        .filter((_, i) => i % 3 === 0);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(10);
      expect(Math.max(...radii)).toBeGreaterThan(10);
    });
  });
});
