# AGENTS.md

Guidance for coding agents working in this repository. Human-facing docs live
in [`README.md`](README.md).

## Setup commands

```sh
npm install
npm run dev      # Vite dev server
npm test         # Vitest: pure logic in src/lib
npm run build    # tsc -b (type-check) + production build to dist/
npm run lint     # ESLint (lint:fix auto-fixes almost everything)
npm run e2e      # Playwright: production build on desktop Chromium (~10 s)
npm run coverage # unit-test coverage report (text + coverage/index.html)
```

`npm run lint`, `npm test` and `npm run build` are the checks; run all three
before declaring work done (`npm run lint:fix` first). Run `npm run e2e` too
when touching components, canvas drawing or hit testing. CI
(`.github/workflows/ci.yml`) runs all of them on every pull request and
before every deploy.

### Tests

- **Unit (Vitest, `src/**/*.test.ts`)**: pure logic in the node environment.
  `src/lib/fixtures.test-utils.ts` picks sides by hexagon or vertex.
  `wiring.test.ts` checks every plan is buildable (each side once, runs
  chained, every break bridged by a jumper) and that random patterns get the
  minimum number of jumpers.
- **E2E (`e2e/*.spec.ts`)**: clicks the canvases at real side and vertex
  positions computed from `buildGrid()` (`e2e/helpers.ts`), and reads results
  through `data-testid`s.

## Architecture

Static React SPA on GitHub Pages; no backend.

- **`src/lib/grid.ts`** builds a honeycomb of `cols` × `rows` (1–8,
  `GRID_LIMITS`): hexagons, every side listed once, and the canvas extent
  (`width`/`height`, 620 × 520 for 4 × 4). **Vertex keys are lattice
  indices** (half hexagon widths by half sizes from `ORIGIN`), so
  neighbouring hexagons agree on shared corners without comparing floats,
  and a side keeps its key in every grid size. A side key is its two vertex
  keys, sorted. Saved designs store side keys: changing `ORIGIN`,
  `HEX_SIZE` or the key format breaks them.
- **`src/lib/wiring.ts`**: `junctions()` (sides per vertex) and
  `planWiring()`, which orders the selected sides into runs joined by
  jumpers. Runs start at odd junctions and follow Fleury's rule; see the
  comment there before changing it, and keep the random-pattern test passing.
- **`src/lib/parts.ts`**: strip specs (`STRIP`), print part counts and the
  bill of materials. Lengths are rounded to the centimetre before `ceil`.
- **`src/lib/covers.ts`**: transparent covers, one per side. Each end is
  cut `flat` (end cap), `point` (3-way) or mitred `left`/`right` (corner;
  the edge on the inside of the turn comes up short, relative to the side's
  a → b direction). `COVER_TYPES` is the fixed catalogue of the 10 shapes:
  turning a cover end for end swaps left and right (`reversed()`), but a
  cover can't be flipped, so mirror images are separate types. **Codes A–J
  name physical parts: never reorder or recode them.** `coverOutline()`
  is the one shape function for both the pattern canvas and the card icons.
- **`src/lib/dimensions.ts`**: overall size and jumper lengths. Canvas
  units become metres via `toMeters()` (one side = `grid.size` units =
  `sideLength` m). Sizes are between channel centre lines.
- **`src/lib/view.ts`**: schematic zoom/pan transform and its inverse for hit
  testing. **`src/lib/draw.ts`**: all canvas drawing, as plain functions.
- **`src/lib/design.ts`**: the persisted design (`hex-lights:design` in
  localStorage), including the grid size, validated against its grid on
  load (designs saved without a size are 4 × 4). Change it through
  `toggleSide()` and `resizeGrid()`, which drop sides that no longer fit and
  a power input no selected side touches.
- Both canvases draw in the grid's logical units, are sized with CSS
  (`canvasStyle()`), and are backed at their shown size times
  `devicePixelRatio` (`src/hooks/useCanvas.ts`). Lines and text are scaled by
  `uiScale()` so they stay readable when a big grid is shown small. Convert
  pointer positions with `toCanvas()` (and `toWorld()` on the schematic) and
  size hit areas with `hitTolerance()`.
- `src/hooks/useZoomPan.ts` attaches the wheel listener natively with
  `passive: false` (React's `onWheel` can't prevent page scroll) and swallows
  the click that ends a drag.

## Code style

Enforced by `eslint.config.js`:

- **Every `if`/`else`/`for`/`while` has braces**, with the body on its own line.
- **Blank lines between steps**: before every `return` (unless it is the
  first line of its block), after a group of `const`/`let`, and around
  multi-line `if`/`for`/`switch`/`try` blocks.
- 2-space indent, single quotes, no semicolons, trailing commas on multi-line
  literals, `(x) =>` parentheses, `===` (except `x == null`).
- React hooks rules (`rules-of-hooks`, `exhaustive-deps`) are errors.

Not linted but expected: named exports only, hooks in `src/hooks/`, shared
types in `src/types.ts`, logic in `src/lib/` (with tests), components in
`src/components/`. Tailwind v4, configured in CSS; gradients are
`bg-linear-to-*`. No Prettier.

## Versioning

Bump `version` in `package.json` before every PR merge (shown in the footer
via `__APP_VERSION__`): patch for fixes, minor for features
(`npm version <x.y.z> --no-git-tag-version`).

## Deployment

Push to `main` → lint, tests, e2e, build → GitHub Pages. `vite.config.ts`
uses `base: './'`, so the build works under `/hex-lights/`; reference public
assets relatively.
