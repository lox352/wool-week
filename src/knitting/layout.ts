import { Stitch } from "../types/Stitch";
import { consumption } from "../types/StitchType";

export interface Cell {
  /** 1-based, counting up from the cast-on. */
  round: number;
  /**
   * Where the stitch sits across the chart, counting from the right-hand edge
   * where stitch 1 is.
   *
   * Fractional, because a stitch sits over the middle of what it was worked
   * into: a k2tog takes two columns together and so lands on the half column
   * between them, and every stitch above it inherits that half.
   */
  column: number;
  /** 1-based stitch number within its round, for counting and for the rules. */
  index: number;
}

export interface ChartLayout {
  cells: Map<number, Cell>;
  rounds: number;
  columns: number;
}

/** The stitches of the round below that this one is worked into. */
const worksInto = (stitch: Stitch): number[] =>
  stitch.links.slice(0, consumption[stitch.type]);

/**
 * The middle of these columns, counted by stitch rather than by distance.
 *
 * With three stitches that is the middle one's column exactly, and with two
 * it is the half column between them. Which is not the same as averaging
 * their positions, and the difference is the whole of why a crown's decrease
 * line runs straight: the stitches a decrease takes together stop being
 * evenly spaced the moment the crown has opened a wedge beside them, so
 * their average creeps a fraction of a column towards the wider side every
 * round, and sixteen rounds of that is a decrease line you can see bending.
 * Counting to the middle instead ignores how wide the gaps either side have
 * grown, so a centred double decrease inherits the column of the stitch
 * below it exactly, round after round, and never moves.
 */
const middleOf = (columns: number[]): number => {
  const sorted = [...columns].sort((a, b) => a - b);
  const half = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[half]
    : (sorted[half - 1] + sorted[half]) / 2;
};

/**
 * A group of stitches and the stitches of the round below they came out of.
 *
 * Usually one and one - a knit is worked into a single stitch and leaves a
 * single stitch. A decrease has several below it and one above; an increase
 * has one below and several above, because a make-one is worked into nothing
 * at all and so belongs with the stitch beside it rather than on its own.
 * Grouping them is what lets both be laid out by the same rule.
 */
interface Family {
  below: number[];
  above: number[];
}

const familiesOf = (above: number[], byId: Map<number, Stitch>): Family[] => {
  const families: Family[] = [];
  /** Increases seen before any stitch that has something below it. */
  let orphans: number[] = [];

  for (const id of above) {
    const stitch = byId.get(id);
    if (!stitch) continue;
    const below = worksInto(stitch);
    if (below.length === 0) {
      const last = families[families.length - 1];
      if (last) last.above.push(id);
      else orphans.push(id);
      continue;
    }
    families.push({ below, above: [id] });
  }

  if (orphans.length > 0 && families.length > 0) {
    families[0].above.unshift(...orphans);
    orphans = [];
  }
  return families;
};

/**
 * Space a family's stitches out across the middle of the ones they answer to.
 *
 * One stitch worked into three lands on the middle of the three; three
 * stitches worked into one straddle it, a column and a half either side. It
 * is the same rule read in either direction, which is what makes a decrease
 * and an increase mirror images of each other on the chart rather than two
 * separate special cases.
 */
const centre = (ids: number[], on: number, column: Map<number, number>) => {
  ids.forEach((id, index) => {
    column.set(id, on + index - (ids.length - 1) / 2);
  });
};


const columnsOf = (ids: number[], column: Map<number, number>): number[] =>
  ids.map((id) => column.get(id)).filter((at): at is number => at !== undefined);

/**
 * Lay the tube out flat as a chart.
 *
 * Every stitch sits over the middle of the stitches it was worked into, and
 * under the middle of the stitches worked into it. A plain knit inherits its
 * column exactly, so the colourwork stacks up in true vertical columns; a
 * centred double decrease sits on the middle of the three it took together,
 * and a k2tog on the half column between its two. Read the other way, a
 * stitch that becomes two sits half a column in from each of them. The columns a decrease gave up are simply left empty,
 * which is what draws the crown as the wedges of absent fabric a printed
 * crown chart shows, and the columns an increase has yet to fill are left
 * empty too, so the rib shows where every new stitch is about to come in.
 *
 * The widest round anchors the grid, at one column per stitch, and everything
 * else is propagated away from it in both directions. That matters because
 * these hats increase above the brim: the Aal Ower Toorie's rib is 130
 * stitches under a 162 stitch body, and working upwards from the rib would
 * have to squeeze 162 stitches into 130 columns. Working down from the body
 * instead leaves the rib spanning the whole chart, which is both true and the
 * thing you want to see coming.
 *
 * It used to hang each stitch above the first stitch it was worked into, with
 * a cursor that only ever moved right. That pinned a short round against one
 * edge - the rib bunched to the right of the chart with dead space beside it -
 * and made the crown's decreases slide sideways rather than closing in evenly,
 * because the gap a decrease leaves always opened on the same side of it.
 */
export const layOut = (stitches: Stitch[], rounds: number[][]): ChartLayout => {
  const byId = new Map(stitches.map((stitch) => [stitch.id, stitch]));
  const widest = rounds.reduce((most, round) => Math.max(most, round.length), 0);
  const anchor = rounds.findIndex((round) => round.length === widest);
  const column = new Map<number, number>();

  if (anchor >= 0) {
    rounds[anchor].forEach((id, index) => column.set(id, index + 1));
  }

  // Upwards from the anchor: over the middle of what it was worked into.
  for (let index = anchor + 1; index < rounds.length; index++) {
    for (const family of familiesOf(rounds[index], byId)) {
      const below = columnsOf(family.below, column);
      if (below.length > 0) centre(family.above, middleOf(below), column);
    }
  }

  // And downwards: under the middle of whatever was worked into it.
  for (let index = anchor - 1; index >= 0; index--) {
    for (const family of familiesOf(rounds[index + 1], byId)) {
      const above = columnsOf(family.above, column);
      if (above.length > 0) centre(family.below, middleOf(above), column);
    }
  }

  const cells = new Map<number, Cell>();
  rounds.forEach((round, index) => {
    round.forEach((id, position) => {
      cells.set(id, {
        round: index + 1,
        column: column.get(id) ?? position + 1,
        index: position + 1,
      });
    });
  });

  return { cells, rounds: rounds.length, columns: widest };
};

/** The stitches to draw. Stitch 0 is the phantom start of the helix. */
export const chartedStitches = (stitches: Stitch[]): Stitch[] =>
  stitches.filter((stitch) => stitch.id !== 0);
