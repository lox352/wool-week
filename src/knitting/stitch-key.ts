import { Stitch } from "../types/Stitch";
import { StitchType } from "../types/StitchType";
import type { StitchKeyId, StitchNote } from "../data/hats/types";

/**
 * The symbol key, worked out from the stitches a hat actually uses.
 *
 * Built from the knitting rather than from a fixed list, so a hat is only
 * ever told about the stitches it has, and in the terms that fit it: a KFB
 * is one entry for both of the loops it makes, and "make one" is only
 * listed where a make-one is picked up on its own between two stitches.
 */
export interface KeyEntry {
  id: StitchKeyId;
  /** The stitch whose mark the key draws. */
  type: StitchType;
  /** As a pattern abbreviates it. */
  abbreviation?: string;
  label: string;
  /** How to work it, in a sentence or two. */
  how: string;
  /** Anything this particular pattern says about it. */
  note?: string;
}

const standard: Record<StitchKeyId, Omit<KeyEntry, "note">> = {
  k1: {
    id: "k1",
    type: "k1",
    label: "Knit",
    how: "A plain cell: knit the stitch in the colour shown.",
  },
  p1: {
    id: "p1",
    type: "p1",
    abbreviation: "p",
    label: "Purl",
    how: "Bring the yarn to the front and purl the stitch.",
  },
  k1tbl: {
    id: "k1tbl",
    type: "k1tbl",
    abbreviation: "k tbl",
    label: "Knit through the back loop",
    how: "Put the needle into the back leg of the stitch and knit it, which twists it.",
  },
  kfb: {
    id: "kfb",
    type: "kfb",
    abbreviation: "KFB",
    label: "Knit front and back",
    how:
      "Knit into the stitch but leave it on the left needle, then knit into " +
      "the back of the same stitch and slip it off. One stitch becomes two, " +
      "the new one to its left; the pair is one instruction.",
  },
  m1: {
    id: "m1",
    type: "m1",
    abbreviation: "m1",
    label: "Make one",
    how:
      "With the left needle, lift the strand between the stitch just worked " +
      "and the next from front to back, and knit it through the back loop. " +
      "A new stitch between two, with none below it.",
  },
  k2tog: {
    id: "k2tog",
    type: "k2tog",
    abbreviation: "k2tog",
    label: "Knit two together",
    how: "Knit the next two stitches together as one. Leans to the right.",
  },
  k2togtbl: {
    id: "k2togtbl",
    type: "k2togtbl",
    abbreviation: "k2tog tbl",
    label: "Knit two together through the back loops",
    how: "Knit the next two stitches together through their back legs. Leans to the left.",
  },
  s2kp: {
    id: "s2kp",
    type: "s2kp",
    abbreviation: "s2kp",
    label: "Centred double decrease",
    how:
      "Slip two together as if to knit, knit one, then pass the two slipped " +
      "stitches over. Three become one, with the middle stitch on top.",
  },
  sk2p: {
    id: "sk2p",
    type: "sk2p",
    abbreviation: "sk2p",
    label: "Left-leaning double decrease",
    how:
      "Slip one, knit two together, then pass the slipped stitch over. " +
      "Three become one, leaning to the left.",
  },
};

const order: StitchKeyId[] = ["k1", "p1", "k1tbl", "kfb", "m1", "k2tog", "k2togtbl", "s2kp", "sk2p"];

/** Whether an m1 is the second loop of the KFB just before it. */
export const pairedWithKfb = (stitches: Stitch[], index: number): boolean =>
  stitches[index]?.type === "m1" && stitches[index - 1]?.type === "kfb";

export const stitchKey = (
  stitches: Stitch[],
  notes: Partial<Record<StitchKeyId, StitchNote>> = {},
): KeyEntry[] => {
  const used = new Set<StitchKeyId>();
  stitches.forEach((stitch, index) => {
    if (stitch.id <= 0 || stitch.type === "join") return;
    if (stitch.type === "m1" && pairedWithKfb(stitches, index)) return;
    used.add(stitch.type);
  });
  return order
    .filter((id) => used.has(id))
    .map((id) => {
      const note = notes[id];
      return {
        ...standard[id],
        abbreviation: note?.abbreviation ?? standard[id].abbreviation,
        label: note?.label ?? standard[id].label,
        how: note?.how ?? standard[id].how,
        note: note?.note,
      };
    });
};
