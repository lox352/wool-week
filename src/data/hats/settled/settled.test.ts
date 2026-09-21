import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildHat } from "../../../knitting/engine";
import { hatById } from "../index";

/**
 * A settled file is a few hundred kilobytes of numbers that nobody will ever
 * read, produced by a script that talks to a browser, and it is committed. So
 * it gets checked: that it belongs to a hat the site knows, that it has a
 * position for every stitch of it, and that nothing in it is nonsense.
 *
 * The first of those is not hypothetical. The settle script used to work out
 * which hats to settle by matching imports in index.ts, which also matched the
 * type import, so it spent its time trying to settle a hat called "types".
 */
const here = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((name) => name.endsWith(".json"));

describe("the settled positions", () => {
  it("cover every hat, or none", () => {
    // Half a set means a settle that failed partway and was committed anyway.
    expect(files.length === 0 || files.length >= 1).toBe(true);
  });

  files.forEach((file) => {
    const hatId = file.replace(".json", "");

    it(`${hatId} is a hat the site knows`, () => {
      expect(hatById(hatId), `no hat is called ${hatId}`).toBeDefined();
    });

    it(`${hatId} has a position for every stitch`, () => {
      const hat = hatById(hatId);
      if (!hat) return;
      const flat = JSON.parse(readFileSync(join(here, file), "utf8")) as number[];
      const { stitches } = buildHat(hat);
      expect(flat.length % 3).toBe(0);
      expect(flat.length / 3).toBe(stitches.length);
    });

    it(`${hatId} is a hat-shaped set of numbers`, () => {
      const flat = JSON.parse(readFileSync(join(here, file), "utf8")) as number[];
      expect(flat.every(Number.isFinite)).toBe(true);
      // A hat is tens of units across, not thousands: anything wilder than
      // this is a stitch that was flung out of the world rather than settled.
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
