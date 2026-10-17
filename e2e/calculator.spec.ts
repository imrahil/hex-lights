import { expect, test } from '@playwright/test'
import { buildGrid } from '../src/lib/grid'
import { clickCanvas, dragCanvas, hexSides, midpoint, pattern, savedDesign, schematic, selectSides, sidesAt } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('selecting a hexagon fills in the calculations and parts', async ({ page }) => {
  await selectSides(page, hexSides(1, 1))

  await expect(page.getByTestId('strips')).toHaveText('6')
  await expect(page.getByTestId('length')).toHaveText('3.00 m')
  await expect(page.getByTestId('power')).toHaveText('30.0 W')
  await expect(page.getByTestId('jumpers')).toHaveText('0')
  await expect(page.getByTestId('size')).toHaveText('0.87 × 1.00 m')
  await expect(page.getByTestId('part-straight')).toHaveText('6')
  await expect(page.getByTestId('part-corners')).toHaveText('6')
  await expect(page.getByTestId('part-end-caps')).toHaveText('0')
  await expect(page.getByTestId('shopping-list')).toContainText('3 m LED COB strip (buy 5 m)')
  await expect(page.getByTestId('shopping-list')).toContainText('3 A minimum, 4 A recommended')
  await expect(page.getByTestId('injection-warning')).toBeHidden()
})

test('clicking a selected side removes it', async ({ page }) => {
  const [side] = hexSides(0, 0)

  await clickCanvas(pattern(page), midpoint(side))
  await expect(page.getByTestId('strips')).toHaveText('1')
  await clickCanvas(pattern(page), midpoint(side))
  await expect(page.getByTestId('strips')).toHaveText('0')
})

test('a Y junction needs a jumper wire', async ({ page }) => {
  const y = sidesAt(hexSides(1, 1)[0].a.key)

  expect(y).toHaveLength(3)
  await selectSides(page, y)

  await expect(page.getByTestId('part-three-way')).toHaveText('1')
  await expect(page.getByTestId('part-end-caps')).toHaveText('3')
  await expect(page.getByTestId('jumpers')).toHaveText('1')
  await expect(page.getByTestId('shopping-list')).toContainText('1 jumper wire (2-conductor, at least 0.50 m in total)')
})

test('side length changes totals', async ({ page }) => {
  await selectSides(page, hexSides(1, 1).slice(0, 2))
  await page.getByLabel(/Side Length/).fill('1.2')

  await expect(page.getByTestId('length')).toHaveText('2.40 m')
  await expect(page.getByTestId('size')).toHaveText('1.04 × 1.80 m')
  await expect(page.getByText('Channel length: 120 cm each')).toBeVisible()
})

test('reset clears the selection', async ({ page }) => {
  await selectSides(page, hexSides(2, 2))
  await page.getByRole('button', { name: 'Reset Selection' }).click()

  await expect(page.getByTestId('strips')).toHaveText('0')
})

test('the design survives a reload', async ({ page }) => {
  await selectSides(page, hexSides(2, 1).slice(0, 3))
  await page.reload()

  await expect(page.getByTestId('strips')).toHaveText('3')
})

test('clicking a junction on the schematic sets the power input, dragging does not', async ({ page }) => {
  const ring = hexSides(1, 1)

  await selectSides(page, ring)

  const vertex = ring[2].a

  await dragCanvas(page, schematic(page), vertex, { x: 60, y: 40 })
  expect((await savedDesign(page)).power).toBeNull()

  await page.getByRole('button', { name: 'Reset view' }).click()
  await clickCanvas(schematic(page), vertex)
  expect((await savedDesign(page)).power).toBe(vertex.key)

  await clickCanvas(schematic(page), vertex)
  expect((await savedDesign(page)).power).toBeNull()
})

test('the wheel zooms the schematic without scrolling the page', async ({ page }) => {
  await selectSides(page, hexSides(1, 1))
  await schematic(page).scrollIntoViewIfNeeded()

  const before = await page.evaluate(() => window.scrollY)

  await schematic(page).hover()
  await page.mouse.wheel(0, -200)

  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})

test('more than 5 m on one chain warns about dimming', async ({ page }) => {
  const twoHexagons = [...new Set([...hexSides(1, 1), ...hexSides(1, 2)])]

  await selectSides(page, twoHexagons)

  await expect(page.getByTestId('length')).toHaveText('5.50 m')
  await expect(page.getByTestId('size')).toHaveText('1.73 × 1.00 m')
  await expect(page.getByTestId('injection-warning')).toBeVisible()
})

test('removing the sides at the power input releases it', async ({ page }) => {
  const [first, second] = hexSides(1, 1)
  const end = first.a.key === second.a.key || first.a.key === second.b.key ? first.b : first.a

  await selectSides(page, [first, second])
  await clickCanvas(schematic(page), end)
  expect((await savedDesign(page)).power).toBe(end.key)

  await clickCanvas(pattern(page), midpoint(first))
  await expect(page.getByTestId('strips')).toHaveText('1')
  expect((await savedDesign(page)).power).toBeNull()
})

test('the honeycomb grows and shrinks, and remembers its size', async ({ page }) => {
  const more = (what: string) => page.getByRole('button', { name: `More ${what}` })
  const fewer = (what: string) => page.getByRole('button', { name: `Fewer ${what}` })
  const big = buildGrid(6, 5)

  await selectSides(page, hexSides(1, 1))
  await more('columns').click()
  await more('columns').click()
  await more('rows').click()
  await expect(page.getByLabel('Columns', { exact: true })).toHaveText('6')
  await expect(page.getByLabel('Rows', { exact: true })).toHaveText('5')

  const box = (await pattern(page).boundingBox())!

  expect(box.width / box.height).toBeCloseTo(big.width / big.height, 1)

  await selectSides(page, hexSides(4, 5, big), big)
  await expect(page.getByTestId('strips')).toHaveText('12')

  await page.reload()
  await expect(page.getByLabel('Columns', { exact: true })).toHaveText('6')
  await expect(page.getByTestId('strips')).toHaveText('12')

  await fewer('columns').click()
  await fewer('columns').click()
  await fewer('rows').click()
  await expect(page.getByTestId('strips')).toHaveText('6')
})

test('grid size stops at its limits', async ({ page }) => {
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Fewer rows' }).click()
  }

  await expect(page.getByLabel('Rows', { exact: true })).toHaveText('1')
  await expect(page.getByRole('button', { name: 'Fewer rows' })).toBeDisabled()
})

test('transparent covers are counted by shape', async ({ page }) => {
  const twoHexagons = [...new Set([...hexSides(1, 1), ...hexSides(1, 2)])]

  await selectSides(page, twoHexagons)

  await expect(page.getByTestId('covers-total')).toHaveText('11')
  await expect(page.getByTestId('cover-A')).toHaveText('6')
  await expect(page.getByTestId('cover-B')).toHaveText('1')
  await expect(page.getByTestId('cover-C')).toHaveText('2')
  await expect(page.getByTestId('cover-D')).toHaveText('2')
  await expect(page.getByTestId('cover-J')).toHaveCount(0)
})

test('covers can be shown on the pattern', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Show covers' })

  await selectSides(page, hexSides(1, 1))
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  // Sides still toggle with covers shown.
  await clickCanvas(pattern(page), midpoint(hexSides(1, 1)[0]))
  await expect(page.getByTestId('strips')).toHaveText('5')
  await expect(page.getByTestId('cover-G')).toHaveText('1')
  await expect(page.getByTestId('cover-H')).toHaveText('1')
  await expect(page.getByTestId('cover-A')).toHaveText('3')
})
