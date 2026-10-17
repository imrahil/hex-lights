import { describe, expect, it } from 'vitest'
import { bounds, formatMeters, jumperLengths, patternSize } from './dimensions'
import { buildGrid } from './grid'
import { hexAt, hexSides } from './fixtures.test-utils'
import { planWiring } from './wiring'

const grid = buildGrid()

describe('patternSize', () => {
  it('has no size without sides', () => {
    expect(bounds([])).toBeNull()
    expect(patternSize([], grid.size, 0.5)).toBeNull()
  })

  it('measures one hexagon as √3 sides wide and 2 sides tall', () => {
    const size = patternSize(hexSides(grid, hexAt(grid, 1, 1)), grid.size, 0.5)!

    expect(size.width).toBeCloseTo(Math.sqrt(3) * 0.5)
    expect(size.height).toBeCloseTo(1)
  })

  it('measures two hexagons side by side as twice as wide', () => {
    const sides = [...hexSides(grid, hexAt(grid, 0, 0)), ...hexSides(grid, hexAt(grid, 0, 1))]
    const size = patternSize(sides, grid.size, 1)!

    expect(size.width).toBeCloseTo(2 * Math.sqrt(3))
    expect(size.height).toBeCloseTo(2)
  })

  it('scales with the side length', () => {
    const side = hexSides(grid, hexAt(grid, 0, 0))[0]

    // Side 0 is the right-hand vertical edge.
    expect(patternSize([side], grid.size, 1.5)).toEqual({ width: 0, height: 1.5 })
  })
})

describe('jumperLengths', () => {
  it('is the straight-line distance between the joined ends', () => {
    const a = hexSides(grid, hexAt(grid, 0, 0))[0]
    const b = hexSides(grid, hexAt(grid, 0, 2))[0]
    const plan = planWiring([a, b])
    const [length] = jumperLengths(plan.jumpers, grid.size, 1)

    // Two parallel vertical sides, two hexagon widths apart: the jumper runs across, and maybe one side diagonally.
    expect(length).toBeGreaterThanOrEqual(2 * Math.sqrt(3) - 1e-9)
    expect(length).toBeLessThanOrEqual(Math.hypot(2 * Math.sqrt(3), 1) + 1e-9)
  })
})

describe('formatMeters', () => {
  it('shows centimetre precision', () => {
    expect(formatMeters(0.866)).toBe('0.87 m')
  })
})
