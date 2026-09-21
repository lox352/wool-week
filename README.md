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
shape: `scripts/settle-hats.mjs` works it out once and the answer is committed.

Getting that to work at all took finding out why it did not. With the sibling
sites' settings these hats never came to rest - not in a browser, where it cost
245MB of heap and ended Safari tabs on iOS, and not offline either, where it
was still going after forty minutes.

It is not the size. Earth's default hat is bigger than these - 12,342 stitches
and 24,676 joints against 10,170 and 20,330 - and settles fine. Nor is it that
our starting geometry has joints already longer than the yarn allows; it does,
but earth's has more of them (12% of its joints against 5.6% of ours, worst
case 4.99x against 6.43x) and settles anyway. An over-stretched joint is not a
problem in itself, because the fabric can rearrange until it is satisfied.

The difference is that these crowns are **unsatisfiable**, not merely
stretched. The Aal Ower Toorie takes 162 stitches to 9 in sixteen rounds, which
sends about 25 units of fabric to cover about 49 units of radius. No
arrangement of inextensible yarn closes that, so the solver was not converging
slowly - it could not converge at all, and motion plateaued around 2.3. Earth
never meets this because its hemispherical decrease spreads the same shaping
over about forty rows.

Real knitting resolves it by stretching, and the pattern says as much: the
crown is drawn together with a yarn tail and the hat is blocked over a bowl. So
the model lets a joint be as long as the pattern's own geometry already makes
it (`ropes: "derived"` in `src/ChainModel/tuning.ts`), which is what a stretched
crown means, and reduces to the fixed length wherever the fabric does reach.
The hat then settles in about ninety seconds, with each step running several
times faster because the solver is no longer fighting an impossible constraint.

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
