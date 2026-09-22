import React, { useState } from "react";
import { SlotId } from "../data/hats/types";
import { inkOn, yarnFor, type Overrides, type Palette } from "../knitting/palette";
import YarnPicker, { type Chosen } from "./YarnPicker";
import "./YarnEditor.css";

/**
 * Every yarn of a hat, and a way to change each one.
 *
 * A row per yarn, because the yarns are what a knitter has in front of them:
 * six balls on the table, and the question is which of them is C. The first
 * try at this hung the whole thing off the letters beside the shopping list,
 * which looked like labels rather than buttons and were the size of a letter,
 * so on a phone the only yarn anybody could find a way to change was the
 * first one.
 *
 * Shown against the colourway's own yarns rather than the pattern's, because
 * a hat drawn in parts can be offered in a colourway that uses fewer than the
 * pattern names - 2026's last two use four where the first two use six - and
 * a row for a yarn that colourway has not got has nothing to say.
 */
interface YarnEditorProps {
  slots: SlotId[];
  palette: Palette;
  overrides: Overrides;
  onChange: (slot: SlotId, chosen: Chosen | undefined) => void;
  /** Which of the library's yarns to open the picker on. */
  suggest?: string;
}

const YarnEditor: React.FC<YarnEditorProps> = ({
  slots,
  palette,
  overrides,
  onChange,
  suggest,
}) => {
  const [picking, setPicking] = useState<SlotId | undefined>();

  return (
    <>
      <ul className="yarn-editor">
        {slots.map((slot) => {
          const yarn = yarnFor(palette, slot);
          return (
            <li key={slot}>
              <button
                type="button"
                className="yarn-editor-row"
                onClick={() => setPicking(slot)}
              >
                <span
                  className="shade-chip"
                  style={{ background: yarn.hex, color: inkOn(yarn.hex) }}
                >
                  {slot}
                </span>
                <span className="yarn-editor-name">
                  <strong>{yarn.name}</strong>
                  {yarn.code ? ` (${yarn.code})` : ""}
                  {yarn.approximate && <span className="quiet"> · approximate</span>}
                  {overrides[slot] && <span className="quiet"> · yours</span>}
                </span>
                <span className="yarn-editor-change">Change</span>
              </button>
            </li>
          );
        })}
      </ul>

      {picking && (
        <YarnPicker
          open
          slot={picking}
          current={yarnFor(palette, picking)}
          suggest={suggest}
          onChoose={(chosen) => onChange(picking, chosen)}
          onClose={() => setPicking(undefined)}
        />
      )}
    </>
  );
};

export default YarnEditor;
