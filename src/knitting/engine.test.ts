import { describe, expect, it } from "vitest";
import { buildHat, rowConsumes } from "./engine";
import { hats, hatById } from "../data/hats";
import { consumes } from "../data/hats/types";
import { paletteOf } from "./palette";
import { adjacentStitchDistance } from "../constants";

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
        // A cell names a yarn, or names the part it plays and leaves the yarn
        // to the colourway. Either way it may not ask for wool the hat has
        // not got.
        const sets = new Set(
          hat.colourways.map((colourway) => colourway.part ?? ""),
        );
        chart.rows.forEach((row) =>
          row.forEach((cell) => {
            if (cell.slot === "ground" || cell.slot === "motif") {
              expect(chart.parts, `chart ${chart.id} is drawn in parts`)
                .toBeDefined();
            } else {
              expect(hat.slots).toContain(cell.slot);
            }
          }),
        );
        if (!chart.parts) return;
        // And a chart drawn in parts has to say who plays them, on every row
        // and for every colourway that asks.
        sets.forEach((set) => {
          const table = chart.parts?.[set];
          expect(table, `chart ${chart.id} has no parts for colourway set ${set}`)
            .toBeDefined();
          expect(table).toHaveLength(chart.rows.length);
          table?.forEach(([ground, motif]) => {
            expect(hat.slots).toContain(ground);
            expect(hat.slots).toContain(motif);
          });
        });
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

    it(`${hat.id} has a colour for every yarn each colourway is asked for`, () => {
      // Not every slot: a hat drawn in parts can be offered in colourways
      // that use fewer yarns than the pattern names, and 2026's third and
      // fourth do - four yarns where the first two use six. So what a
      // colourway has to cover is what it is actually asked for.
      const { stitches } = buildHat(hat);
      const asked = new Set(stitches.map((stitch) => stitch.slot));
      hat.colourways.forEach((colourway) => {
        const palette = paletteOf(colourway, {}, hat.charts);
        asked.forEach((slot) => {
          expect(
            palette[slot],
            `${colourway.id} has no wool for ${slot}`,
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

  it("Birsie Beanny: 128 sts, 160 for the lettering, 128, 192, 12 at the crown", () => {
    const hat = hatById("sww26-birsie-beanny")!;
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    expect(sizes[0]).toBe(128);
    // Cast-on, three rounds of twisted rib and a plain round, still 128.
    expect(sizes.slice(0, 5).every((n) => n === 128)).toBe(true);
    // "Inc Round: K2, m1, [k4, m1] x 31, k2. 160 sts."
    expect(sizes[5]).toBe(160);
    // A plain round and the eighteen rows of lettering, all over 160.
    expect(sizes.slice(5, 5 + 2 + 18).every((n) => n === 160)).toBe(true);
    // "Dec round: [K3, k2tog] x 32. 128 sts." - and the inside rib after it.
    expect(sizes[25]).toBe(128);
    // "Inc round: K1, m1, [K2, m1] x 63, k1. 192 sts."
    expect(sizes[52]).toBe(192);
    expect(sizes.slice(52, 52 + 41).every((n) => n === 192)).toBe(true);
    // "work rows 1-29 of Crown Chart... 12 sts."
    expect(sizes[sizes.length - 1]).toBe(12);
    expect(sizes.length).toBe(1 + 3 + 1 + 1 + 1 + 18 + 1 + 1 + 24 + 1 + 1 + 40 + 29);
  });

  it("Birsie Beanny: its brim turns twice, and hangs from both", () => {
    const hat = hatById("sww26-birsie-beanny")!;
    const { stitches, rounds } = buildHat(hat);
    const heights = rounds.map((round) => stitches[round[0]].position.y);

    // The fabric goes up the outer brim, back down the inside rib, and up
    // again from the foot of it. So its height has one peak and one trough.
    const peak = heights.indexOf(Math.max(...heights.slice(0, 40)));
    expect(peak).toBeGreaterThan(20);
    expect(heights[peak + 1]).toBeLessThan(heights[peak]);
    const trough = heights.indexOf(Math.min(...heights.slice(30, 60)));
    expect(trough).toBeGreaterThan(peak);
    expect(heights[trough + 1]).toBeGreaterThan(heights[trough]);
    expect(heights[heights.length - 1]).toBe(Math.max(...heights));

    // And it is held at the two rounds where the fabric turns back upwards:
    // the cast-on, and the round the body sets off from.
    const held = rounds
      .map((round, index) => [index, round.every((id) => stitches[id].fixed)] as const)
      .filter(([, all]) => all)
      .map(([index]) => index);
    expect(held).toEqual([0, trough]);
    // The inside rib reaches the depth of the brim, as the pattern asks.
    expect(heights[trough]).toBeLessThan(heights[1]);
  });

  it("Birsie Beanny: one grid of parts, two castings of it", () => {
    const hat = hatById("sww26-birsie-beanny")!;
    const body = hat.charts.find((chart) => chart.id === "Body")!;
    // Every cell of the colourwork charts is a part, not a yarn.
    expect(
      body.rows.flat().every((cell) => cell.slot === "ground" || cell.slot === "motif"),
    ).toBe(true);
    // The two sets name different yarns on the same row, which is the whole
    // reason the pattern prints each chart twice.
    expect(body.parts?.["1-2"][0]).toEqual(["D", "D"]);
    expect(body.parts?.["3-4"][0]).toEqual(["A", "A"]);
    // Colourways 3 and 4 are knitted in four yarns, never E or F.
    const four = body.parts?.["3-4"].flat() ?? [];
    expect(four.some((slot) => slot === "E" || slot === "F")).toBe(false);
    // The crown takes thirty-two stitches to two on fifteen centred
    // decreases, one on every odd row.
    const crown = hat.charts.find((chart) => chart.id === "Crown")!;
    const marks = crown.rows.flat().filter((cell) => cell.symbol === "s2kp");
    expect(marks).toHaveLength(15);
    expect(crown.rows[crown.rows.length - 1]).toHaveLength(2);
    // And the brim is one round of 160, not a repeat: it spells something.
    const brim = hat.charts.find((chart) => chart.id === "Brim")!;
    expect(brim.rows.every((row) => row.length === 160)).toBe(true);
    expect(brim.rows[1].every((cell) => cell.symbol === "purl")).toBe(true);
  });

  it("Merrie Dancers Toorie: 120 sts, 144 after the rib, 120, 10 at the crown", () => {
    const hat = hatById("sww18-merrie-dancers-toorie")!;
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    // "Using MC, cast on [108: 120] sts" - this is the 120, yarn weight 2.
    expect(sizes[0]).toBe(120);
    // A plain rib round, then all twelve rows of chart A, still 120.
    expect(sizes.slice(0, 14).every((n) => n === 120)).toBe(true);
    // "K2, kfb, (k3, kfb) 3 times, *k7, kfb, (k3, kfb) 3 times; rep from *
    //  to last 5 sts, k5. 144 sts"
    expect(sizes[14]).toBe(144);
    // A plain round and chart B's thirty-four rows, all over 144.
    expect(sizes.slice(14, 14 + 2 + 34).every((n) => n === 144)).toBe(true);
    // "*K4, k2tog; rep from * to end. 120 sts"
    expect(sizes[50]).toBe(120);
    // "Break both threads and pass both through the remaining 10 sts."
    expect(sizes[sizes.length - 1]).toBe(10);
    expect(sizes.length).toBe(1 + 1 + 12 + 1 + 1 + 34 + 1 + 1 + 21);
  });

  it("Merrie Dancers Toorie: its charts name a yarn in every cell", () => {
    const hat = hatById("sww18-merrie-dancers-toorie")!;
    const at = (id: string) => hat.charts.find((chart) => chart.id === id)!;
    // Chart A is the two-coloured rib: two stitches of a yarn, two purled in
    // the main colour, on every one of its twelve rows.
    expect(at("A").rows).toHaveLength(12);
    at("A").rows.forEach((row) => {
      expect(row).toHaveLength(4);
      expect(row.filter((cell) => cell.symbol === "purl")).toHaveLength(2);
      expect(row.filter((cell) => cell.slot === "A")).toHaveLength(2);
    });
    // Chart B is colourwork only - no decreases anywhere in it.
    expect(at("B").rows.flat().some((cell) => cell.symbol)).toBe(false);
    // Chart C takes twenty-four stitches to two on eleven centred decreases,
    // which is the staircase the page draws as one filled outline.
    const crown = at("C");
    expect(crown.rows[0]).toHaveLength(24);
    expect(crown.rows[crown.rows.length - 1]).toHaveLength(2);
    expect(
      crown.rows.flat().filter((cell) => cell.symbol === "s2kp"),
    ).toHaveLength(11);
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

  it("Baa-ble Hat: it hangs from the fold in its brim, not from the cast-on", () => {
    const hat = hatById("sww15-baa-ble-hat")!;
    const { stitches, rounds } = buildHat(hat);

    // Cast-on, twelve rounds of rib, then the fold: round 12 is the brim.
    const fold = 12;
    expect(rounds[fold].every((id) => stitches[id].fixed)).toBe(true);
    expect(rounds.flat().filter((id) => stitches[id].fixed)).toHaveLength(
      rounds[fold].length,
    );
    // The fold is the lowest thing there is, and everything is above it.
    expect(stitches[rounds[fold][0]].position.y).toBe(0);
    const heights = stitches.filter((s) => s.id > 0).map((s) => s.position.y);
    expect(Math.min(...heights)).toBe(0);
    // The cast-on has been folded back up the outside, a round below the top
    // of the rib rather than a rib below the bottom of it.
    const topOf = (round: number) =>
      Math.max(...rounds[round].map((id) => stitches[id].position.y));
    expect(topOf(0)).toBeGreaterThan(topOf(11));
    expect(topOf(0)).toBeLessThan(topOf(25));
  });

  it("Baa-ble Hat: folding it keeps every joint the length it was built", () => {
    // A reflection is an isometry, and the plane it is done in is the plane
    // the fold ring sits in, so a joint that crosses the fold spans exactly
    // what it spanned before. Nothing is stretched to make the brim turn up,
    // which is why the fold's joints measure the same as any other round of
    // the same rib, to the last decimal place.
    const hat = hatById("sww15-baa-ble-hat")!;
    const { stitches, rounds } = buildHat(hat);
    const spans = (round: number) =>
      rounds[round]
        .flatMap((id) =>
          stitches[id].links.map((link) => {
            const other = stitches[link];
            return Math.hypot(
              stitches[id].position.x - other.position.x,
              stitches[id].position.y - other.position.y,
              stitches[id].position.z - other.position.z,
            );
          }),
        )
        .sort((a, b) => a - b);

    const fold = spans(12);
    const ordinary = spans(20);
    expect(fold).toHaveLength(ordinary.length);
    fold.forEach((length, i) => expect(length).toBeCloseTo(ordinary[i], 10));
  });

  it("Baa-ble Hat: turned up, it is the height the pattern says it is", () => {
    // "48 cm around rib, 21cm from turned up edge to crown." The rib's own
    // circumference is the scale: 96 stitches of it are 48cm, so a stitch is
    // half a centimetre and the hat should stand about 84 units tall. Knitted
    // flat it stands 112, which is a whole turned-up rib too many.
    const hat = hatById("sww15-baa-ble-hat")!;
    const { stitches, rounds } = buildHat(hat);
    const size = hat.sizes[0];
    const heights = stitches.filter((s) => s.id > 0).map((s) => s.position.y);
    const perCm =
      (rounds[0].length * adjacentStitchDistance) / size.circumferenceCm;
    const cm = (Math.max(...heights) - Math.min(...heights)) / perCm;
    expect(cm).toBeGreaterThan(size.lengthCm * 0.9);
    expect(cm).toBeLessThan(size.lengthCm * 1.15);
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
