import { Stitch } from "../types/Stitch";
import { StitchType, consumption } from "../types/StitchType";
import { adjacentStitchDistance, verticalStitchDistance } from "../constants";

/**
 * Knits a tube from a pattern, one stitch at a time, and remembers where the
 * rounds fell.
 *
 * A hat generated from a globe or a sky has to have its rounds recovered
 * afterwards by walking the stitch graph, because nothing recorded them. Here
 * the pattern states them outright - "work rows 1-16 of Chart A, the 18 stitch
 * repeat 9 times" - so they are kept as they are made. That is what lets the
 * chart, the row counter and the knitting panel all agree on what round 12 is,
 * and it is the arithmetic the printed pattern gets checked against.
 *
 * The knitting is a helix, not a stack of rings. Casting on leaves a phantom
 * stitch at id 0 that nothing is worked into, and a seam stitch that stands in
 * for it to close the round; so the first round is ids 1..n, the seam
 * included, and id 0 is dropped everywhere downstream.
 *
 * Each stitch links to the stitches it is worked into, then to the stitch
 * before it in the round. An increase is worked into nothing, so it links only
 * backwards: it is held by its neighbours and by the round worked into it next.
 */
export default class Knitter {
  /**
   * How tall the round being worked is. A property of the pattern's tension
   * rather than a constant - see roundHeightFor in engine.ts - and of which
   * of the pattern's fabrics the round is in, where it has more than one.
   */
  private rise: number;

  constructor(roundHeight: number = verticalStitchDistance) {
    this.rise = roundHeight;
  }

  readonly stitches: Stitch[] = [];
  /** Stitch ids in each round, in the order they are worked. */
  readonly rounds: number[][] = [];

  private current: number[] = [];
  /** The round being worked into, and how far along it the next stitch is. */
  private under: number[] = [];
  private cursor = 0;
  private expected = 0;
  private slot: string = "A";
  /**
   * How wide a stitch of the round being worked is. One fabric's worth unless
   * the pattern says it knits in more than one - see HatPattern.tensions.
   */
  private width: number = adjacentStitchDistance;
  /** Where the round being worked sits: its radius, and its height. */
  private radius = 0;
  private height = 0;

  private get last(): Stitch {
    return this.stitches[this.stitches.length - 1];
  }

  /** Stitches in the last completed round. */
  get roundBelow(): number {
    return this.rounds[this.rounds.length - 1]?.length ?? 0;
  }

  /** Stitches worked in the round in progress. */
  get inRound(): number {
    return this.current.length;
  }

  /** Stitches of the round below still unworked. */
  get remainingBelow(): number {
    return Math.max(this.under.length - this.cursor, 0);
  }

  /**
   * How wide a round of `count` stitches comes out.
   *
   * Its stitches laid end to end and no further, so a fabric whose stitches
   * are narrower makes a smaller circle of the same number of them. That is
   * what lets a pattern increase at a change of fabric without the hat
   * getting any wider, which is what 2026's brim does.
   */
  private static radiusFor(count: number, width: number) {
    return (width * Math.max(count, 3)) / (2 * Math.PI);
  }

  /**
   * Where a round sits above the one below it.
   *
   * A round of knitting is a fixed length of yarn, so as a crown decreases
   * and the round pulls in, that length goes into closing the circle rather
   * than into height: the fabric lies over the top of the head instead of
   * carrying on up. Taking the rise as the vertical leg of a right triangle
   * whose hypotenuse is the round's own height is what turns the last sixteen
   * rounds into a dome rather than a steeple.
   */
  private riseTo(radius: number) {
    const pulledIn = this.radius - radius;
    const rise = Math.sqrt(Math.max(this.rise ** 2 - pulledIn ** 2, 0));
    /*
     * A crown can decrease faster than its fabric can reach.
     *
     * The Aal Ower Toorie takes 162 stitches to 9 over sixteen rounds, which
     * asks the radius to shrink by about twice what a round of knitting is
     * tall. Nothing flat can do that, and the arithmetic above gives up and
     * returns no rise at all, which draws the crown as a flat lid and the hat
     * as an open pot. Real wool does not do that either: the stitches at the
     * crown compress and stand up rather than lying down, and the yarn drawn
     * through the last nine of them gathers the top. So a round always rises
     * a little, however hard it is pulling in.
     */
    return this.height + Math.max(rise, this.rise * 0.35);
  }

  private place(index: number, count: number) {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2;
    return {
      x: this.radius * Math.cos(angle),
      y: this.height,
      z: this.radius * Math.sin(angle),
    };
  }

  castOn(count: number, slot: string, width = adjacentStitchDistance): this {
    this.slot = slot;
    this.width = width;
    this.radius = Knitter.radiusFor(count, width);
    this.height = 0;
    for (let i = 0; i < count; i++) {
      this.stitches.push({
        id: i,
        position: this.place(i, count),
        links: i === 0 ? [] : [i - 1],
        fixed: true,
        type: "k1",
        slot,
        width,
        rise: this.rise,
      });
    }
    // The seam closes the round by standing in for the phantom stitch 0.
    this.stitches.push({
      id: count,
      position: this.place(count, count),
      links: [0, count - 1],
      fixed: true,
      type: "join",
      slot,
      width,
      rise: this.rise,
    });
    this.rounds.push(Array.from({ length: count }, (_, i) => i + 1));
    return this;
  }

  /**
   * Begin a round that is expected to end up `count` stitches long.
   *
   * `borrow` is how many stitches back from the round below's own start to
   * begin taking it from, which a round whose first stitch is a centred
   * decrease needs: see the note in engine's buildHat. The round below is
   * walked round and round, so a stitch borrowed off its end is simply the
   * one before its start, and every stitch of it is still worked exactly
   * once.
   */
  startRound(
    count: number,
    slot: string = this.slot,
    width: number = this.width,
    rise: number = this.rise,
    borrow = 0,
  ): this {
    this.current = [];
    this.expected = count;
    this.slot = slot;
    this.width = width;
    this.rise = rise;
    this.under = this.rounds[this.rounds.length - 1] ?? [];
    this.cursor = -borrow;
    const radius = Knitter.radiusFor(count, width);
    this.height = this.riseTo(radius);
    this.radius = radius;
    return this;
  }

  knit(type: StitchType, slot: string = this.slot): this {
    const eaten = consumption[type];
    const links: number[] = [];
    const round = this.under.length;
    for (let i = 0; i < eaten && round > 0; i++) {
      const at = this.cursor++;
      links.push(this.under[((at % round) + round) % round]);
    }
    // KFB makes two new loops through one stitch below. The first is stored
    // as the KFB itself and the second as the immediately following increase;
    // give that second loop the same parent as the first rather than leaving
    // it attached only sideways to its neighbour.
    if (
      type === "m1" &&
      this.last.type === "kfb" &&
      this.last.links.length > 1
    ) {
      links.push(this.last.links[0]);
    }
    links.push(this.last.id);

    const id = this.last.id + 1;
    this.stitches.push({
      id,
      position: this.place(this.current.length, this.expected),
      links,
      fixed: false,
      type,
      slot,
      width: this.width,
      rise: this.rise,
    });
    this.current.push(id);
    return this;
  }

  /** Close the round in progress. */
  endRound(): this {
    if (this.current.length > 0) {
      this.rounds.push(this.current);
      this.current = [];
    }
    return this;
  }

  finish(): { stitches: Stitch[]; rounds: number[][] } {
    this.endRound();
    return { stitches: this.stitches, rounds: this.rounds };
  }
}
