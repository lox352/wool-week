/**
 * Where a chart puts two stitches of one round side by side that are not
 * worked one after the other, and tears them apart.
 *
 * On the sweater site a view of one piece leaves another's stitches out, and
 * the two either side of the gap are torn apart on the chart. A hat is one
 * piece, knitted whole, so its chart never has one; the tiles and the painter
 * keep the room for them so they stay the sweater site's, and a hat's scene
 * gives none.
 */
export interface Break {
  /** The columns of the stitches either side: the one on the right, worked first, and the one on its left. */
  right: number;
  left: number;
  /** The rows it runs through, from the lowest. */
  from: number;
  to: number;
  /** How many stitches are worked between the two, in its lowest row: the stitches the chart leaves out. */
  between: number;
}
