import { describe, expect, it } from "vitest";
import { hatById } from "../data/hats";
import { buildHat } from "./engine";

const hat = hatById("sww19-roadside-beanie")!;

describe("Roadside Beanie reconciles with the 2019 leaflet", () => {
  it("casts on 132, increases to 168, decreases to 140 and closes on 7", () => {
    const { rounds, roundLabels } = buildHat(hat);
    const counts = rounds.map((round) => round.length);
    expect(counts).toHaveLength(75);
    expect(counts.slice(0, 15)).toEqual(Array(15).fill(132));
    expect(counts.slice(15, 54)).toEqual(Array(39).fill(168));
    expect(counts[54]).toBe(140);
    expect(counts.slice(55)).toEqual(
      Array.from({ length: 20 }, (_, i) => (20 - i) * 7),
    );
    expect(roundLabels[55]).toBe("Chart F, row 1");
    expect(roundLabels[74]).toBe("Chart F, row 20");
  });

  it("preserves the corrugated rib, sheep and boats, and decrease placement", () => {
    const chart = (id: string) => hat.charts.find((c) => c.id === id)!;
    // Read right to left: two knit stitches then two purls in the ground.
    chart("A").rows.forEach((row) => {
      expect(row.map((c) => c.symbol)).toEqual([undefined, undefined, "purl", "purl"]);
      expect(row.slice(2).map((c) => c.slot)).toEqual(["A", "A"]);
    });
    expect(chart("C").rows).toHaveLength(16);
    expect(chart("C").rows[0].map((c) => c.slot)).toEqual(Array(28).fill("C"));
    expect(chart("C").rows[15].map((c) => c.slot)).toEqual(Array(28).fill("G"));
    expect(chart("E").rows).toHaveLength(12);
    // The boat's tiny pennant is the only yarn E cell in its chart.
    expect(chart("E").rows.flat().filter((c) => c.slot === "E")).toHaveLength(1);
    const crown = chart("F").rows;
    expect(crown[0].some((c) => c.symbol)).toBe(false);
    crown.slice(1).forEach((row) => {
      expect(row.at(-1)?.symbol).toBe("k2tog");
      expect(row.slice(0, -1).some((c) => c.symbol)).toBe(false);
    });
  });

  it("offers the four printed colourways and their original ball sizes", () => {
    expect(hat.colourways.map((c) => c.brand)).toEqual([
      "Jamieson & Smith", "Foula Wool", "Jamieson's of Shetland", "Uradale Yarns",
    ]);
    expect(hat.colourways.map((c) => c.ballGrams)).toEqual([25, 25, 25, 50]);
    hat.colourways.forEach((c) => {
      expect(c.shades.map((s) => s.slot)).toEqual(hat.slots);
      expect(Object.values(c.balls)).toEqual(Array(7).fill(1));
    });
    expect(hat.sizes[0].toFitCm).toBeUndefined();
    expect(hat.sizes[0].circumferenceCm).toBe(58.5);
    expect(hat.sizes[0].stitchesPer10cm).toBe(32);
  });
});
