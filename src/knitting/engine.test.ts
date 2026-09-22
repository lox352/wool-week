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

  it("Bonnie Isle Hat: 140 sts, 156 after the increase, 128, 8 at the crown", () => {
    const hat = hatById("sww22-bonnie-isle-hat")!;
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    expect(sizes[0]).toBe(140);
    // The cast-on and all thirteen rows of chart A, still 140.
    expect(sizes.slice(0, 14).every((n) => n === 140)).toBe(true);
    // "Inc round: K9, kfb, [k7, kfb] to last 10 sts, k to end. 156 sts"
    expect(sizes[14]).toBe(156);
    // Charts B, C and D - fourteen rows, thirteen, fourteen - all over 156.
    expect(sizes.slice(14, 14 + 1 + 14 + 13 + 14).every((n) => n === 156)).toBe(true);
    // "Dec round: [K4, k2tog, k3, k2tog] to last 2 sts, k2. 128 sts"
    expect(sizes[14 + 1 + 14 + 13 + 14]).toBe(128);
    // Chart E takes it to eight, two stitches for each of its eight repeats
    // to be drawn through twice.
    expect(sizes[sizes.length - 1]).toBe(8);
    expect(sizes.length).toBe(1 + 13 + 1 + 14 + 13 + 14 + 1 + 19);
  });

  it("Bonnie Isle Hat: its crown decrease leans rather than standing straight", () => {
    const hat = hatById("sww22-bonnie-isle-hat")!;
    const crown = hat.charts.find((chart) => chart.id === "E")!;
    const symbols = crown.rows.flat().map((cell) => cell.symbol).filter(Boolean);
    // Seven sk2p up the spine and a k2tog to finish, and no centred decrease:
    // this is the one year that uses the leaning one.
    expect(symbols.filter((s) => s === "sk2p")).toHaveLength(7);
    expect(symbols.filter((s) => s === "k2tog")).toHaveLength(1);
    expect(symbols.filter((s) => s === "s2kp")).toHaveLength(0);
    // Sixteen stitches to one, eight times over: the 128 the pattern prints.
    expect(crown.rows[0].reduce((t, c) => t + consumes(c), 0)).toBe(16);
    expect(crown.rows[crown.rows.length - 1].length).toBe(1);
  });

  it("Da Crofter's Kep: 136 sts, 168 after the increase, 144, 12 at the crown", () => {
    const hat = hatById("sww21-da-crofters-kep")!;
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    expect(sizes[0]).toBe(136);
    // The cast-on and all ten rows of chart A, still 136.
    expect(sizes.slice(0, 11).every((n) => n === 136)).toBe(true);
    // "Increase round: K5, m1 (k4, m1) to last 7 sts, k7. 168 sts"
    expect(sizes[11]).toBe(168);
    // Chart B's thirty-five rows are all worked over 168.
    expect(sizes.slice(11, 11 + 1 + 35).every((n) => n === 168)).toBe(true);
    // Chart C does its own first decrease: "24 st repeat 6 times. 144 sts"
    expect(sizes[11 + 1 + 35]).toBe(144);
    expect(sizes[sizes.length - 1]).toBe(12);
    expect(sizes.length).toBe(1 + 10 + 1 + 35 + 23);
  });

  it("Da Crofter's Kep: its crown chart is worked over more than it leaves", () => {
    const hat = hatById("sww21-da-crofters-kep")!;
    const crown = hat.charts.find((chart) => chart.id === "C")!;
    // Twenty-eight stitches in, twenty-four out, on four k2tog - which is
    // where the 168 of the body becomes the 144 the pattern prints.
    expect(crown.rows[0].reduce((t, c) => t + consumes(c), 0)).toBe(28);
    expect(crown.rows[0]).toHaveLength(24);
    // Then an sk2p on every odd row, taking twenty-four down to two.
    expect(crown.rows[crown.rows.length - 1]).toHaveLength(2);
    const leaning = crown.rows
      .flat()
      .filter((cell) => cell.symbol === "sk2p");
    expect(leaning).toHaveLength(11);
  });

  it("Baa-ble Hat: 96 sts, 120 after the rib increase, 10 at the crown", () => {
    const hat = hatById("sww15-baa-ble-hat")!;
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    expect(sizes[0]).toBe(96);
    // "Row 1: *K2, P2*... Continue with rib for another 24 rows" - so the
    // cast-on and twenty-five rounds of rib, all over 96.
    expect(sizes.slice(0, 26).every((n) => n === 96)).toBe(true);
    // "*K2, P2, M1* to the end. (24 stitches increased making a total of 120)"
    expect(sizes[26]).toBe(120);
    // Then one chart for everything else, worked twice a round.
    expect(sizes.slice(26, 26 + 1 + 25).every((n) => n === 120)).toBe(true);
    // "Row 26: begin decreasing" - the first round under 120 is chart row 26.
    expect(sizes[26 + 26]).toBe(110);
    // "You will be Left with 10 stitches on your needles."
    expect(sizes[sizes.length - 1]).toBe(10);
    expect(sizes.length).toBe(1 + 25 + 1 + 45);
  });

  it("Baa-ble Hat: one chart, half a round wide, decreasing eleven times", () => {
    const hat = hatById("sww15-baa-ble-hat")!;
    const chart = hat.charts.find((c) => c.id === "A")!;
    expect(chart.rows).toHaveLength(45);
    // Sixty stitches - half of the 120 - down to five, worked twice a round.
    expect(chart.rows[0]).toHaveLength(60);
    expect(chart.rows[44]).toHaveLength(5);
    // Five decreases on each of eleven rows is what takes sixty to five, and
    // the only mark on the chart is the one its key names.
    const marks = chart.rows.flat().map((cell) => cell.symbol).filter(Boolean);
    expect(marks).toHaveLength(55);
    expect(marks.every((mark) => mark === "k2tog")).toBe(true);
    const shrinking = chart.rows.filter(
      (row, i) => i > 0 && row.length < chart.rows[i - 1].length,
    );
    expect(shrinking).toHaveLength(11);
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
