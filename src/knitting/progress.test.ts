import { describe, expect, it } from "vitest";
import { buildHat } from "./engine";
import { hatById } from "../data/hats";
import {
  currentRun,
  indexRounds,
  positionOf,
  regionsOf,
  runInstruction,
  stitchWord,
  upcomingRuns,
} from "./progress";

const hatOf = (id: string) => {
  const hat = hatById(id)!;
  const { stitches, rounds, roundLabels, turns } = buildHat(hat);
  return {
    stitches,
    rounds,
    turns,
    index: indexRounds(rounds, roundLabels, turns),
  };
};

describe("what to work next", () => {
  it("stops a run where the stitch changes, not only where the yarn does", () => {
    /*
     * 2026 begins in twisted rib - k1 tbl, k1 tbl, p, p, thirty-two times
     * over - all of it in one colour. A run that only watched the yarn called
     * that "work 126 in Port Wine", which says nothing about the four
     * different stitches it is made of.
     */
    const { stitches, rounds, index } = hatOf("sww26-birsie-beanny");
    const rib = rounds[1];
    const before = rib[0] - 1;

    const runs = upcomingRuns(stitches, before, index, 4);
    // Two and two, turn and turn about. Which way round it starts is the
    // pattern's business - 2026 turns its work, so the rib goes on the other
    // way about the hat - and not what this is checking.
    expect(runs.map((run) => runInstruction(run))).toEqual(
      runs[0].type === "p1"
        ? ["Purl 2", "Knit 2 tbl", "Purl 2", "Knit 2 tbl"]
        : ["Knit 2 tbl", "Purl 2", "Knit 2 tbl", "Purl 2"],
    );
    expect(new Set(runs.map((run) => run.type))).toEqual(
      new Set(["p1", "k1tbl"]),
    );
    // One colour throughout, which is why the yarn alone could not see it.
    expect(new Set(runs.map((run) => run.slot)).size).toBe(1);
  });

  it("still stops where the yarn changes", () => {
    const { stitches, rounds, index } = hatOf("sww26-birsie-beanny");
    // A lettering round: two yarns, one stitch.
    const row = rounds.findIndex((_, i) => i > 6 && rounds[i].length === 160);
    const runs = upcomingRuns(stitches, rounds[row + 4][0] - 1, index, 3);
    expect(new Set(runs.map((run) => run.type)).size).toBe(1);
    expect(runs[0].slot).not.toBe(runs[1].slot);
  });

  it("still stops at the end of a round", () => {
    const { stitches, rounds, index } = hatOf("sww25-aal-ower-toorie");
    const plain = rounds[8];
    const run = currentRun(stitches, plain[0] - 1, index)!;
    expect(run.endId).toBeLessThanOrEqual(plain[plain.length - 1]);
  });

  it("reads the seam of the cast-on round as a knit, not as a stitch", () => {
    // The join closes the round and is not worked. Breaking a run on it would
    // leave a knitter told to work one of something they never do.
    const { stitches, rounds, index } = hatOf("sww26-birsie-beanny");
    const castOn = rounds[0];
    expect(stitches[castOn[castOn.length - 1]].type).toBe("join");
    const run = currentRun(stitches, castOn[0] - 1, index)!;
    expect(run.type).toBe("k1");
    expect(run.length).toBe(castOn.length);
  });

  it("counts the one-for-one stitches, and repeats the rest", () => {
    const say = (type: string, length: number) =>
      runInstruction({
        slot: "A",
        type: type as never,
        length,
        startId: 1,
        endId: length,
      });
    expect(say("k1", 6)).toBe("Knit 6");
    expect(say("p1", 2)).toBe("Purl 2");
    // As a pattern writes it, with the count in the middle.
    expect(say("k1tbl", 4)).toBe("Knit 4 tbl");
    // You do not work three stitches of k2tog; you work k2tog three times.
    expect(say("k2tog", 3)).toBe("K2tog x 3");
    expect(say("k2tog", 1)).toBe("K2tog");
    expect(say("s2kp", 1)).toBe("S2kp");
    expect(stitchWord("p1")).toBe("purl");
  });

  it("names the decrease a crown is closed with", () => {
    const { stitches, rounds, index } = hatOf("sww26-birsie-beanny");
    const crown = rounds[rounds.length - 1];
    const run = currentRun(stitches, crown[0] - 1, index)!;
    expect(["s2kp", "k1"]).toContain(run.type);
    // Whatever it is, it is said rather than called "work".
    expect(runInstruction(run)).not.toMatch(/^Work/);
  });
});

/**
 * The turn is not a stitch, so the only thing that can carry it is the round
 * it falls between. n of them cut the hat into n + 1 regions, and a round's
 * region is simply how many turns are below it - the parity that decides
 * which way about the hat its stitches go.
 */
describe("the regions a turn divides a hat into", () => {
  it("makes two regions from one turn, meeting at it", () => {
    expect(regionsOf([41], 100)).toEqual([
      { from: 1, to: 41, turns: 0 },
      { from: 42, to: 100, turns: 1 },
    ]);
  });

  it("makes n + 1 regions from n turns", () => {
    expect(regionsOf([10, 20, 30], 40).map((region) => region.turns)).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it("is one region when nothing is turned", () => {
    expect(regionsOf([], 100)).toEqual([{ from: 1, to: 100, turns: 0 }]);
  });

  it("drops a turn that divides nothing", () => {
    // Before the cast-on, or after the last round: no fabric on one side.
    expect(regionsOf([0, 100, 140], 100)).toEqual([
      { from: 1, to: 100, turns: 0 },
    ]);
  });

  it("puts 2026's turn between its inside rib and its body", () => {
    const { stitches, turns, index } = hatOf("sww26-birsie-beanny");
    expect(turns).toHaveLength(1);
    const [turn] = turns;

    // The pattern turns the work at the head of the body, which is the round
    // after the last of the hem's chart.
    expect(index.labels[turn - 1]).toBe("Chart Hem, row 24");
    expect(index.labels[turn]).toBe("Body · round 1");

    // The last stitch of the round below the turn is still in region 0 ...
    const before = index.rounds[turn - 1];
    expect(positionOf(stitches, before[before.length - 2], index)).toMatchObject(
      { round: turn, region: 0 },
    );
    // ... and the first of the round above it opens region 1.
    expect(positionOf(stitches, before[before.length - 1], index)).toMatchObject(
      { round: turn + 1, region: 1, regionRound: 1, stitchInRound: 1 },
    );
    // The reminder comes down at the end of that round, not before it.
    const after = index.rounds[turn];
    expect(
      positionOf(stitches, after[after.length - 2], index),
    ).toMatchObject({ round: turn + 1, regionRound: 1 });
    expect(
      positionOf(stitches, after[after.length - 1], index),
    ).toMatchObject({ round: turn + 2, regionRound: 2 });
  });

  it("leaves a hat that is never turned in one region throughout", () => {
    const { stitches, turns, index } = hatOf("sww15-baa-ble-hat");
    expect(turns).toEqual([]);
    expect(index.regions).toHaveLength(1);
    expect(positionOf(stitches, 0, index).region).toBe(0);
  });
});
