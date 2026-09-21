import { Stitch } from "../types/Stitch";
import { StitchType, consumption } from "../types/StitchType";
import { SlotId } from "../data/hats/types";
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
  readonly stitches: Stitch[] = [];
  /** Stitch ids in each round, in the order they are worked. */
  readonly rounds: number[][] = [];

  private current: number[] = [];
  /** The stitch in the round below that the next stitch is worked into. */
  private below = 1;
  private expected = 0;
  private slot: SlotId = "A";
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
    const round = this.rounds[this.rounds.length - 1];
    if (!round) return 0;
    return round[round.length - 1] - this.below + 1;
  }

  private static radiusFor(count: number) {
    return (adjacentStitchDistance * Math.max(count, 3)) / (2 * Math.PI);
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
    const rise = Math.sqrt(
      Math.max(verticalStitchDistance ** 2 - pulledIn ** 2, 0),
    );
    return this.height + rise;
  }

  private place(index: number, count: number) {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2;
    return {
      x: this.radius * Math.cos(angle),
      y: this.height,
      z: this.radius * Math.sin(angle),
    };
  }

  castOn(count: number, slot: SlotId): this {
    this.slot = slot;
    this.radius = Knitter.radiusFor(count);
    this.height = 0;
    for (let i = 0; i < count; i++) {
      this.stitches.push({
        id: i,
        position: this.place(i, count),
        links: i === 0 ? [] : [i - 1],
        fixed: true,
        type: "k1",
        slot,
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
    });
    this.rounds.push(Array.from({ length: count }, (_, i) => i + 1));
    this.below = 1;
    return this;
  }

  /** Begin a round that is expected to end up `count` stitches long. */
  startRound(count: number, slot: SlotId = this.slot): this {
    this.current = [];
    this.expected = count;
    this.slot = slot;
    const radius = Knitter.radiusFor(count);
    this.height = this.riseTo(radius);
    this.radius = radius;
    return this;
  }

  knit(type: StitchType, slot: SlotId = this.slot): this {
    const eaten = consumption[type];
    const links: number[] = [];
    for (let i = 0; i < eaten; i++) links.push(this.below + i);
    links.push(this.last.id);

    const id = this.last.id + 1;
    this.stitches.push({
      id,
      position: this.place(this.current.length, this.expected),
      links,
      fixed: false,
      type,
      slot,
    });
    this.current.push(id);
    this.below += eaten;
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
