import { describe, expect, it } from "vitest";
import { layOut } from "./layout";
import { buildHat } from "./engine";
import { hatById } from "../data/hats";

describe("the chart lines rounds up with the rounds below them", () => {
  it("a plain round sits squarely on the one below it", () => {
    const hat = hatById("sww25-aal-ower-toorie")!;
    const { stitches, rounds } = buildHat(hat);
    const { cells } = layOut(stitches, rounds);

    // Two body rounds, worked over the same stitch count with no shaping.
    const [below, above] = [rounds[20], rounds[21]];
    below.forEach((id, index) => {
      expect(cells.get(above[index])!.column).toBe(cells.get(id)!.column);
    });
  });

  it("a decrease leaves a gap where the stitches went", () => {
    const hat = hatById("sww25-aal-ower-toorie")!;
    const { stitches, rounds } = buildHat(hat);
    const { cells, columns } = layOut(stitches, rounds);

    const crown = rounds[rounds.length - 1];
    const body = rounds[11];
    // The crown is nine stitches spread across the width of the whole hat,
    // not nine stitches bunched at one edge.
    expect(crown.length).toBe(9);
    expect(cells.get(crown[crown.length - 1])!.column).toBeGreaterThan(
      columns / 2,
    );
    expect(columns).toBe(body.length);
  });

  it("an increase pushes the rest of its round along", () => {
    const hat = hatById("sww24-islesburgh-toorie")!;
    const { stitches, rounds } = buildHat(hat);
    const { cells, columns } = layOut(stitches, rounds);

    // The brim is 144 stitches; the increase round takes it to 160, and that
    // is how wide the chart has to be.
    expect(rounds[0].length).toBe(144);
    expect(rounds[11].length).toBe(160);
    expect(columns).toBe(160);
    expect(cells.get(rounds[0][0])!.column).toBe(1);
  });
});
