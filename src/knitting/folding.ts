import { Stitch } from "../types/Stitch";

/**
 * Lay a hat out the way it is worn rather than the way it is knitted.
 *
 * A brim that is turned up, or a facing knitted to hang inside one, is a
 * length of the same tube doubled back on itself. Built as knitted it comes
 * out a brim too tall, with a plain cuff below the pattern that the hat does
 * not have: the Baa-ble Hat stands 112 units where the 21cm it prints is 84,
 * and 2026's Birsie Beanny carries its whole inside rib below the crown
 * instead of inside the brim.
 *
 * So the pattern says where its fabric turns, and this walks the rounds
 * keeping the rise between each and the next but changing which way it goes
 * at every turn. Keeping the rise is what makes it free: a reflection keeps
 * every distance it touches, and the plane of each reflection is the plane of
 * the round it turns on, so a joint that crossed a turn spans exactly what it
 * spanned before. Nothing is stretched to make a fold and nothing has to be
 * tuned to hold one.
 *
 * Which way the cast-on sets off is not a choice. The crown has to end up at
 * the top, so an odd number of turns means the fabric starts by going down -
 * the Baa-ble Hat's cast-on edge is the top of its outer layer - and an even
 * number means it starts by going up, as Birsie Beanny's does.
 *
 * A hat is then held wherever its fabric turns back upwards: the fold at the
 * bottom of a turned-up brim, or, where a hem hangs inside, both the cast-on
 * and the round the body sets off from. Those are the rounds that carry it,
 * and the doubled part hangs between them under the same push that fills the
 * rest of the hat out.
 */
export const foldAt = (
  stitches: Stitch[],
  rounds: number[][],
  turns: number[],
): void => {
  if (turns.length === 0) return;

  const heightOf = (round: number[]) => stitches[round[0]].position.y;
  const at = new Set(turns);

  // Walk the rounds, keeping each rise and turning where the pattern says.
  const laid: number[] = [];
  let going = turns.length % 2 === 0 ? 1 : -1;
  let height = 0;
  let below = heightOf(rounds[0]);
  const lows: number[] = [];
  if (going > 0) lows.push(0);

  rounds.forEach((round, index) => {
    if (index > 0) {
      height += going * (heightOf(round) - below);
      below = heightOf(round);
    }
    laid.push(height);
    if (at.has(index)) {
      going = -going;
      // Turning back upwards is where the hat hangs from.
      if (going > 0) lows.push(index);
    }
  });

  const floor = Math.min(...laid);
  const place = new Map<number, number>();
  rounds.forEach((round, index) =>
    round.forEach((id) => place.set(id, laid[index] - floor)),
  );
  // Stitch 0 is the phantom start of the helix; it goes with the cast-on.
  place.set(0, laid[0] - floor);

  for (const stitch of stitches) {
    const y = place.get(stitch.id);
    if (y !== undefined) stitch.position.y = y;
    stitch.fixed = false;
  }
  lows.forEach((index) =>
    rounds[index].forEach((id) => {
      stitches[id].fixed = true;
    }),
  );
};
