import { describe, expect, it } from "vitest";
import { hatById } from "../data/hats";
import { consumes } from "../data/hats/types";
import { buildHat } from "./engine";

const hat = hatById("sww17-bousta-beanie")!;

describe("Bousta Beanie reconciles with the 2017 leaflet", () => {
  it("follows every printed stitch count from 120 to the final 12", () => {
    const { rounds } = buildHat(hat);
    const sizes = rounds.map((round) => round.length);

    // Cast-on, round 1, and rounds 2-13 are all 120 stitches.
    expect(sizes.slice(0, 14)).toEqual(Array(14).fill(120));
    // Round 14 increases to 144; the 49 body rounds stay there.
    expect(sizes.slice(14, 64)).toEqual(Array(50).fill(144));
    // Chart B then the five written finishing rounds.
    expect(sizes.slice(64)).toEqual([
      132, 132, 120, 120, 108, 108, 96, 96, 72, 72,
      48, 48, 24, 24, 12,
    ]);
    expect(sizes).toHaveLength(79);
  });

  it("preserves the two printed charts cell for cell", () => {
    const chart = (id: string) => hat.charts.find((c) => c.id === id)!;
    expect(chart("A").rows.map((row) => row.map((cell) => cell.slot).join("")))
      .toEqual([
        "BAAA", "ABAA", "ABBA", "ABBB", "ABBA", "ABAA", "BAAA",
        "AAAC", "AACA", "ACCA", "CCCA", "ACCA", "AACA", "AAAC",
      ]);

    const crown = chart("B").rows;
    expect(crown.map((row) => row.map((cell) => cell.slot).join(""))).toEqual([
      "AAACAACAAAC",
      "AACAACAAACA",
      "ACCAAAACCA",
      "CCCAAACCCA",
      "ACCAAACCA",
      "AACAAAACA",
      "AAACAAAC",
      "BAAABAAA",
      "ABAABA",
      "ABBABB",
    ]);
    expect(crown.map((row) => row.length)).toEqual(
      [11, 11, 10, 10, 9, 9, 8, 8, 6, 6],
    );
    expect(
      crown.map((row) =>
        row.flatMap((cell, index) => cell.symbol === "k2tog" ? [index + 1] : []),
      ),
    ).toEqual([[7], [], [6], [], [5], [], [4], [], [3, 6], []]);
    expect(
      crown.flat().filter((cell) => cell.symbol === "k2tog").map((cell) => cell.slot),
    ).toEqual(["C", "A", "A", "C", "A", "A"]);
  });

  it("chains the crown by consumption, including both decreases on row 9", () => {
    const crown = hat.charts.find((c) => c.id === "B")!;
    let before = 12;
    crown.rows.forEach((row) => {
      expect(row.reduce((total, cell) => total + consumes(cell), 0)).toBe(before);
      before = row.length;
    });
    expect(before).toBe(6);
  });

  it("works the 24 brim increases into the rib rather than flattening the round", () => {
    const { stitches, rounds } = buildHat(hat);
    const increase = rounds[14].map((id) => stitches[id]);
    expect(increase).toHaveLength(144);
    expect(increase.filter((stitch) => stitch.type === "m1")).toHaveLength(24);
    expect(increase.filter((stitch) => stitch.type === "p1")).toHaveLength(60);
    expect(increase.filter((stitch) => stitch.type === "k1")).toHaveLength(60);
  });

  it("moves the round marker one stitch before the 72-to-48 decrease", () => {
    const { stitches, rounds, roundLabels } = buildHat(hat);
    const chartEnd = roundLabels.lastIndexOf("Chart B, row 10");
    const previous = rounds[chartEnd];
    const shifted = rounds[chartEnd + 1];

    expect(previous).toHaveLength(72);
    expect(shifted).toHaveLength(48);
    expect(stitches[shifted[0]].type).toBe("k1");
    expect(stitches[shifted[0]].links[0]).toBe(previous[1]);
    expect(stitches[shifted.at(-1)!].type).toBe("k2tog");
    expect(stitches[shifted.at(-1)!].links.slice(0, 2)).toEqual([
      previous[71],
      previous[0],
    ]);
  });

  it("keeps the published size and all three sample colourways", () => {
    expect(hat.sizes).toEqual([
      expect.objectContaining({
        label: "Average adult",
        circumferenceCm: 46.5,
        lengthCm: 25,
        stitchesPer10cm: 31,
        roundsPer10cm: 31,
        needlesMm: 3.5,
        ribNeedlesMm: 3,
      }),
    ]);
    expect(hat.sizes[0].toFitCm).toBeUndefined();
    expect(hat.colourways.map((colourway) => colourway.brand)).toEqual([
      "Jamieson & Smith",
      "Jamieson's of Shetland",
      "Uradale Yarns",
    ]);
    expect(hat.colourways.map((colourway) => colourway.ballGrams)).toEqual(
      [25, 25, 50],
    );
    expect(hat.colourways.map((colourway) => colourway.balls)).toEqual([
      { A: 2, B: 1, C: 1 },
      { A: 2, B: 1, C: 1 },
      { A: 1, B: 1, C: 1 },
    ]);

    const uradale = hat.colourways[2];
    expect(uradale.shades.map((shade) => shade.wool)).toEqual([
      "uradale-yarns-2ply-jumper-weight-aetmeal-light-fawn",
      "uradale-yarns-2ply-jumper-weight-beremeal-mid-fawn",
      "uradale-yarns-2ply-jumper-weight-moorit-shetland-brown",
    ]);
  });
});
