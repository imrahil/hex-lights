import { describe, expect, it } from 'vitest'
import { buildGrid, distance, distanceToSegment, hexCorners, sideAt, vertexAt } from './grid'
import { hexAt, hexSides } from './fixtures.test-utils'

describe('hexCorners', () => {
  it('puts six corners on a circle of the hexagon size', () => {
    const corners = hexCorners({ x: 10, y: 20 }, 70)

    expect(corners).toHaveLength(6)

    for (const corner of corners) {
      expect(distance(corner, { x: 10, y: 20 })).toBeCloseTo(70)
    }
  })
})

describe('buildGrid', () => {
  const grid = buildGrid()

  it('lays out a 4 × 4 honeycomb', () => {
    expect(grid.hexes).toHaveLength(16)
  })

  it('lists every shared side once', () => {
    // 96 hexagon edges, 12 shared inside rows and 21 between rows.
    expect(grid.sides).toHaveLength(63)
    expect(new Set(grid.sides.map((s) => s.key)).size).toBe(63)
  })

  it('gives neighbouring hexagons the same side object for their shared edge', () => {
    const left = hexSides(grid, hexAt(grid, 0, 0))
    const right = hexSides(grid, hexAt(grid, 0, 1))
    const shared = left.filter((s) => right.includes(s))

    expect(shared).toHaveLength(1)
  })

  it('keys a vertex the same from every hexagon that touches it', () => {
    const keys = new Set(grid.sides.flatMap((s) => [s.a, s.b]).map((v) => `${Math.round(v.x)},${Math.round(v.y)}`))
    const vertexKeys = new Set(grid.sides.flatMap((s) => [s.a.key, s.b.key]))

    expect(vertexKeys.size).toBe(keys.size)
  })
})

describe('distanceToSegment', () => {
  const a = { x: 0, y: 0 }
  const b = { x: 10, y: 0 }

  it('measures perpendicular distance inside the segment', () => {
    expect(distanceToSegment({ x: 5, y: 3 }, a, b)).toBeCloseTo(3)
  })

  it('measures to the nearest end beyond the segment', () => {
    expect(distanceToSegment({ x: 13, y: 4 }, a, b)).toBeCloseTo(5)
  })

  it('handles a zero-length segment', () => {
    expect(distanceToSegment({ x: 3, y: 4 }, a, a)).toBeCloseTo(5)
  })
})

describe('hit testing', () => {
  const grid = buildGrid()
  const side = hexSides(grid, hexAt(grid, 1, 1))[2]
  const mid = { x: (side.a.x + side.b.x) / 2, y: (side.a.y + side.b.y) / 2 }

  it('finds the side under the pointer', () => {
    expect(sideAt(grid.sides, { x: mid.x + 5, y: mid.y })?.key).toBe(side.key)
  })

  it('finds nothing in the middle of a hexagon', () => {
    expect(sideAt(grid.sides, hexAt(grid, 1, 1))).toBeNull()
  })

  it('finds the nearest vertex within tolerance', () => {
    expect(vertexAt([side.a, side.b], { x: side.a.x + 3, y: side.a.y - 3 })?.key).toBe(side.a.key)
    expect(vertexAt([side.a, side.b], mid)).toBeNull()
  })
})

describe('grid size', () => {
  it('keeps the 4 × 4 canvas at 620 × 520, so existing layouts are unchanged', () => {
    const grid = buildGrid()

    expect([grid.width, grid.height]).toEqual([620, 520])
  })

  it('fits every hexagon on the canvas for every size', () => {
    for (let cols = 1; cols <= 8; cols++) {
      for (let rows = 1; rows <= 8; rows++) {
        const grid = buildGrid(cols, rows)
        const corners = grid.hexes.flatMap((h) => hexCorners(h, grid.size))

        expect(grid.hexes).toHaveLength(cols * rows)
        expect(Math.max(...corners.map((p) => p.x))).toBeLessThanOrEqual(grid.width)
        expect(Math.max(...corners.map((p) => p.y))).toBeLessThanOrEqual(grid.height)
      }
    }
  })

  it('gives a side the same key in every grid that contains it', () => {
    const small = new Set(buildGrid(2, 3).sides.map((s) => s.key))
    const large = new Set(buildGrid(7, 6).sides.map((s) => s.key))

    expect([...small].every((k) => large.has(k))).toBe(true)
  })
})
