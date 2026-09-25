import React, { RefObject, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlotId } from "../data/hats/types";
import { Palette } from "../knitting/palette";
import BodyStrip from "./BodyStrip";
import { Stitch } from "../types/Stitch";
import "./ColourPreview.css";

/**
 * The ways of seeing a colour choice while making it, for comparing side by
 * side: "?preview=banner", "sticky", "picker" or "swatches".
 */
export type PreviewVariant = "none" | "banner" | "sticky" | "picker" | "swatches";

export const usePreviewVariant = (): PreviewVariant => {
  const [params] = useSearchParams();
  const asked = params.get("preview");
  return asked === "banner" ||
    asked === "sticky" ||
    asked === "picker" ||
    asked === "swatches"
    ? asked
    : "none";
};

/** Whether an element is on screen at all. */
const useOnScreen = (ref: RefObject<Element>) => {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return on;
};

/**
 * A strip of the body chart, in the wool being chosen, that slides down from
 * the top of the screen once the hat has scrolled away - and back up once
 * the choosing is over - so a change further down the page is never made
 * blind.
 */
export const PreviewBanner: React.FC<{
  body: Body;
  palette: Palette;
  /** The 3D hat: the banner stands in for it once it is out of sight. */
  stage: RefObject<Element>;
  /** The colour choices: the banner is only wanted while they are. */
  choices: RefObject<Element>;
}> = ({ body, palette, stage, choices }) => {
  const stageOn = useOnScreen(stage);
  const choosing = useOnScreen(choices);
  const shown = !stageOn && choosing;
  return (
    <div className={`preview-banner${shown ? " is-shown" : ""}`} aria-hidden="true">
      <BodyStrip {...body} palette={palette} />
    </div>
  );
};

/** The knitting a preview is drawn from. */
export interface Body {
  stitches: Stitch[];
  rounds: number[][];
}

/**
 * What the wool list shows while choosing, for the variants that show
 * anything there: the hat's body in the picker (C), or each ball's part in
 * it beside the ball (D).
 */
export const colourPreviews = (
  variant: PreviewVariant,
  body: Body,
  palette: Palette,
): {
  rowPreview?: (slots: SlotId[]) => React.ReactNode;
  pickerPreview?: (slots: SlotId[]) => React.ReactNode;
} =>
  variant === "picker"
    ? {
        pickerPreview: () => (
          <BodyStrip {...body} palette={palette} className="picker-preview" />
        ),
      }
    : variant === "swatches"
      ? {
          rowPreview: (slots) => (
            <BodyStrip
              {...body}
              palette={palette}
              highlight={slots}
              className="wool-row-motif"
            />
          ),
        }
      : {};
