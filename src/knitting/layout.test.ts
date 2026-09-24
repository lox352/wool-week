import { describe, expect, it } from "vitest";
import { layOut } from "./layout";
import { buildHat } from "./engine";
import { hatById } from "../data/hats";
import { consumption } from "../types/StitchType";

const laid = (id: string) => {
  const hat = hatById(id)!;
  const { stitches, rounds } = buildHat(hat);
  const layout = layOut(stitches, rounds);
  return { stitches, rounds, cells: layout.cells, columns: layout.columns };
};

describe("the chart hangs every stitch over what it was worked into", () => {
  it("a plain knit keeps its column exactly, so colourwork stacks up", () => {
    const { stitches, rounds, cells } = laid("sww25-aal-ower-toorie");
    const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));

    // Two body rounds, worked over the same stitch count with no shaping.
    const [below, above] = [rounds[20], rounds[21]];
    expect(below.length).toBe(above.length);
    above.forEach((id) => {
      expect(byId.get(id)!.type).toBe("k1");
      const parent = byId.get(id)!.links[0];
      expect(cells.get(id)!.column).toBe(cells.get(parent)!.column);
    });
  });

  it("Birsie Beanny: its crown decreases run straight up their own columns", () => {
    /*
     * "At the end of round 40, work until 1 st remains and place it,
     * unworked, onto the start of the next round to be included in the
     * centred double decrease (s2kp)."
     *
     * A centred double decrease worked as a round's first stitch has no
     * stitch to its right in that round - it takes the last of the round
     * below - and a model that gave it the first three instead put it over
     * the second stitch rather than the first, every decrease round moving
     * another stitch on. Sixteen rounds of that is a crown that winds shut
     * instead of closing in. So: six decreases, six columns, thirty-two
     * apart, and not one of them moves from row 1 to row 29.
     */
    const { stitches, rounds, cells, columns } = laid("sww26-birsie-beanny");
    const spines = rounds
      .map((round) =>
        round
          .map((id) => stitches[id])
          .filter((stitch) => stitch.type === "s2kp")
          .map((stitch) => cells.get(stitch.id)!.column),
      )
      .filter((row) => row.length > 0);

    expect(spines).toHaveLength(15);
    const first = spines[0];
    expect(first).toHaveLength(6);
    first.forEach((at, i) => expect(at).toBe(1 + (i * columns) / 6));
    spines.forEach((row) => expect(row).toEqual(first));
  });

  it("a decrease stands on the stitch it leans onto, or the middle if it does not lean", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie", "sww22-bonnie-isle-hat"]) {
      const { stitches, cells, columns: width } = laid(hat);
      const decreases = stitches.filter(
        (stitch) => consumption[stitch.type] > 1,
      );
      expect(decreases.length).toBeGreaterThan(0);

      for (const stitch of decreases) {
        const columns = stitch.links
          .slice(0, consumption[stitch.type])
          .map((id) => cells.get(id)!.column)
          .sort((a, b) => a - b);
        // A family round the chart's seam is checked by the Birsie test.
        if (columns[columns.length - 1] - columns[0] > width / 2) continue;
        const half = Math.floor(columns.length / 2);
        const expected =
          stitch.type === "k2tog"
            ? columns[0]
            : stitch.type === "k2togtbl" || stitch.type === "sk2p"
              ? columns[columns.length - 1]
              : columns.length % 2 === 1
                ? columns[half]
                : (columns[half - 1] + columns[half]) / 2;
        expect(cells.get(stitch.id)!.column).toBe(expected);
      }
    }
  });

  it("a k2tog leans right: it stands on the right of its two, with a gap to its left", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { stitches, cells } = laid(hat);
      const taken = stitches.filter((stitch) => stitch.type === "k2tog");
      expect(taken.length).toBeGreaterThan(0);
      for (const stitch of taken) {
        const [right, left] = stitch.links
          .slice(0, 2)
          .map((id) => cells.get(id)!.column);
        // Column 1 is the chart's right-hand edge.
        expect(right).toBeLessThan(left);
        expect(cells.get(stitch.id)!.column).toBe(right);
      }
    }
  });

  it("a centred double decrease keeps the middle stitch of its three", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { stitches, cells } = laid(hat);
      const centred = stitches.filter((stitch) => stitch.type === "s2kp");
      expect(centred.length).toBeGreaterThan(0);
      for (const stitch of centred) {
        expect(cells.get(stitch.id)!.column).toBe(
          cells.get(stitch.links[1])!.column,
        );
      }
    }
  });

  it("a decrease line runs straight up the chart rather than wandering", () => {
    // The crown closes on nine decrease lines on one hat and six on the
    // other. Each is one column of the chart from the body to the very top:
    // taking the middle of three stitches literally, rather than settling on
    // the middle one, moved each decrease a fraction of a column per round
    // and the line came out visibly wobbly.
    for (const [hat, lines] of [
      ["sww25-aal-ower-toorie", 9],
      ["sww24-islesburgh-toorie", 6],
    ] as const) {
      const { stitches, cells } = laid(hat);
      const columns = new Set(
        stitches
          .filter((stitch) => stitch.type === "s2kp")
          .map((stitch) => cells.get(stitch.id)!.column),
      );
      expect(columns.size).toBe(lines);
    }
  });

  it("keeps every stitch on the chart's columns or half way between two", () => {
    // Nothing ever lands on an arbitrary fraction of a column: a stitch
    // either inherits a column outright or splits the difference between two
    // of them. That is what lets a stack run straight and gives the heavy
    // every-fifth-column rules an edge to be drawn on.
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { cells } = laid(hat);
      for (const cell of cells.values()) expect(cell.column % 0.5).toBe(0);
    }
  });

  it("a make-one sits over the gap between two stitches it was picked up from", () => {
    const { stitches, rounds, cells } = laid("sww25-aal-ower-toorie");
    const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));

    // The round that takes the 130 stitch rib to a 162 stitch body, on 32
    // make-ones. Each is picked up from the strand between two stitches, so
    // the stitches either side stand straight over their own, and there is
    // nothing at all under the make-one.
    const grownAt = rounds.findIndex((round) =>
      round.some((id) => byId.get(id)!.type === "m1"),
    );
    const grown = rounds[grownAt];
    const below = new Set(rounds[grownAt - 1].map((id) => cells.get(id)!.column));
    const made = grown.filter((id) => byId.get(id)!.type === "m1");
    expect(made.length).toBe(32);

    for (const id of made) {
      const beside = grown[grown.indexOf(id) - 1];
      const parent = byId.get(beside)!.links[0];
      expect(cells.get(parent)!.column).toBe(cells.get(beside)!.column);
      expect(below.has(cells.get(id)!.column)).toBe(false);
    }
  });

  it("a KFB keeps its column, and the stitch it makes sits in a gap to its left", () => {
    const { stitches, rounds, cells } = laid("sww23-buggiflooer-beanie");
    const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));
    const kfbs = stitches.filter((stitch) => stitch.type === "kfb");
    expect(kfbs.length).toBeGreaterThan(0);
    for (const kfb of kfbs) {
      const made = byId.get(kfb.id + 1)!;
      expect(made.type).toBe("m1");
      const at = cells.get(kfb.id)!;
      expect(at.column).toBe(cells.get(kfb.links[0])!.column);
      // To its left, which is up the columns from the right-hand edge; usually
      // the very next one, unless a later increase has opened a gap there.
      const madeAt = cells.get(made.id)!.column;
      expect(madeAt).toBeGreaterThan(at.column);
      const below = new Set(rounds[at.round - 2].map((id) => cells.get(id)!.column));
      expect(below.has(madeAt)).toBe(false);
    }
  });

  it("an increase leaves a gap in the rounds below rather than bunching", () => {
    const { rounds, cells } = laid("sww25-aal-ower-toorie");

    // The rib is 130 stitches under a 162 stitch body, and used to sit
    // against one edge of the chart with dead space beside it. Now it spans
    // the full width, with a column left open for each of the 32 stitches
    // about to be made.
    const rib = rounds[0];
    expect(rib.length).toBe(130);
    expect(cells.get(rib[0])!.column).toBe(1);
    expect(cells.get(rib[rib.length - 1])!.column).toBe(162);

    const gaps = rib
      .slice(1)
      .map((id, index) => cells.get(id)!.column - cells.get(rib[index])!.column)
      .filter((step) => step > 1);
    expect(gaps).toEqual(Array(32).fill(2));
  });

  it("stays inside its own width, which is its widest round", () => {
    for (const [hat, width] of [
      ["sww25-aal-ower-toorie", 162],
      ["sww24-islesburgh-toorie", 160],
    ] as const) {
      const { rounds, cells, columns } = laid(hat);
      expect(columns).toBe(Math.max(...rounds.map((round) => round.length)));
      expect(columns).toBe(width);
      const all = [...cells.values()].map((cell) => cell.column);
      expect(Math.min(...all)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...all)).toBeLessThanOrEqual(columns);
    }
  });

  it("never lets two stitches of a round overlap", () => {
    for (const hat of ["sww25-aal-ower-toorie", "sww24-islesburgh-toorie"]) {
      const { rounds, cells } = laid(hat);
      for (const round of rounds) {
        for (let index = 1; index < round.length; index++) {
          const step =
            cells.get(round[index])!.column -
            cells.get(round[index - 1])!.column;
          expect(step).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});
