# Hex Lights

A planner for a hexagon LED garage light, built from COB LED strip in
3D-printed channels.

**Live:** https://imrahil.github.io/hex-lights/

- **Design the pattern**: click hexagon sides on a 4 × 4 honeycomb to add
  or remove a strip. Dimension lines show the overall width and height.
- **Wiring schematic**: the order and direction to wire the strips, where the
  12 V supply goes in, and the jumper wires needed between runs, with their
  lengths. Click a junction to move the power input. Scroll to zoom, drag
  to pan.
- **3D print parts**: straight channels, 120° corners, 3-way connectors and
  end caps.
- **Totals and shopping list**: overall size, strip length, power, power
  supply current (minimum and with 20 % headroom), how much strip and jumper
  cable to buy, and a warning when one chain is too long to feed from one
  end. Any side length from 0.1 m to 2 m.

The design is saved in the browser, so it survives a reload.

## Development

```sh
npm install
npm run dev      # Vite dev server
npm test         # Vitest unit tests
npm run lint     # ESLint (lint:fix auto-fixes almost everything)
npm run build    # type-check + production build to dist/
npm run e2e      # Playwright against a production build
```

Run `npx playwright install chromium` once before the first `npm run e2e`.

## Deployment

Every push to `main` runs lint, unit tests, e2e tests and the build, then
deploys `dist/` to GitHub Pages (`.github/workflows/deploy.yml`). Pull
requests run the same checks (`.github/workflows/ci.yml`).

## Origin

This started as a Claude chat artifact. The original single-file component is
kept in [`reference/`](reference/HexagonLightCalculator.artifact.tsx) for
comparison; it isn't built or linted.
