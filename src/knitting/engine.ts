import Knitter from "./knitter";
import { turnUp } from "./turn-up";
import { adjacentStitchDistance, verticalStitchDistance } from "../constants";
import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";
import {
  Chart,
  ChartCell,
  HatPattern,
  RoundSpec,
  ShapingOp,
  SlotId,
  consumes,
} from "../data/hats/types";

/**
 * Turns a pattern into stitches.
 *
 * Everything downstream - the chart, the hat on screen, the row counter, the
 * knitting panel - only ever wanted a list of stitches and the rounds they
 * fall in, which is why a hat charted from a sky and a hat charted from a
 * 1930s Fair Isle graph book can share all of it. This is the only part that
 * knows a published pattern from a generated one.
 */

export interface HatStitches {
  stitches: Stitch[];
  rounds: number[][];
  /** A label per round, for the chart's margin: "Chart A, row 7". */
  roundLabels: string[];
  /** How tall a round is, in the units the stitches are placed in. */
  roundHeight: number;
}

/**
 * How tall a round of this hat is, relative to how wide a stitch is.
 *
 * Knitted stitches are wider than they are tall, but by how much is a property
 * of the pattern rather than a constant: it is the tension the designer wrote
 * the hat for. The Aal Ower Toorie is 31 stitches and 34 rounds to 10cm, so a
 * round is 31/34 of a stitch's width, and a hat built on the flat 0.8 this
 * used to assume came out a fifteenth too squat.
 *
 * Taken from the middle size, because a hat is drawn once and every size of
 * these patterns has the same stitch count - the size is in the needles.
 */
export const roundHeightFor = (pattern: HatPattern): number => {
  const size = pattern.sizes[Math.floor(pattern.sizes.length / 2)];
  if (!size?.stitchesPer10cm || !size?.roundsPer10cm) {
    return verticalStitchDistance;
  }
  return adjacentStitchDistance * (size.stitchesPer10cm / size.roundsPer10cm);
};

/** The stitch a chart cell asks for. */
const stitchFor = (cell: ChartCell): StitchType => {
  switch (cell.symbol) {
    case "purl":
      return "p1";
    case "k1tbl":
      return "k1tbl";
    case "k2tog":
      return "k2tog";
    case "s2kp":
      return "s2kp";
    case "sk2p":
      return "sk2p";
    default:
      return "k1";
  }
};

/** How many stitches a chart row is worked over, and how many it leaves. */
export const rowConsumes = (row: ChartCell[]): number =>
  row.reduce((total, cell) => total + consumes(cell), 0);

/**
 * Flatten a shaping round into stitches.
 *
 * A pattern writes these as "K4, [k2tog, k8] to last 6 sts, k2tog, k4", so a
 * repeat has to be expanded against how many stitches are left rather than
 * against a count the pattern never states. "to last 6" means exactly that:
 * keep going while more than six of the round below are still unworked.
 */
const cost = (op: ShapingOp): number => {
  if ("repeat" in op) return op.repeat.reduce((total, o) => total + cost(o), 0);
  if (op.work === "m1") return 0;
  if (op.work === "k2tog") return 2;
  if (op.work === "s2kp" || op.work === "sk2p") return 3;
  return op.times;
};

const expand = (ops: ShapingOp[], available: number): StitchType[] => {
  const out: StitchType[] = [];
  let used = 0;

  const one = (op: ShapingOp) => {
    if ("repeat" in op) {
      const each = cost(op);
      const times =
        "times" in op
          ? op.times
          : each > 0
            ? Math.floor((available - used - op.untilRemaining) / each)
            : 0;
      for (let i = 0; i < times; i++) op.repeat.forEach(one);
      return;
    }
    if (op.work === "m1") {
      out.push("m1");
      return;
    }
    if (op.work === "k2tog" || op.work === "s2kp" || op.work === "sk2p") {
      out.push(op.work);
      used += cost(op);
      return;
    }
    for (let i = 0; i < op.times; i++) out.push(op.work === "p" ? "p1" : "k1");
    used += op.times;
  };

  ops.forEach(one);

  if (used !== available) {
    throw new Error(
      `a shaping round works ${used} stitches, but the round below has ${available}`,
    );
  }
  return out;
};

const chartOf = (pattern: HatPattern, id: string): Chart => {
  const chart = pattern.charts.find((candidate) => candidate.id === id);
  if (!chart) throw new Error(`${pattern.id}: no chart ${id}`);
  return chart;
};

/** How many stitches a round leaves, without knitting it. */
const runRound = (
  knitter: Knitter,
  labels: string[],
  label: string,
  work: { type: StitchType; slot: SlotId }[],
  length: number,
) => {
  knitter.startRound(length);
  work.forEach(({ type, slot }) => knitter.knit(type, slot));
  knitter.endRound();
  labels.push(label);
};

export const buildHat = (pattern: HatPattern): HatStitches => {
  const roundHeight = roundHeightFor(pattern);
  const knitter = new Knitter(roundHeight);
  const labels: string[] = [];
  let count = 0;
  /** The round the brim folds along, if the pattern says it has one. */
  let fold = -1;

  const apply = (round: RoundSpec, section: string) => {
    switch (round.type) {
      case "turnUp": {
        // Not a round: the fold runs along the last one worked.
        fold = knitter.rounds.length - 1;
        return;
      }
      case "castOn": {
        knitter.castOn(round.count, round.slot);
        count = round.count;
        labels.push(`${section} · cast on`);
        return;
      }
      case "rounds": {
        const sequence = round.sequence ?? ["k"];
        const asStitch: Record<string, StitchType> = {
          k: "k1",
          p: "p1",
          k1tbl: "k1tbl",
        };
        for (let pass = 0; pass < round.count; pass++) {
          const work = Array.from({ length: count }, (_, i) => ({
            type: asStitch[sequence[i % sequence.length]],
            slot: round.slot,
          }));
          runRound(knitter, labels, `${section} · round ${pass + 1}`, work, count);
        }
        return;
      }
      case "shaping": {
        const types = expand(round.ops, count);
        const work = types.map((type) => ({ type, slot: round.slot }));
        const after = types.length;
        runRound(knitter, labels, `${section} · shaping round`, work, after);
        if (after !== round.to) {
          throw new Error(
            `${section}: shaping round left ${after} stitches, ` +
              `but the pattern says ${round.to}`,
          );
        }
        count = after;
        return;
      }
      case "chart": {
        const chart = chartOf(pattern as HatPattern, round.chart);
        const [from, to] = round.rows;
        for (let pass = 0; pass < (round.passes ?? 1); pass++) {
          for (let row = from; row <= to; row++) {
            const cells = chart.rows[row - 1];
            if (!cells) {
              throw new Error(`chart ${chart.id} has no row ${row}`);
            }
            const needed = rowConsumes(cells) * round.repeats;
            if (needed !== count) {
              throw new Error(
                `chart ${chart.id} row ${row} is worked over ${needed} ` +
                  `stitches, but the round below has ${count}`,
              );
            }
            const work: { type: StitchType; slot: SlotId }[] = [];
            for (let repeat = 0; repeat < round.repeats; repeat++) {
              cells.forEach((cell) =>
                work.push({ type: stitchFor(cell), slot: cell.slot }),
              );
            }
            runRound(
              knitter,
              labels,
              `Chart ${chart.id}, row ${row}`,
              work,
              work.length,
            );
            count = work.length;
          }
        }
        return;
      }
    }
  };

  pattern.sections.forEach((section) =>
    section.rounds.forEach((round) => apply(round, section.label)),
  );

  const { stitches, rounds } = knitter.finish();
  if (fold >= 0) turnUp(stitches, rounds, fold);
  return { stitches, rounds, roundLabels: labels, roundHeight };
};
