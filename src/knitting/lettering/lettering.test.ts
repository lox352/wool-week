import { describe, expect, it } from "vitest";
import { hatById } from "../../data/hats";
import { buildHat } from "../engine";
import { fromChart, glyphHeight, glyphs } from "./font";
import { Column, fitLettering, floatExcess, longestFloat } from "./fit";
import { withLettering } from "./apply";

const birsie = hatById("sww26-birsie-beanny")!;
const brim = birsie.charts.find((chart) => chart.id === "Brim")!;
const round = brim.rows[0].length;

/** The printed lettering: rows 4 to 12, as worn. */
const printed: Column[] = Array.from({ length: round }, (_, x) =>
  Array.from({ length: glyphHeight }, (_, y) => brim.rows[3 + y][x].slot === "motif"),
);

const text = (columns: Column[]) =>
  Array.from({ length: glyphHeight }, (_, y) => columns.map((col) => (col[y] ? "#" : ".")).join(""));

describe("the brim typeface", () => {
  it("has the pattern's own letters exactly, as its chart draws them", () => {
    // Split the printed band where every row is ground, and it spells itself.
    const spans: [number, number][] = [];
    let start: number | undefined;
    printed.forEach((col, x) => {
      if (col.some(Boolean)) start ??= x;
      else if (start !== undefined) {
        spans.push([start, x]);
        start = undefined;
      }
    });
    const spelled = [..."♥2026♥SHETLANDWOOLWEEK"];
    expect(spans).toHaveLength(spelled.length);
    spans.forEach(([from, to], i) =>
      expect(text(printed.slice(from, to))).toEqual(glyphs[spelled[i]]),
    );
    expect([...new Set(spelled)].sort()).toEqual([...fromChart].sort());
  });

  it("draws every glyph nine rows tall, every row one width", () => {
    Object.entries(glyphs).forEach(([character, rows]) => {
      expect(rows, character).toHaveLength(glyphHeight);
      rows.forEach((row) => expect(row.length, character).toBe(rows[0].length));
    });
  });
});

describe("fitting words round the brim", () => {
  const corpus = [
    "SHETLAND WOOL WEEK 2026",
    "HAPPY BIRTHDAY MUM",
    "MERRY CHRISTMAS 2026",
    "KNITTED WITH LOVE BY NAN",
    "THE QUICK BROWN FOX JUMPS OVER",
    "GRANNY'S HAT",
    "IT'S A HAT.",
    "HELLO!",
    "UP HELLY AA",
    "LERWICK",
    "ISLA",
    "I",
    "J J J J",
    "WWWWWWWWWWWWWWWWWWWW",
    "0123456789",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "BORN 1963",
    "QUEEN OF THE KNITS",
    "ZOE",
    "FIVE 9S",
    "JAZZ",
    "SIXTY 7",
    "OLIVIA",
    "MUCKLE ROE",
    "FAIR ISLE 1921",
    "YELL",
    "PAPA'S",
  ];

  it.each(corpus)("fills the round exactly, with no float over %s's limit", (words) => {
    const fit = fitLettering(words, round);
    expect(fit.ok).toBe(true);
    if (!fit.ok) return;
    expect(fit.columns).toHaveLength(round);
    expect(floatExcess(fit.columns)).toBe(0);
  });

  it("repeats short words round the brim", () => {
    const fit = fitLettering("Isla", round);
    expect(fit.ok && fit.copies).toBeGreaterThan(1);
  });

  it("puts hearts between the words of a middling phrase", () => {
    const fit = fitLettering("Happy birthday Mum", round);
    expect(fit.ok && fit.copies).toBe(1);
    expect(fit.ok && fit.heartsBetweenWords).toBe(true);
  });

  it("measures its floats round the join, in both yarns", () => {
    const stripe = (on: number) => Array.from({ length: round }, (_, x) =>
      Array.from({ length: glyphHeight }, () => x < on));
    expect(floatExcess(stripe(longestFloat))).toBeGreaterThan(0);
    // Alternate stitches float nothing at all.
    const check = Array.from({ length: round }, (_, x) =>
      Array.from({ length: glyphHeight }, () => x % 2 === 0));
    expect(floatExcess(check)).toBe(0);
  });

  it("says what it cannot do, and why", () => {
    expect(fitLettering("   ", round)).toEqual({ ok: false, reason: "empty" });
    expect(fitLettering("Café & co", round)).toEqual({ ok: false, reason: "unknown", characters: ["É", "&"] });
    const long = fitLettering("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", round);
    expect(long.ok === false && long.reason).toBe("too-long");
    // The pattern's 6 is open four stitches at its top right, and a J three
    // at its top left: together they float eight, however they are spaced.
    expect(fitLettering("6J", round)).toEqual({ ok: false, reason: "unknittable" });
  });

  it("takes a heart typed as <3", () => {
    const typed = fitLettering("I <3 WOOL", round);
    const symbol = fitLettering("I ♥ WOOL", round);
    expect(typed).toEqual(symbol);
  });
});

describe("a Birsie Beanny with its own words", () => {
  const stock = buildHat(birsie, "medium");

  it("changes which yarn the lettering is in and nothing else", () => {
    const own = buildHat(withLettering(birsie, "Happy birthday Mum"), "medium");
    expect(own.stitches).toHaveLength(stock.stitches.length);
    expect(own.rounds).toEqual(stock.rounds);
    own.stitches.forEach((stitch, i) => expect(stitch.type).toBe(stock.stitches[i].type));
    const changed = new Set(
      own.stitches
        .filter((stitch, i) => stitch.slot !== stock.stitches[i].slot)
        .map((stitch) => own.roundLabels[own.rounds.findIndex((r) => r.includes(stitch.id))]),
    );
    expect(changed.size).toBeGreaterThan(0);
    changed.forEach((label) => expect(label).toMatch(/^Chart Brim, row ([4-9]|1[0-2])$/));
  });

  it("reads the right way round once the brim is turned up", () => {
    // As engine.test.ts reads the printed brim: rows down from the cast-on
    // edge, each round read back, since its first stitch is on the right.
    const own = withLettering(birsie, "Happy birthday Mum");
    const { stitches, rounds, roundLabels } = buildHat(own, "medium");
    const fit = fitLettering("Happy birthday Mum", round);
    if (!fit.ok) throw new Error("did not fit");
    for (let y = 0; y < glyphHeight; y++) {
      const worn = [...rounds[roundLabels.indexOf(`Chart Brim, row ${4 + y}`)]]
        .reverse()
        .map((id) => stitches[id].slot.endsWith(":motif"));
      expect(worn).toEqual(fit.columns.map((col) => col[y]));
    }
  });

  it("is the pattern as printed without words, or with words that will not fit", () => {
    expect(withLettering(birsie, undefined)).toBe(birsie);
    expect(withLettering(birsie, "  ")).toBe(birsie);
    expect(withLettering(birsie, "6J")).toBe(birsie);
  });

  it("is the same pattern for the same words, however they are typed", () => {
    expect(withLettering(birsie, "happy  birthday mum")).toBe(withLettering(birsie, "HAPPY BIRTHDAY MUM"));
  });
});
