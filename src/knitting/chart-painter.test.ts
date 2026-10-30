import { describe, expect, it } from "vitest";
import { hatById } from "../data/hats";
import { hatStitches } from "./useHat";
import { layOut, mirrorLayout } from "./layout";
import { numberedRounds, sceneOf } from "./chart-scene";
import { type Ctx2D, type PaintState, defaultColours, laidOutPlaces, laidOutRows, markerRowsChanging, paintRegion } from "./chart-painter";
import { LiveColumns, mapOf, placeFrom } from "./column-window";
import { joinIn, needleChangesIn, turnsInside } from "./chart-marks";
import { mirrorLines, startOfRound } from "./markers";
import type { Palette } from "./palette";
import { isFabric } from "../types/Stitch";

/**
 * A stand-in for a canvas that keeps what is drawn: each filled rectangle
 * with the colour and alpha it was filled in, each path's points, and each
 * stroke, clipped to the region painted as a canvas would be.
 */
const recorder = () => {
  const rects: { x: number; y: number; w: number; h: number; fill: string; alpha: number; path: boolean }[] = [];
  const strokes: { points: number[][]; colour: string; width: number }[] = [];
  const texts: { text: string; x: number; y: number }[] = [];
  let path: { kind: "rect"; x: number; y: number; w: number; h: number }[] = [];
  let points: number[][] = [];
  let current: number[] = [];
  const state = { fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1 };
  const stack: (typeof state)[] = [];
  const ctx = {
    ...state,
    save() {
      stack.push({ fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, globalAlpha: this.globalAlpha });
    },
    restore() {
      Object.assign(this, stack.pop());
    },
    beginPath() {
      path = [];
      points = [];
      current = [];
    },
    rect(x: number, y: number, w: number, h: number) {
      path.push({ kind: "rect", x, y, w, h });
    },
    moveTo(x: number, y: number) {
      current = [x, y];
      points.push(current);
    },
    lineTo(x: number, y: number) {
      current.push(x, y);
    },
    arc() {},
    closePath() {},
    clip() {},
    fill() {
      for (const one of path) rects.push({ x: one.x, y: one.y, w: one.w, h: one.h, fill: String(this.fillStyle), alpha: this.globalAlpha, path: true });
    },
    stroke() {
      strokes.push({ points: points.map((run) => [...run]), colour: String(this.strokeStyle), width: this.lineWidth });
    },
    fillRect(x: number, y: number, w: number, h: number) {
      rects.push({ x, y, w, h, fill: String(this.fillStyle), alpha: this.globalAlpha, path: false });
    },
    fillText(text: string, x: number, y: number) {
      texts.push({ text, x, y });
    },
    setLineDash() {},
    lineCap: "round",
    lineJoin: "round",
    font: "",
    textAlign: "left",
    textBaseline: "middle",
  };
  return { ctx: ctx as unknown as Ctx2D, rects, strokes, texts };
};

const cell = 10;

/** A hat laid out, and every one of its yarns a colour of its own, none of them the chart's. */
const hat = (id: string, size?: string) => {
  const built = hatStitches(hatById(id)!, size);
  const layout = layOut(built.stitches, built.rounds, built.turns);
  const slots = [...new Set(built.stitches.map((stitch) => stitch.slot))];
  const palette = Object.fromEntries(
    slots.map((slot, k) => [slot, { name: slot, hex: `#${(0x102030 + k * 0x010203).toString(16)}` }]),
  ) as unknown as Palette;
  const yarns = new Set(Object.values(palette).map((yarn) => yarn.hex));
  return { built, layout, palette, yarns };
};

const stateFor = (layout: { columns: number; rounds: number }, palette: Palette, extra: Partial<PaintState> = {}): PaintState => ({
  cell,
  ...laidOutPlaces(layout.columns, cell),
  ...laidOutRows(layout.rounds, cell),
  palette,
  progress: 0,
  hatch: [],
  colours: defaultColours,
  ratio: 1,
  ...extra,
});

/** Where the columns go with rounds first to last in view, closed up. */
const closedUp = (scene: ReturnType<typeof sceneOf>, first: number, last: number) => {
  const live = new LiveColumns(scene.index);
  live.moveTo(first, last);
  const map = mapOf(live);
  const left = placeFrom(map, map.order[0], 0, cell);
  const width = new Float64Array(left.length);
  for (let c = 1; c < width.length - 1; c++) width[c] = map.shows[c] ? cell : 0;
  return { map, left, width };
};

describe("the chart painted a piece at a time", () => {
  // A rib narrower than the body above it, and a crown.
  const { built, layout, palette, yarns } = hat("sww25-aal-ower-toorie", "medium");
  const scene = sceneOf(layout, built.stitches, built.rounds);
  const whole = { x: 0, y: 0, width: layout.columns * cell + 40, height: layout.rounds * cell };
  const veiled = (progress: number) => {
    const paint = recorder();
    paintRegion(paint.ctx, whole, scene, stateFor(layout, palette, { progress }));
    return paint.rects.filter((one) => one.fill === defaultColours.paper && one.alpha === 0.62);
  };

  it("veils the knitting done, every stitch worked and no more", () => {
    expect(veiled(0)).toHaveLength(0);
    for (const progress of [built.rounds[1][40], built.rounds[30].at(-1)!, built.rounds.at(-1)!.at(-1)!]) {
      const area = veiled(progress).reduce((sum, one) => sum + one.w * one.h, 0);
      const done = [...layout.cells.keys()].filter((id) => id <= progress).length;
      expect(area, `at ${progress}`).toBe(done * cell * cell);
    }
  });

  it("veils a round worked all the way across in one rectangle", () => {
    const full = built.rounds.findIndex((round) => round.length === layout.columns);
    const before = veiled(built.rounds[full - 1].at(-1)!).length;
    expect(veiled(built.rounds[full].at(-1)!).length).toBe(before + 1);
  });

  it("fills a run of one yarn along a round as one rectangle, and every stitch somewhere", () => {
    const paint = recorder();
    paintRegion(paint.ctx, whole, scene, stateFor(layout, palette));
    const yarn = paint.rects.filter((one) => !one.path && yarns.has(one.fill));
    const area = yarn.reduce((sum, one) => sum + one.w * one.h, 0);
    const drawn = built.rounds.flat().filter((id) => isFabric(built.stitches[id])).length;
    expect(area).toBe(drawn * cell * cell);
    // Rounds in one yarn all the way across are one run each.
    expect(yarn.filter((one) => one.w === layout.columns * cell).length).toBeGreaterThan(0);
  });

  it("paints the same whether a region is painted at once or as four tiles", () => {
    const fills = (rects: ReturnType<typeof recorder>["rects"], region: { x: number; y: number; width: number; height: number }) =>
      rects
        .filter((one) => !one.path && one.fill.startsWith("#") && one.fill !== defaultColours.ground)
        .flatMap((one) => {
          // Clipped to the region, as a canvas would.
          const x0 = Math.max(one.x, region.x);
          const x1 = Math.min(one.x + one.w, region.x + region.width);
          const y0 = Math.max(one.y, region.y);
          const y1 = Math.min(one.y + one.h, region.y + region.height);
          const out: string[] = [];
          for (let x = x0; x < x1; x += cell / 2) for (let y = y0; y < y1; y += cell / 2) out.push(`${x}|${y}|${one.fill}`);
          return out;
        });
    const once = recorder();
    paintRegion(once.ctx, whole, scene, stateFor(layout, palette));
    const tiles: string[] = [];
    const halfW = Math.ceil(whole.width / 2 / cell) * cell;
    const halfH = Math.ceil(whole.height / 2 / cell) * cell;
    for (const [x, y] of [[0, 0], [halfW, 0], [0, halfH], [halfW, halfH]]) {
      const region = { x, y, width: halfW, height: halfH };
      const paint = recorder();
      paintRegion(paint.ctx, region, scene, stateFor(layout, palette));
      tiles.push(...fills(paint.rects, region));
    }
    expect(new Set(tiles)).toEqual(new Set(fills(once.rects, whole)));
  });

  it("paints the brim's stitches side by side with only the brim in view, with no gap between them", () => {
    const { map, left, width } = closedUp(scene, 1, 2);
    expect(map.count).toBe(built.rounds[0].length);
    const paint = recorder();
    paintRegion(paint.ctx, { x: 0, y: (layout.rounds - 2) * cell, width: map.count * cell, height: 2 * cell }, scene, stateFor(layout, palette, { left, width }));
    const round1 = paint.rects.filter((one) => !one.path && yarns.has(one.fill) && one.y === (layout.rounds - 1) * cell);
    // The cast-on, in one yarn: one run across every column showing.
    expect(round1).toEqual([expect.objectContaining({ x: 0, w: map.count * cell })]);
  });

  it("draws a heavy line only between two showing columns that are neighbours on the chart as well", () => {
    const { map, left, width } = closedUp(scene, 1, 2);
    const paint = recorder();
    paintRegion(paint.ctx, { x: 0, y: (layout.rounds - 1) * cell, width: map.count * cell, height: cell }, scene, stateFor(layout, palette, { left, width }));
    const heavyDown = paint.rects.filter((one) => one.fill === defaultColours.heavy && one.h === cell);
    expect(heavyDown.length).toBeGreaterThan(0);
    for (const rule of heavyDown) {
      const x = rule.x + rule.w / 2;
      // The columns either side of it on screen.
      const leftOf = map.order[Math.round(x / cell) - 1];
      const rightOf = map.order[Math.round(x / cell)];
      if (leftOf !== undefined && rightOf !== undefined) {
        expect(leftOf).toBe(rightOf + 1);
        expect(rightOf % 5).toBe(0);
      }
    }
  });

  it("numbers every fifth round, the first and the last down the edge", () => {
    const paint = recorder();
    paintRegion(paint.ctx, whole, scene, stateFor(layout, palette));
    expect(paint.texts.map((one) => Number(one.text)).sort((a, b) => a - b)).toEqual(scene.numbered);
    expect(scene.numbered).toEqual([1, ...Array.from({ length: 14 }, (_, k) => 5 * (k + 1)), layout.rounds]);
  });

  it("lays a heat map over the stitches it tints, and a strip beside each round it is given for", () => {
    const tinted = new Set(built.rounds[10]);
    const overlay = {
      tint: (id: number) => (tinted.has(id) ? { fill: "#ff00ff", alpha: 0.9 } : undefined),
      strips: [{ round: 11, fill: "#00ffff" }],
    };
    const paint = recorder();
    paintRegion(paint.ctx, whole, scene, stateFor(layout, palette, { overlay }));
    const tints = paint.rects.filter((one) => one.fill === "#ff00ff");
    expect(tints).toHaveLength(tinted.size);
    for (const one of tints) expect(one.y).toBe((layout.rounds - 11) * cell);
    const strips = paint.rects.filter((one) => one.fill === "#00ffff");
    expect(strips).toEqual([expect.objectContaining({ x: layout.columns * cell + 1, y: (layout.rounds - 11) * cell, h: cell })]);
  });
});

describe("a fork across a KFB's two loops, its columns closed up", () => {
  const { built, layout } = hat("sww18-merrie-dancers-toorie", "yw1");
  const scene = sceneOf(layout, built.stitches, built.rounds);

  it("reaches from over the stitch below to the middle of each loop, wherever they are drawn", () => {
    const kfb = built.stitches.find((stitch) => stitch.type === "kfb")!.id;
    const row = scene.rowOf[kfb];
    // With only this round and the one below in view, the loops are side by side on screen.
    const { left, width } = closedUp(scene, row - 1, row);
    const centre = (c: number) => left[c] + width[c] / 2;
    const mark = scene.markOf(kfb, centre, cell)!;
    const x = left[scene.columnOf[kfb]];
    const ends = mark.strokes!.map((stroke) => stroke.map(([px]) => x + px * cell));
    const parent = built.stitches[kfb].links[0];
    // From the middle of the stitch below, to the middle of its own cell and of its second loop's.
    expect(ends[0][0]).toBeCloseTo(centre(scene.columnOf[parent]));
    expect(ends.map((arm) => arm[1]).sort((a, b) => a - b)).toEqual(
      [centre(scene.columnOf[kfb]), centre(scene.columnOf[kfb + 1])].sort((a, b) => a - b),
    );
  });
});

describe("the steps on the chart", () => {
  // Joined, the needles changed back and forth through its rib, and turned inside out after round 51.
  const { built, layout, palette } = hat("sww26-birsie-beanny", "medium");
  const join = joinIn(built.stitches, built.rounds)!;
  const needleRules = needleChangesIn(built.stitches, built.rounds).map((change) => change.after);
  const wraps = turnsInside(built.turns, layout.rounds);
  const scene = sceneOf(layout, built.stitches, built.rounds, { join, needleRules, wraps });
  const paint = recorder();
  paintRegion(paint.ctx, { x: -20, y: 0, width: layout.columns * cell + 60, height: layout.rounds * cell }, scene, stateFor(layout, palette));
  const yOf = (after: number) => (layout.rounds - after) * cell;
  const ys = (one: { points: number[][] }) => new Set(one.points.flatMap((run) => run.filter((_, k) => k % 2 === 1)));

  it("draws the join as the round going on past its last stitch and coming back in at the first of the next", () => {
    expect(join.after).toBe(1);
    const arrows = paint.strokes.filter((one) => one.width === 1.6 && one.colour === defaultColours.ink);
    expect(arrows).toHaveLength(1);
    // Two arrows, each a shaft and a head.
    expect(arrows[0].points).toHaveLength(4);
  });

  it("dashes a change of needles across the chart, between the rounds either side", () => {
    const dashed = paint.strokes.filter((one) => one.width === 2 && one.colour === defaultColours.piece);
    expect(dashed).toHaveLength(1);
    expect(ys(dashed[0])).toEqual(new Set(needleRules.map(yOf)));
  });

  it("rules the turn inside out across the chart in the marker's colour", () => {
    expect(wraps).toEqual([51]);
    const rules = paint.strokes.filter((one) => one.width === 2.5 && one.colour === defaultColours.marker);
    expect(rules).toHaveLength(1);
    expect(ys(rules[0])).toEqual(new Set([yOf(51)]));
    // Across the whole chart, as far as there is fabric either side of it.
    const xs = rules[0].points.flatMap((run) => [run[0], run[2]]);
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(layout.columns * cell);
  });

  it("numbers both rounds a turn or a change of needles falls between, so it can be named", () => {
    const numbers = numberedRounds(layout, wraps, needleRules);
    for (const after of [...wraps, ...needleRules]) {
      expect(numbers).toContain(after);
      expect(numbers).toContain(after + 1);
    }
    expect(numbers).toEqual([...new Set(numbers)].sort((a, b) => a - b));
  });
});

describe("the start of the round's marker on the chart", () => {
  const { built, layout, palette } = hat("sww25-aal-ower-toorie", "medium");
  const join = joinIn(built.stitches, built.rounds)!;
  const lines = startOfRound(built.stitches, built.rounds, layout, { after: join.after, step: join.last + 1 });
  const line = lines[0];
  const scene = sceneOf(layout, built.stitches, built.rounds, { markers: lines });
  const paintAt = (progress: number) => {
    const state = stateFor(layout, palette, { progress });
    const paint = recorder();
    paintRegion(paint.ctx, { x: 0, y: 0, width: layout.columns * cell + 40, height: layout.rounds * cell }, scene, state);
    const x = state.left[line.after];
    const rowOf = (row: number) => [x, state.top[row] + state.height[row], x, state.top[row]];
    const drawn = (colour: string, width: number) =>
      paint.strokes.filter((one) => one.colour === colour && one.width === width).flatMap((one) => one.points);
    return { rowOf, drawn };
  };

  it("runs up the chart's right-hand edge from the round after the join to the top, placed as it is joined", () => {
    expect(lines).toHaveLength(1);
    expect(line.atStart).toBe(true);
    expect(line.after).toBe(0);
    expect(line.placed).toBe(join.last + 1);
    expect(line.route.map((at) => at.row)).toEqual(Array.from({ length: layout.rounds - 1 }, (_, k) => k + 2));
    // Passed as each round begins: after the last stitch of the round before.
    expect(line.route[1].passed).toBe(built.rounds[1].at(-1));
  });

  it("is heavy beside the round being worked, grey below it and dashed above", () => {
    const [first, second, third] = line.route;
    const { rowOf, drawn } = paintAt(second.passed + 1);
    expect(drawn(defaultColours.marker, 3)).toEqual([rowOf(second.row)]);
    expect(drawn(defaultColours.ink, 2)).toContainEqual(rowOf(first.row));
    expect(drawn(defaultColours.marker, 2)).toContainEqual(rowOf(third.row));
    // Beginning the next round turns the row it is beside heavy instead.
    const changing = markerRowsChanging(scene, third.passed - 1, third.passed);
    expect(changing).toContain(second.row);
    expect(changing).toContain(third.row);
    expect(paintAt(third.passed).drawn(defaultColours.marker, 3)).toEqual([rowOf(third.row)]);
    // Working on within a round changes nothing about it.
    expect(markerRowsChanging(scene, third.passed + 1, third.passed + 2)).toEqual([]);
  });

  it("runs up the other edge for the rounds worked the other way, past a turn, and turns over with the chart", () => {
    const birsie = hat("sww26-birsie-beanny", "medium");
    const joined = joinIn(birsie.built.stitches, birsie.built.rounds)!;
    const both = startOfRound(birsie.built.stitches, birsie.built.rounds, birsie.layout, { after: joined.after, step: joined.last + 1 });
    const columns = birsie.layout.columns;
    // Laid out for the last stretch, worked leftwards: the first stretch runs rightwards, from the left edge.
    expect(both.map((one) => [one.from, one.to, one.after])).toEqual([
      [2, 51, columns],
      [52, birsie.layout.rounds, 0],
    ]);
    // Off once the turn is worked, where the second comes on.
    expect(both[0].off).toBe(both[1].placed);
    // Turned over, each is on the other edge.
    const turned = mirrorLines(both, columns);
    expect(turned.map((one) => one.after)).toEqual([0, columns]);
    expect(turned[0].route.every((row) => row.after === 0)).toBe(true);
    // As the turned-over chart has the first round's first stitch on its right.
    const first = birsie.built.rounds[1][0];
    expect(mirrorLayout(birsie.layout).cells.get(first)!.column).toBe(1);
  });
});
