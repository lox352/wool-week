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

The hat is settled under a physics simulation, as on the two sibling sites:
every stitch is a rigid body and every link between stitches a rope joint, and
the world is stepped until the tube relaxes into a hat. It is not done in
anyone's browser, though. A hat's shape depends only on its pattern, and these
patterns are fixed, so every knitter's copy of a given hat settles to the same
shape: `scripts/settle-hats.mjs` works it out once, offline, and the answer is
committed. Doing it in the browser cost 245MB of heap and ended Safari tabs on
iOS, for a result that is the same for everybody.

The settings are the sibling sites' defaults, unchanged. Measured against the
alternatives in `scripts/bench.mjs`, nothing beat them by enough to be worth
diverging for on a job that runs once per hat and takes about a minute.

### What "settled" means here

Worth knowing, because it is not quite what the word implies. These crowns
decrease far faster than the sibling sites' generated ones - the Aal Ower
Toorie takes 162 stitches to 9 in sixteen rounds, which sends about 26 units of
fabric to cover about 49 units of radius. `npm run bench -- --geometry` reports
that as short by 1.9x, and it is: no arrangement of inextensible yarn closes
that crown.

Real knitting resolves it by stretching - the pattern draws the crown together
with a yarn tail and has you block the hat over a bowl - and the solver
resolves it by reaching a standstill with some of that stretch unresolved. So
the hat comes to rest, but a handful of joints at the crown stay longer than a
stitch is supposed to be. That is the right answer for this shape; it is just
not the same as every constraint being satisfied. `ropes: "derived"` in
`src/ChainModel/tuning.ts` is the alternative, which lets those joints start at
whatever length the pattern already gives them; it settles too, a little
slower, and is there to be compared against.

## The bench

`npm run bench` exists so none of the above has to be argued about.

```sh
npm run bench                       # the standard set of settle runs
npm run bench -- --geometry         # can this hat settle at all?
npm run bench -- --render           # frame times and memory
npm run bench -- --set iterations=8 --set ropes=fixed
```

It drives the site's own physics in a real browser rather than reimplementing
anything, with every dial in `tuning.ts` settable from the query string, so
what it reports is what the site would do. One caveat on reading it: there is
no GPU behind headless Chromium, so `--render` frame times are software
rasterised. Use them to compare two builds, never as a guess at what a phone
will do. The settle numbers are all CPU and are honest.

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
