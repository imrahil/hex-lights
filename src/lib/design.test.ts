import { describe, expect, it } from 'vitest'
import { DEFAULT_DESIGN, gridCount, parseDesign, resizeGrid, toggleSide } from './design'
import { buildGrid } from './grid'
import { hexAt, hexSides } from './fixtures.test-utils'

const grid = buildGrid()
const big = buildGrid(6, 5)
const ring = hexSides(grid, hexAt(grid, 1, 1)).map((s) => s.key)
const farRing = hexSides(big, hexAt(big, 4, 5)).map((s) => s.key)

describe('parseDesign', () => {
  it('falls back to the default when nothing is saved', () => {
    expect(parseDesign(null)).toEqual(DEFAULT_DESIGN)
  })

  it('falls back to the default for corrupt JSON', () => {
    expect(parseDesign('{not json')).toEqual(DEFAULT_DESIGN)
  })

  it('restores a saved design', () => {
    const saved = { cols: 6, rows: 5, sides: [...ring, ...farRing], straight: 200, power: farRing[0].split('|')[0] }

    expect(parseDesign(JSON.stringify(saved))).toEqual(saved)
  })

  it('reads a design saved before the grid size was configurable as 4 × 4', () => {
    const design = parseDesign(JSON.stringify({ sides: ring, sideLength: 0.5, power: null }))

    expect(design.cols).toBe(4)
    expect(design.rows).toBe(4)
    expect(design.sides).toEqual(ring)
  })

  it('drops sides that are not on its grid, and duplicates', () => {
    const raw = { cols: 4, rows: 4, sides: [ring[0], 'x|y', ring[0], 3, farRing[0]] }

    expect(parseDesign(JSON.stringify(raw)).sides).toEqual([ring[0]])
  })

  it('only accepts straight pieces that can be printed', () => {
    expect(parseDesign(JSON.stringify({ straight: 66 })).straight).toBe(66)
    expect(parseDesign(JSON.stringify({ straight: 120 })).straight).toBe(DEFAULT_DESIGN.straight)
    expect(parseDesign(JSON.stringify({ straight: 'long' })).straight).toBe(DEFAULT_DESIGN.straight)
  })

  it('gives a design saved with a free side length the closest straight piece', () => {
    // Sides were 0.5 m: the longest piece, 250 + 2 × 42 = 334 mm, comes closest.
    expect(parseDesign(JSON.stringify({ sideLength: 0.5 })).straight).toBe(250)
    expect(parseDesign(JSON.stringify({ sideLength: 0.2 })).straight).toBe(100)
    expect(parseDesign(JSON.stringify({ sideLength: 0.1 })).straight).toBe(50)
  })

  it('ignores a power input that is not on a selected side', () => {
    expect(parseDesign(JSON.stringify({ sides: ring, power: 5 })).power).toBeNull()
    expect(parseDesign(JSON.stringify({ sides: ring, power: 'nowhere' })).power).toBeNull()
  })
})

describe('gridCount', () => {
  it('keeps column and row counts within limits', () => {
    expect(gridCount(0)).toBe(1)
    expect(gridCount(20)).toBe(8)
    expect(gridCount(5.4)).toBe(5)
    expect(gridCount('lots')).toBe(4)
    expect(gridCount(undefined)).toBe(4)
  })
})

describe('resizeGrid', () => {
  it('keeps every side when growing', () => {
    const design = { ...DEFAULT_DESIGN, sides: ring }

    expect(resizeGrid(design, 8, 8).sides).toEqual(ring)
  })

  it('drops sides that no longer fit when shrinking, and their power input', () => {
    const design = { ...DEFAULT_DESIGN, cols: 6, rows: 5, sides: [...ring, ...farRing], power: farRing[2].split('|')[0] }
    const smaller = resizeGrid(design, 4, 4)

    expect(smaller.sides).toEqual(ring)
    expect(smaller.power).toBeNull()
  })

  it('keeps sides on the edge shared with a hexagon that was removed', () => {
    const edge = hexSides(grid, hexAt(grid, 0, 0)).map((s) => s.key)

    expect(resizeGrid({ ...DEFAULT_DESIGN, sides: edge }, 1, 1).sides).toEqual(edge)
  })
})

describe('toggleSide', () => {
  const [first, second] = hexSides(grid, hexAt(grid, 1, 1))
  const shared = first.a.key === second.a.key || first.a.key === second.b.key ? first.a : first.b
  const only = first.a === shared ? first.b : first.a

  it('adds and removes a side', () => {
    const added = toggleSide(DEFAULT_DESIGN, first.key, grid.sides)

    expect(added.sides).toEqual([first.key])
    expect(toggleSide(added, first.key, grid.sides).sides).toEqual([])
  })

  it('keeps the power input while a selected side still touches it', () => {
    const design = { ...DEFAULT_DESIGN, sides: [first.key, second.key], power: shared.key }

    expect(toggleSide(design, first.key, grid.sides).power).toBe(shared.key)
  })

  it('drops the power input when its last side is removed', () => {
    const design = { ...DEFAULT_DESIGN, sides: [first.key, second.key], power: only.key }

    expect(toggleSide(design, first.key, grid.sides).power).toBeNull()
  })
})
