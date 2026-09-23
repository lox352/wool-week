import { describe, expect, it } from "vitest";
import { hatById } from "../data/hats";
import { consumes } from "../data/hats/types";
import { buildHat, roundHeightFor } from "./engine";

const hat = hatById("sww14-shwook-hat")!;

const changedCounts = (counts: number[]) =>
  counts.filter((count, index) => index === 0 || count !== counts[index - 1]);

describe("Shwook Hat reconciles with the 2014 leaflet", () => {
  it("builds the genuinely shorter Size 1 route and every printed count", () => {
    const { stitches, rounds, roundLabels } = buildHat(hat, "size1");
    const counts = rounds.map((round) => round.length);

    expect(counts).toHaveLength(66);
    expect(changedCounts(counts)).toEqual([
      112, 140, 138, 120, 112, 98, 84, 70, 56, 42, 28, 14, 7,
    ]);
    expect(roundLabels.filter((label) => label === "Chart A, row 1")).toHaveLength(1);
    expect(roundLabels.indexOf("Chart B, row 1"))
      .toBeLessThan(roundLabels.indexOf("Chart A, row 1"));

    const increase = rounds.find((round) =>
      round.some((id) => stitches[id].type === "kfb"),
    )!;
    expect(increase.filter((id) => stitches[id].type === "kfb")).toHaveLength(28);
    expect(increase).toHaveLength(140);
  });

  it("builds Sizes 2 and 3 through A, B, A, C, D and every printed count", () => {
    for (const sizeId of ["size2", "size3"]) {
      const { stitches, rounds, roundLabels } = buildHat(hat, sizeId);
      const counts = rounds.map((round) => round.length);

      expect(counts).toHaveLength(80);
      expect(changedCounts(counts)).toEqual([
        134, 168, 144, 128, 112, 96, 80, 64, 48, 32, 16, 8,
      ]);
      expect(roundLabels.filter((label) => label === "Chart A, row 1"))
        .toHaveLength(2);
      expect(roundLabels.indexOf("Chart A, row 1"))
        .toBeLessThan(roundLabels.indexOf("Chart B, row 1"));

      const increase = rounds.find((round) =>
        round.some((id) => stitches[id].type === "kfb"),
      )!;
      expect(increase.filter((id) => stitches[id].type === "kfb")).toHaveLength(34);
      expect(increase).toHaveLength(168);
    }
  });

  it("preserves Charts A, B and C cell for cell", () => {
    const chart = (id: string) => hat.charts.find((candidate) => candidate.id === id)!;
    expect(chart("A").rows.map((row) => row.map((cell) => cell.slot).join("")))
      .toEqual(["BBBCCC","BBCBCB","BCBCBB","CCCBBB"]);
    expect(chart("B").rows.map((row) => row.map((cell) => cell.slot).join("")))
      .toEqual(["CCDCDCDCCCDCCCCCDCCCDCDCDCCC","CDCDCDCCCCDDCCCDDCCCCDCDCDCC","DCDCDCCCCCDDDCDDDCCCCCDCDCDC","EBEBEEEBBBEEEBEEEBBBEEEBEBEB","BEBEEEEEBBEEBBBEEBBEEEEEBEBE","EBEEEBEEEBEBBEBBEBEEEBEEEBEB","BAAABABAAABBAAABBAAABABAAADA","EBEEEBEEEBEBBEBBEBEEEBEEEBEB","BEBEEEEEBBEEBBBEEBBEEEEEBEBE","EBEBEEEBBBEEEBEEEBBBEEEBEBEB","DCDCDCCCCCDDDCDDDCCCCCDCDCDC","CDCDCDCCCCDDCCCDDCCCCDCDCDCC","CCDCDCDCCCDCCCCCDCCCDCDCDCCC"]);
    expect(chart("C").rows.map((row) => row.map((cell) => cell.slot).join("")))
      .toEqual(["AABABAAABAAAAABAAABABAAA","ABABAAAABBAAABBAAAABABAA","BABAAAAABBBABBBAAAAABABA","CDCCCDDDCCCDCCCDDDCCCDCD","DCCCCCDDCCDDDCCDDCCCCCDC","CCCDCCCDCDDCDDCDCCCDCCCD","EEDEDEEEDDEEEDDEEEDEDEEE","CCCDCCCDCDDCDDCDCCCDCCCD","DCCCCCDDCCDDDCCDDCCCCCDC","CDCCCDDDCCCDCCCDDDCCCDCD","BABAAAAABBBABBBAAAAABABA","ABABAAAABBAAABBAAAABABAA","AABABAAABAAAAABAAABABAAA"]);
    expect(chart("A").rows.every((row) => row.length === 6)).toBe(true);
    expect(chart("B").rows.every((row) => row.length === 28)).toBe(true);
    expect(chart("C").rows.every((row) => row.length === 24)).toBe(true);
  });

  it("preserves Chart D's staircase and seven centred double decreases", () => {
    const crown = hat.charts.find((candidate) => candidate.id === "D")!;
    expect(crown.rows.map((row) => row.map((cell) => cell.slot).join("")))
      .toEqual(["BEEEBBBEBBBEEE","EDDDEDDDDDEDDD","EEDDDEDEDDDE","DEEDDEEEDDEE","EEDDDEDDDE","EDDDEEEDDD","CDDDCDDD","CDDCCCDD","CDDCDD","CDCCCD","CDCD","AAAA","AA"]);
    expect(crown.rows.map((row) => row.length)).toEqual([
      14, 14, 12, 12, 10, 10, 8, 8, 6, 6, 4, 4, 2,
    ]);
    expect(
      crown.rows.map((row) =>
        row.flatMap((cell, index) => cell.symbol === "s2kp" ? [index + 1] : []),
      ),
    ).toEqual([[8], [], [7], [], [6], [], [5], [], [4], [], [3], [], [2]]);

    let before = 16;
    crown.rows.forEach((row) => {
      expect(row.reduce((n, cell) => n + consumes(cell), 0)).toBe(before);
      before = row.length;
    });
    expect(before).toBe(2);
  });

  it("keeps all six numbered commercial combinations exactly in the yarn library", () => {
    expect(hat.colourways.slice(0, 6).map((colourway) =>
      colourway.shades.map((shade) => shade.code).join("/"),
    )).toEqual([
      "4/202/54/1A/5",
      "118/28/9113/1A/21",
      "203/118/1A/21/28",
      "108/105/102/104/101",
      "788/289/595/304/726",
      "122/595/304/726/289",
    ]);
    hat.colourways.slice(0, 6).forEach((colourway) => {
      expect(colourway.shades.every((shade) =>
        shade.source === "library" && shade.wool !== undefined,
      )).toBe(true);
      expect(Object.values(colourway.balls)).toEqual([1, 1, 1, 1, 1]);
    });
  });

  it("keeps the organic fawn/silver alternatives explicit approximations", () => {
    const organic = hat.colourways.slice(6);
    expect(organic.map((colourway) => colourway.name))
      .toEqual(["Organic · Fawn", "Organic · Silver"]);
    organic.forEach((colourway) => {
      expect(colourway.ballGrams).toBe(50);
      expect(colourway.shades.every((shade) =>
        shade.source === "approximate" && shade.wool === undefined,
      )).toBe(true);
    });
  });

  it("keeps the published measurements and uses the detailed Size 3 needle spec", () => {
    expect(hat.sizes.map((size) => ({
      fit: size.toFitCm,
      rib: size.circumferenceCm,
      length: size.lengthCm,
      ribNeedle: size.ribNeedlesMm,
      needle: size.needlesMm,
      gauge: [size.stitchesPer10cm, size.roundsPer10cm],
    }))).toEqual([
      { fit: 44, rib: 37, length: 18.5, ribNeedle: 2.5, needle: 3, gauge: [33, 34] },
      { fit: 54, rib: 40, length: 23, ribNeedle: 2.5, needle: 3, gauge: [33, 34] },
      { fit: 62, rib: 46, length: 24, ribNeedle: 2.75, needle: 3.5, gauge: [31, 37] },
    ]);
    expect(roundHeightFor(hat, "size3")).not.toBe(roundHeightFor(hat, "size2"));
  });

  it("rejects an unknown size instead of quietly knitting another one", () => {
    expect(() => buildHat(hat, "no-such-size")).toThrow(/no size/);
  });
});
