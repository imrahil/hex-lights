import { describe, expect, it } from 'vitest'
import { buildGrid } from './grid'
import { hexAt, hexSides, sidesAt } from './fixtures.test-utils'
import { billOfMaterials, printParts } from './parts'

const grid = buildGrid()

describe('printParts', () => {
  it('needs a channel per side and a corner per joint for a closed hexagon', () => {
    expect(printParts(hexSides(grid, hexAt(grid, 0, 0)))).toEqual({ straight: 6, corners: 6, threeWay: 0, endCaps: 0 })
  })

  it('needs a 3-way connector and three end caps for a Y', () => {
    const center = hexSides(grid, hexAt(grid, 1, 1))[0].a.key

    expect(printParts(sidesAt(grid, center))).toEqual({ straight: 3, corners: 0, threeWay: 1, endCaps: 3 })
  })

  it('needs nothing for an empty pattern', () => {
    expect(printParts([])).toEqual({ straight: 0, corners: 0, threeWay: 0, endCaps: 0 })
  })
})

describe('billOfMaterials', () => {
  it('adds up length and power', () => {
    const bill = billOfMaterials(6, 0.5)

    expect(bill.length).toBe(3)
    expect(bill.watts).toBe(30)
    expect(bill.supplyAmps).toBe(3)
  })

  it("doesn't round float noise up to an extra metre", () => {
    expect(7 * 0.1).toBeGreaterThan(0.7)
    expect(billOfMaterials(7, 0.1).stripMeters).toBe(1)
  })

  it('buys whole 5 m reels', () => {
    expect(billOfMaterials(0, 0.5).reelMeters).toBe(5)
    expect(billOfMaterials(10, 0.5).reelMeters).toBe(5)
    expect(billOfMaterials(11, 0.5).reelMeters).toBe(10)
  })

  it('never asks for less than a 1 A supply', () => {
    expect(billOfMaterials(1, 0.1).supplyAmps).toBe(1)
  })
})
