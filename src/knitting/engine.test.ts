import { describe, expect, it } from "vitest";
import { buildHat, rowConsumes } from "./engine";
import { hats, hatById } from "../data/hats";
import { consumes } from "../data/hats/types";

/**
 * These are the tests that matter.
 *
 * A chart read out of a PDF is a guess until the arithmetic agrees with the
 * printed page. Every one of these patterns states its stitch counts out
 * loud - "162 sts", "144 sts", "12 sts" - so a chart that was misread by even
 * one cell fails here rather than reaching someone with needles in their hands.
 */

describe("every hat's charts are internally consistent", () => {
  hats.forEach((hat) => {
    hat.charts.forEach((chart) => {
      it(`${hat.id} chart ${chart.id} chains row to row`, () => {
        chart.rows.forEach((row, index) => {
          if (index === 0) return;
          expect(
            rowConsumes(row),
            `row ${index + 1} is worked over the wrong number of stitches`,
          ).toBe(chart.rows[index - 1].length);
        });
      });

      it(`${hat.id} chart ${chart.id} only uses yarns the hat has`, () => {
        chart.rows.forEach((row) =>
          row.forEach((cell) => expect(hat.slots).toContain(cell.slot)),
        );
      });
    });
  });
});

describe("every hat knits", () => {
  hats.forEach((hat) => {
    it(`${hat.id} builds without contradiction`, () => {
      const { stitches, rounds } = buildHat(hat);
      expect(stitches.length).toBeGreaterThan(0);
      expect(rounds.length).toBeGreaterThan(10);
      // Every round is worked over the one below it.
      rounds.forEach((round) => expect(round.length).toBeGreaterThan(0));
    });

    it(`${hat.id} has a colour for every slot in every colourway`, () => {
      hat.colourways.forEach((colourway) => {
        hat.slots.forEach((slot) => {
          expect(
            colourway.shades.find((shade) => shade.slot === slot),
            `${colourway.id} has no shade for yarn ${slot}`,
          ).toBeDefined();
        });
      });
    });
  });
});

describe("the counts the patterns print", () => {
  it("Islesburgh Toorie: 144 sts, 160 after the increase, 144 again, 12 at the crown", () => {
    const hat = hatById("sww24-islesburgh-toorie")!;
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    expect(sizes[0]).toBe(144);
    // Nine rows of chart A, then a plain round, all still 144.
    expect(sizes.slice(0, 11).every((n) => n === 144)).toBe(true);
    // "Inc round: K4, [m1, k9] to last 5 sts, m1, k5. 160 sts"
    expect(sizes[11]).toBe(160);
    // Charts B, C and D are all worked over 160.
    expect(sizes.slice(11, 11 + 1 + 11 + 15 + 12).every((n) => n === 160)).toBe(true);
    // "Dec round: ... 144 sts", then chart E takes it to 12.
    expect(sizes[11 + 1 + 11 + 15 + 12]).toBe(144);
    expect(sizes[sizes.length - 1]).toBe(12);
  });

  it("Aal Ower Toorie: 130 sts, 162 after the increase, 9 at the crown", () => {
    const hat = hatById("sww25-aal-ower-toorie")!;
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    expect(sizes[0]).toBe(130);
    // Ten rounds of twisted rib.
    expect(sizes.slice(0, 11).every((n) => n === 130)).toBe(true);
    // "Increase round: ... 162 sts"
    expect(sizes[11]).toBe(162);
    // Rounds 1-45 of the body, then the crown.
    expect(sizes.slice(11, 11 + 45 + 1).every((n) => n === 162)).toBe(true);
    expect(sizes[sizes.length - 1]).toBe(9);
    // 45 body rounds plus 16 crown rounds, as rows 1-45 and 46-61.
    expect(sizes.length).toBe(1 + 10 + 1 + 45 + 16);
  });

  it("a chart repeat multiplied out matches the round it is worked over", () => {
    const hat = hatById("sww25-aal-ower-toorie")!;
    const crown = hat.charts.find((chart) => chart.id === "B")!;
    // 18 stitches per repeat, nine repeats, ending in one stitch each.
    expect(crown.rows[0].reduce((t, c) => t + consumes(c), 0)).toBe(18);
    expect(crown.rows[crown.rows.length - 1].length).toBe(1);
  });
});

describe("the invariants the rest of the site leans on", () => {
  hats.forEach((hat) => {
    it(`${hat.id}: a stitch's id is its place in the list`, () => {
      // currentRun looks a stitch up by indexing rather than by building a map
      // of ten thousand entries, which it can only do while this holds.
      const { stitches } = buildHat(hat);
      stitches.forEach((stitch, index) => expect(stitch.id).toBe(index));
    });

    it(`${hat.id}: worked stitch ids ascend, so they can be binary searched`, () => {
      const { rounds } = buildHat(hat);
      const flat = rounds.flat();
      flat.forEach((id, index) => {
        if (index > 0) expect(id).toBeGreaterThan(flat[index - 1]);
      });
    });
  });
});
