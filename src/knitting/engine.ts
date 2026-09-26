import Knitter from "./knitter";
import { foldAt } from "./folding";
import { adjacentStitchDistance, verticalStitchDistance } from "../constants";
import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";
import {
  Chart,
  ChartCell,
  HatPattern,
  RoundSpec,
  ShapingOp,
  consumes,
  partKey,
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
  /**
   * The rounds after which the work is turned inside out.
   *
   * A round number, 1-based, so a turn at 41 falls between rounds 41 and 42.
   * Not a round itself and not a stitch: it is the boundary between two
   * regions of the hat worked on opposite faces of the tube. n of them make
   * n + 1 regions, and a round's region is how many of these are below it -
   * which is the parity that decides which way about its stitches go.
   */
  turns: number[];
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
 * The selected size supplies its own gauge. Historically every imported hat
 * used one knitting script for all sizes; Shwook (2014) is the first whose
 * small size genuinely changes stitch counts and round sequence as well.
 */
export const roundHeightFor = (
  pattern: HatPattern,
  sizeId?: string,
): number => {
  const size = sizeId
    ? pattern.sizes.find((candidate) => candidate.id === sizeId)
    : pattern.sizes[Math.floor(pattern.sizes.length / 2)];
  if (sizeId && !size) {
    throw new Error(`${pattern.id}: no size ${sizeId}`);
  }
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
  if ("repeat" in op) {
    const each = op.repeat.reduce((total, o) => total + cost(o), 0);
    // A repeat of a known number of times inside one that runs to a remainder
    // costs all of them. 2018 writes "[k7, kfb, (k3, kfb) x 3] rep to last 5",
    // where the inner three are twelve of the twenty stitches the outer one
    // takes, and counting them once puts the increase round eight repeats out.
    return "times" in op ? each * op.times : each;
  }
  if (op.work === "m1") return 0;
  if (op.work === "kfb") return 1;
  if (op.work === "k2tog" || op.work === "k2togtbl") return 2;
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
    if (op.work === "kfb") {
      // One instruction produces two loops from one stitch below. Keep the
      // first loop named KFB so the knitting UI can present one instruction;
      // the second physical loop follows as the paired increase.
      out.push("kfb", "m1");
      used += 1;
      return;
    }
    if (
      op.work === "k2tog" ||
      op.work === "k2togtbl" ||
      op.work === "s2kp" ||
      op.work === "sk2p"
    ) {
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
  work: { type: StitchType; slot: string }[],
  length: number,
  fabric: { width: number; rise: number },
  backwards = false,
  borrow?: number,
) => {
  // Always in the order the chart reads: a turn changes which way round the
  // hat the stitches go, never the order a knitter works them in.
  knitter.startRound(
    length,
    undefined,
    fabric.width,
    fabric.rise,
    borrow ?? borrowFor(work[0]?.type),
    backwards ? -1 : 1,
  );
  work.forEach(({ type, slot }) => knitter.knit(type, slot));
  knitter.endRound();
  labels.push(label);
};

/**
 * How far back into the round below a round has to reach to begin.
 *
 * Usually not at all: a round starts where the one below it started. But a
 * centred double decrease takes three stitches and leaves one standing over
 * the middle of them, and a round that opens with one has no stitch to its
 * right to take - the round below has not started yet. Worked as it is
 * written it would eat the first three instead of the last and the first
 * two, and so sit over the second rather than the first, and the whole round
 * with it. Which does not stay put: every such round shifts another stitch,
 * the decrease line winds round the crown instead of running up it, and the
 * wedges the chart opens either side of it come out all on one side.
 *
 * 2026's pattern says so itself, for the one place where the shift crosses
 * the start of the round rather than the start of a repeat: "At the end of
 * round 40, work until 1 st remains and place it, unworked, onto the start
 * of the next round to be included in the centred double decrease (s2kp)."
 * Its crown chart says it fifteen more times, by drawing the s2kp in a
 * column of its own that never moves and taking a stitch off each end of the
 * rows beside it.
 *
 * Only a centred one asks for it. A k2tog takes the two it is written over,
 * and so does an sk2p its three - it leans to the left and is meant to - and
 * those are every other round here that opens on a decrease.
 */
const borrowFor = (type?: StitchType): number => (type === "s2kp" ? 1 : 0);

/**
 * How wide a stitch of a named fabric is, and how tall its rounds are.
 *
 * A pattern that knits in one fabric names none, and a stitch is a stitch
 * wide and a round a round tall. One that knits in two - 2026's close-fitting
 * ribbed brim and slouchy colourwork top - gives each a tension relative to
 * its stated one, and a round that does not say which fabric it is in is in
 * the stated one.
 */
export const fabricOf = (
  pattern: HatPattern,
  roundHeight: number,
  fabric?: string,
): { width: number; rise: number } => {
  if (!fabric) return { width: adjacentStitchDistance, rise: roundHeight };
  const tension = pattern.tensions?.[fabric];
  if (tension === undefined) {
    throw new Error(`${pattern.id}: no tension for the fabric "${fabric}"`);
  }
  return {
    width: adjacentStitchDistance * (tension.stitch ?? 1),
    rise: roundHeight * (tension.round ?? 1),
  };
};

export const buildHat = (
  pattern: HatPattern,
  sizeId?: string,
): HatStitches => {
  const size = sizeId
    ? pattern.sizes.find((candidate) => candidate.id === sizeId)
    : undefined;
  if (sizeId && !size) {
    throw new Error(`${pattern.id}: no size ${sizeId}`);
  }
  const sections = size?.sections ?? pattern.sections;
  const roundHeight = roundHeightFor(pattern, sizeId);
  const knitter = new Knitter(roundHeight);
  const labels: string[] = [];
  let count = 0;
  /** The rounds the fabric folds back on, if the pattern says it has any. */
  const folds: number[] = [];
  /** The rounds after which the work is turned inside out. */
  const turns: number[] = [];
  /*
   * Which way round the hat the round being worked goes.
   *
   * A pattern that turns its work inside out partway - see the "turn" round -
   * has its two halves go opposite ways round the hat, and only their
   * relation to each other means anything. The last region is the one drawn
   * the way a chart reads, so with an odd number of turns it is the first
   * that goes round backwards, and with an even number none of them does.
   * Which way round never changes the order a round is knitted in.
   */
  const turnCount = sections.reduce(
    (total, section) =>
      total + section.rounds.filter((round) => round.type === "turn").length,
    0,
  );
  let backwards = turnCount % 2 === 1;

  const apply = (round: RoundSpec, section: string) => {
    switch (round.type) {
      case "turn": {
        // Not a round: the work is turned over, and goes on the other way
        // about from here. The boundary is kept so the chart can draw it and
        // the knitting panel can say so; a turn before the cast-on divides
        // nothing, so it is only a flip.
        if (knitter.rounds.length > 0) turns.push(knitter.rounds.length);
        backwards = !backwards;
        return;
      }
      case "fold": {
        // Not a round: the fabric turns on the last one worked.
        folds.push(knitter.rounds.length - 1);
        return;
      }
      case "castOn": {
        knitter.castOn(
          round.count,
          round.slot,
          fabricOf(pattern, roundHeight, round.fabric).width,
          backwards ? -1 : 1,
        );
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
        const fabric = fabricOf(pattern, roundHeight, round.fabric);
        for (let pass = 0; pass < round.count; pass++) {
          const work = Array.from({ length: count }, (_, i) => ({
            type: asStitch[sequence[i % sequence.length]],
            slot: round.slot,
          }));
          runRound(
            knitter,
            labels,
            `${section} · round ${pass + 1}`,
            work,
            count,
            fabric,
            backwards,
          );
        }
        return;
      }
      case "shaping": {
        const types = expand(round.ops, count);
        const work = types.map((type) => ({ type, slot: round.slot }));
        const after = types.length;
        runRound(
          knitter,
          labels,
          `${section} · shaping round`,
          work,
          after,
          fabricOf(pattern, roundHeight, round.fabric),
          backwards,
          round.borrow,
        );
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
        const fabric = fabricOf(pattern, roundHeight, round.fabric ?? chart.fabric);
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
            const work: { type: StitchType; slot: string }[] = [];
            for (let repeat = 0; repeat < round.repeats; repeat++) {
              cells.forEach((cell) =>
                work.push({
                  type: stitchFor(cell),
                  // A part is not a yarn until a colourway says which one.
                  slot:
                    cell.slot === "ground" || cell.slot === "motif"
                      ? partKey(chart.id, row, cell.slot)
                      : cell.slot,
                }),
              );
            }
            runRound(
              knitter,
              labels,
              `Chart ${chart.id}, row ${row}`,
              work,
              work.length,
              fabric,
              backwards,
            );
            count = work.length;
          }
        }
        return;
      }
    }
  };

  sections.forEach((section) =>
    section.rounds.forEach((round) => apply(round, section.label)),
  );

  const { stitches, rounds } = knitter.finish();
  foldAt(stitches, rounds, folds);
  return { stitches, rounds, roundLabels: labels, turns, roundHeight };
};
