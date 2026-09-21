# Wool Week Toories

A progress tracker for the Shetland Wool Week hats. Pick a year, pick your
wool, and watch the hat come up stitch by stitch as you knit it.

**Unofficial.** These patterns are sold to fund Shetland Wool Week and the
designs belong to their designers. This is a companion for someone who has
bought one, not a substitute for buying it. The site carries a `noindex` tag
and a `robots.txt` disallow, and every hat page links to where the pattern is
sold. See [PATTERNS.md](PATTERNS.md) for where the chart data came from and
how to remove a year.

## What it does

- **A chart that knows where you are.** The whole round, not one repeat, with
  the stitch you are on marked and the chart scrolling to follow you.
- **The hat in three dimensions**, with the wool filling in as you work. What
  you have knitted is in colour; what is ahead is pale.
- **Colourways from the patterns themselves.** Each hat is stored once in yarn
  slots, and a colourway says which real shade goes in each - which is exactly
  how the patterns are written. Any shade can be overridden with the wool
  actually in your hands.
- **A knitting mode** built for someone holding needles: the round, the stitch
  within it, and how many of this colour before you change.

## Where it came from

It reuses the machinery behind [hats.whichlooklike.earth][earth] and
[hats.whichlooklike.space][space] — the knitting machine, the physics, the
chart grid, the row counter — but the input is different. Those sites generate
a design from a globe or a sky. Here the design is already fixed by a
designer, so the new part is an engine that replays a published pattern:

```
a pattern, round by round  ->  Knitter  ->  Stitch[] + rounds
                                              |
              the chart, the hat, the row counter, the knitting panel
```

Everything downstream only ever wanted a list of stitches and the rounds they
fall in, which is why a hat charted from a sky and a hat charted from a 1930s
Fair Isle graph book can share all of it.

[earth]: https://hats.whichlooklike.earth
[space]: https://hats.whichlooklike.space

## Adding a year

One file, one line. See [PATTERNS.md](PATTERNS.md) for the full walk-through,
but in short:

1. Run `scripts/extract_chart.py` over the pattern's chart page to get a
   `*.charts.json`.
2. Write `src/data/hats/<id>.ts` describing its sizes, colourways and rounds.
3. Add it to the list in `src/data/hats/index.ts`.

The test suite then checks the new hat replays to every stitch count its
pattern prints. If it does not, the build fails rather than shipping a chart
that would mislead someone.

## Running it

```sh
npm install
npm run dev      # http://localhost:5173/wool-week/
npm test         # the reconciliation suite
npm run lint
npm run build
```

## A note on the physics

The two sibling sites settle their hats under a physics simulation, and this
one inherited the machinery. It does not use it: the code is only reachable
from `scripts/settle-hats.mjs`, and nothing ships settled positions.

At these stitch counts it does not work. Ten thousand stitches is ten thousand
rigid bodies and twenty-five thousand rope joints, a single step of which takes
a second or two, and coming to rest needs hundreds of steps. In the browser it
cost 245MB of heap and ended Safari tabs on iOS without ever finishing; run
offline with no time limit it had still not converged after forty minutes.

So the hat is drawn from the geometry the pattern is built with: a tube of the
right circumference, rising by a round's height each round, pulling in over the
crown by as much as the fabric can reach. That is exact rather than
approximate, it costs nothing, and it is what every picture of this site has
ever actually shown.

Relaxed fabric would need a different approach - settling a coarse proxy and
interpolating, or relaxing the mesh analytically - rather than making this one
faster. The physics path could reasonably be deleted.

## Deploying

Pushing builds, tests and publishes the built site to the `gh-pages` branch.

### Turning Pages on

The workflow can publish the branch but cannot enable Pages itself, so the
first time round that is one manual step: **Settings → Pages → Source:
"Deploy from a branch" → `gh-pages` / `(root)`**. After that every push
deploys on its own.

### A custom domain

The site is built with `base: "/wool-week/"` in `vite.config.ts`, which is
what a project page at `lox352.github.io/wool-week/` needs. Serving it from a
domain of its own means changing that to `"/"` and updating the three
absolute paths that match it: the favicon and font links in `index.html`, the
`src:` urls in `public/fonts/fonts.css`, and the redirect in
`public/404.html`.
