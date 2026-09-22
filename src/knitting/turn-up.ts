import { Stitch } from "../types/Stitch";

/**
 * Fold a brim back on itself, and hang the hat from the fold.
 *
 * A hat with a turned up rib is not worn the way it is knitted. The Baa-ble
 * Hat is twenty-five rounds of rib and then the pattern, but it is twenty-one
 * centimetres from the *turned up* edge to the crown, because half the rib is
 * doubled back outside the other half. Built as knitted it comes out a rib
 * taller than it is worn, with a long plain cuff under the sheep that the hat
 * does not actually have.
 *
 * So the rounds below the fold are reflected in the plane of the fold, and
 * the hat is pinned at the fold ring rather than at the cast-on. Everything
 * else follows from the physics that was already there: gravity points away
 * from the pinned ring, so both layers of the brim rise from the fold
 * together, and the cast-on edge - which is now the free one - hangs where it
 * falls instead of being nailed down.
 *
 * Reflecting rather than re-placing matters. A reflection keeps every
 * distance it touches, and the one plane it is done in is the one plane the
 * fold ring sits in, so a joint that crossed the fold spanned a round's height
 * before and spans a round's height after. The hat starts in exactly the state
 * the knitter built, folded; no joint is stretched to make the fold, and
 * nothing has to be tuned to hold it.
 *
 * What comes out is the hat the pattern measures. Ninety-six stitches of rib
 * are 48cm round, so a stitch is half a centimetre and 21cm from the turned up
 * edge to the crown is 84 units; the Baa-ble Hat settles at 86. Built flat it
 * settles at 112, a third too tall, with a long plain cuff under the sheep.
 *
 * The two layers of the brim end up in the same place, because both are rounds
 * of ninety-six and the pressure pushes both to the same radius. That is what
 * a model with no fabric thickness has to say: the outer layer of a fold is
 * outside the inner one by the thickness of the wool, and there is no wool
 * here, only where the wool goes. It costs nothing to look at, the brim being
 * all one shade either way.
 *
 * `at` is the round the fold runs along, as an index into `rounds`. The
 * rounds before it are the ones that come up the outside; stitch 0 goes with
 * them, being the phantom start of the helix that the cast-on seam closes on.
 */
export const turnUp = (
  stitches: Stitch[],
  rounds: number[][],
  at: number,
): void => {
  const fold = rounds[at];
  if (!fold || fold.length === 0) return;

  const height = stitches[fold[0]].position.y;
  const below = new Set<number>([0]);
  for (let round = 0; round < at; round++) {
    rounds[round].forEach((id) => below.add(id));
  }

  for (const stitch of stitches) {
    stitch.fixed = false;
    if (below.has(stitch.id)) {
      stitch.position.y = 2 * height - stitch.position.y;
    }
    // The fold is the brim now, so that is where the hat stands.
    stitch.position.y -= height;
  }
  fold.forEach((id) => {
    stitches[id].fixed = true;
  });
};
