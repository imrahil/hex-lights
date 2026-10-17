import { expect, test } from '@playwright/test'
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
  await expect(page.getByTestId('part-straight')).toHaveText('6')
  await expect(page.getByTestId('part-corners')).toHaveText('6')
  await expect(page.getByTestId('part-end-caps')).toHaveText('0')
  await expect(page.getByTestId('shopping-list')).toContainText('3 m LED COB strip (buy 5 m)')
  await expect(page.getByTestId('shopping-list')).toContainText('3 A minimum')
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
  await expect(page.getByTestId('shopping-list')).toContainText('1 jumper wire (2-conductor)')
})

test('side length changes totals', async ({ page }) => {
  await selectSides(page, hexSides(1, 1).slice(0, 2))
  await page.getByLabel(/Side Length/).fill('1.25')

  await expect(page.getByTestId('length')).toHaveText('2.50 m')
  await expect(page.getByText('Channel length: 125 cm each')).toBeVisible()
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
