import { Stitch } from "../types/Stitch";
import { adjacentStitchDistance, fabricThickness } from "../constants";

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
 *
 * The one thing a reflection will not give is which layer is inside. Doubled
 * back on itself, the fabric comes to rest at the radius its own stitches
 * make, and where the pattern has arranged for both layers to make the same
 * one - 2026 increases 128 stitches to 160 at a change of fabric precisely so
 * that its outer brim is the same way round as its inner - the two land on
 * top of each other. Wool does not: a fold has a thickness, and the part
 * behind one sits a fabric's worth in. So each layer is drawn in by a
 * thickness for every earlier layer still above it, which gives the fold its
 * bight and puts the small ledge at the top of the brim where the photograph
 * has one - the body coming out from behind the brim's cast-on edge. It stops
 * where the doubling stops: nothing is inside anything above the brim, so
 * nothing there is moved.
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

  /*
   * Which layer each round is in, and how high each layer reaches: a round is
   * one layer further in for every turn before it, and it is behind an
   * earlier layer only for as long as that layer is still above it.
   */
  const layerOf: number[] = [];
  const reach: number[] = [];
  let layer = 0;
  rounds.forEach((_, index) => {
    layerOf.push(layer);
    reach[layer] = Math.max(reach[layer] ?? -Infinity, laid[index]);
    if (at.has(index)) layer += 1;
  });
  const inside = (index: number) =>
    reach.filter(
      (top, which) => which < layerOf[index] && top >= laid[index] - 1e-9,
    ).length;

  const place = new Map<number, { y: number; scale: number }>();
  rounds.forEach((round, index) => {
    const draw = inside(index) * fabricThickness;
    const away = Math.hypot(
      stitches[round[0]].position.x,
      stitches[round[0]].position.z,
    );
    const where = {
      y: laid[index] - floor,
      scale: draw > 0 && away > draw ? (away - draw) / away : 1,
    };
    round.forEach((id) => place.set(id, where));
  });
  // Stitch 0 is the phantom start of the helix; it goes with the cast-on.
  place.set(0, place.get(rounds[0][0]) ?? { y: laid[0] - floor, scale: 1 });

  for (const stitch of stitches) {
    const where = place.get(stitch.id);
    if (where !== undefined) {
      stitch.position.y = where.y;
      if (where.scale !== 1) {
        stitch.position.x *= where.scale;
        stitch.position.z *= where.scale;
        /*
         * And the stitches of a drawn-in round really are that much narrower,
         * which is the point: a rope cut to the width they were built at
         * would let the inner layer straight back out to the circle the outer
         * one is on, and the two would settle one inside the other. A hem
         * knitted to hang within a brim is made smaller than the brim on
         * purpose - on finer needles, or over fewer stitches, or as here both.
         */
        stitch.width = (stitch.width ?? adjacentStitchDistance) * where.scale;
      }
    }
    stitch.fixed = false;
  }
  lows.forEach((index) =>
    rounds[index].forEach((id) => {
      stitches[id].fixed = true;
    }),
  );
};
