import React, { useState } from "react";
import { Colourway, SlotId } from "../data/hats/types";
import { ballsOf, inkOn, type Overrides } from "../knitting/palette";
import Button from "./ui/Button";
import YarnPicker, { type Chosen } from "./YarnPicker";
import "./WoolList.css";

/**
 * The wool a hat is being knitted in: what to buy, and what to change.
 *
 * One list rather than two. There used to be a shopping list and, behind a
 * "your own colours" tile, a second list of the same wool with a way to
 * change it - the same colours written out twice, and a tile whose only job
 * was to reveal the second one. A row here does both: it says what the ball
 * is and how many to buy, and it opens the picker.
 *
 * A row is a ball and not a yarn of the pattern, which matters where a
 * colourway puts one ball in several - see ballsOf. So changing the row that
 * says "A + C + G" changes all three, which is what somebody swapping a ball
 * of Graeff for one of their own means.
 */
interface WoolListProps {
  colourway: Colourway;
  sizeId: string;
  overrides: Overrides;
  onChange: (slots: SlotId[], chosen: Chosen | undefined) => void;
  onRestoreAll: () => void;
}

/** "Yarn A", or "Yarns A, C and G". */
const nameFor = (slots: SlotId[]): string =>
  slots.length === 1
    ? `Yarn ${slots[0]}`
    : `Yarns ${slots.slice(0, -1).join(", ")} and ${slots[slots.length - 1]}`;

const WoolList: React.FC<WoolListProps> = ({
  colourway,
  sizeId,
  overrides,
  onChange,
  onRestoreAll,
}) => {
  /** Which ball is being chosen, by the yarns it does. */
  const [picking, setPicking] = useState<SlotId[] | undefined>();
  const balls = ballsOf(colourway, sizeId, overrides);
  const chosen = picking && balls.find((ball) => ball.slots[0] === picking[0]);
  const yours = Object.keys(overrides).length > 0;

  return (
    <>
      <ul className="wool-list">
        {balls.map((ball) => (
          <li key={ball.slots.join()}>
            <button
              type="button"
              className="wool-row"
              onClick={() => setPicking(ball.slots)}
            >
              <span
                className="shade-chip"
                style={{ background: ball.yarn.hex, color: inkOn(ball.yarn.hex) }}
              >
                {ball.slots.join(" + ")}
              </span>
              <span className="wool-row-what">
                <strong>{ball.yarn.name}</strong>
                {ball.yarn.code ? ` (${ball.yarn.code})` : ""}
                <span className="quiet wool-row-count">
                  {ball.slots.some(slot => overrides[slot])
                    ? "Substituted yarn · quantity not calculated"
                    : `${ball.balls} ball${ball.balls === 1 ? "" : "s"} in the original pattern`}
                  {overrides[ball.slots[0]] ? " · yours" : ""}
                  {ball.yarn.approximate ? " · colour approximate" : ""}
                </span>
              </span>
              <span className="wool-row-change">Change</span>
            </button>
          </li>
        ))}
      </ul>

      {yours && (
        <p className="wool-list-restore">
          Original ball counts do not transfer to substituted wool. Check yarn weight,
          metres per ball and your swatch; combining colours also combines their yarn requirements.{" "}
          <Button variant="quiet" onClick={onRestoreAll}>
            Back to {colourway.name} throughout
          </Button>
        </p>
      )}

      {picking && chosen && (
        <YarnPicker
          open
          label={nameFor(chosen.slots)}
          current={chosen.yarn}
          suggest={colourway.wool}
          onChoose={(choice) => onChange(chosen.slots, choice)}
          onClose={() => setPicking(undefined)}
        />
      )}
    </>
  );
};

export default WoolList;
