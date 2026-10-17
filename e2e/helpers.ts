import type { Locator, Page } from '@playwright/test'
import type { Point, Side } from '../src/types'
import { buildGrid, CANVAS, hexCorners } from '../src/lib/grid'
import type { Design } from '../src/lib/design'

export const grid = buildGrid()

/** The six sides of the hexagon at row/col, clockwise. */
export function hexSides(row: number, col: number): Side[] {
  const hex = grid.hexes.find((h) => h.row === row && h.col === col)!
  const corners = hexCorners(hex, grid.size)
  const near = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y) < 1

  return corners.map((c, i) => {
    const next = corners[(i + 1) % 6]

    return grid.sides.find((s) => (near(s.a, c) && near(s.b, next)) || (near(s.a, next) && near(s.b, c)))!
  })
}

/** All sides that meet at the vertex `key`. */
export const sidesAt = (key: string): Side[] => grid.sides.filter((s) => s.a.key === key || s.b.key === key)

export const midpoint = (side: Side): Point => ({ x: (side.a.x + side.b.x) / 2, y: (side.a.y + side.b.y) / 2 })

/** A canvas point (in CANVAS units) as a position inside the scaled element. */
async function position(canvas: Locator, p: Point) {
  const box = (await canvas.boundingBox())!

  return { x: (p.x * box.width) / CANVAS.width, y: (p.y * box.height) / CANVAS.height }
}

export async function clickCanvas(canvas: Locator, p: Point) {
  await canvas.click({ position: await position(canvas, p) })
}

export async function dragCanvas(page: Page, canvas: Locator, from: Point, by: Point) {
  const box = (await canvas.boundingBox())!
  const start = await position(canvas, from)

  await page.mouse.move(box.x + start.x, box.y + start.y)
  await page.mouse.down()
  await page.mouse.move(box.x + start.x + by.x, box.y + start.y + by.y, { steps: 5 })
  await page.mouse.up()
}

export const pattern = (page: Page) => page.getByTestId('pattern')

export const schematic = (page: Page) => page.getByTestId('schematic')

export async function selectSides(page: Page, sides: Side[]) {
  for (const side of sides) {
    await clickCanvas(pattern(page), midpoint(side))
  }
}

export async function savedDesign(page: Page): Promise<Design> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('hex-lights:design') ?? '{}'))
}
