import React, { useEffect, useMemo, useState } from "react";
import { Stitch } from "../types/Stitch";
import { Palette } from "../knitting/palette";
import { stitchKey } from "../knitting/stitch-key";
import { Swatch } from "../knitting/ChartHelp";
import { FullKey } from "./KnittingPanel";
import type { StitchKeyId, StitchNote } from "../data/hats/types";

type Notes = Partial<Record<StitchKeyId, StitchNote>>;

/**
 * Trial B: the key as a rail across the top of the chart while you knit.
 *
 * Every symbol this hat uses, and its yarns, small enough to stay up the whole
 * time. The stitch you are working lights up and says how it is done; any
 * other can be tapped to read it, and tapped again to go back.
 */
export const KeyRail: React.FC<{
  stitches: Stitch[];
  palette: Palette;
  notes?: Notes;
  current?: string;
}> = ({ stitches, palette, notes, current }) => {
  const entries = useMemo(() => stitchKey(stitches, notes), [stitches, notes]);
  const [chosen, setChosen] = useState<string>();
  const shown = chosen ?? (current !== "k1" ? current : undefined);
  const entry = entries.find((e) => e.id === shown);
  const yarns = Object.entries(palette).filter(
    ([, yarn], i, all) => all.findIndex(([, other]) => other.name === yarn.name && other.hex === yarn.hex) === i,
  );
  return (
    <div className="key-rail">
      <ul className="key-rail-chips">
        {entries.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              className={`key-chip${e.id === shown ? " key-chip-on" : ""}${e.id === current ? " key-chip-now" : ""}`}
              aria-pressed={e.id === shown}
              onClick={() => setChosen(chosen === e.id ? undefined : e.id)}
            >
              <Swatch entry={e} />
              {e.abbreviation ?? e.label}
            </button>
          </li>
        ))}
        {yarns.map(([slot, yarn]) => (
          <li key={slot} className="key-rail-yarn" title={yarn.name}>
            <span className="swatch" style={{ background: yarn.hex }} />
            {slot}
          </li>
        ))}
      </ul>
      {entry && (
        <p className="key-rail-how">
          <strong>{entry.label}.</strong> {entry.how}
          {entry.note && <span className="stitch-note"> {entry.note}</span>}
        </p>
      )}
    </div>
  );
};

/** Trial A: the whole key in a sheet over the lower part of the screen. */
export const KeySheet: React.FC<{
  stitches: Stitch[];
  palette: Palette;
  notes?: Notes;
  current?: string;
  onClose: () => void;
}> = ({ stitches, palette, notes, current, onClose }) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="key-sheet" role="dialog" aria-label="Key">
      <div className="key-sheet-head">
        <strong>Key</strong>
        <button type="button" className="key-sheet-close" aria-label="Close the key" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="key-sheet-body">
        <FullKey stitches={stitches} palette={palette} notes={notes} current={current} />
      </div>
    </div>
  );
};
