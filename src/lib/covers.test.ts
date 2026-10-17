import { describe, expect, it } from 'vitest'
import type { EndCut } from './covers'
import { COVER_TYPES, coverCounts, coverOutline, covers, coverType, reversed } from './covers'
import { buildGrid } from './grid'
import { hexAt, hexSides, sidesAt } from './fixtures.test-utils'

const grid = buildGrid()
const codes = (sides: Parameters<typeof covers>[0]) => coverCounts(covers(sides)).map(({ type, count }) => `${count}${type.code}`)

describe('cover catalogue', () => {
  const all: EndCut[] = ['flat', 'point', 'left', 'right']

  it('has exactly one shape for every pair of end cuts, either way round', () => {
    for (const first of all) {
      for (const second of all) {
        const type = coverType([first, second])

        expect(type).toBeDefined()
        expect(coverType(reversed([first, second]))).toBe(type)
      }
    }

    expect(new Set(COVER_TYPES.map((t) => t.code)).size).toBe(COVER_TYPES.length)
  })

  it('pairs each mirrored shape with its mirror', () => {
    const mirror = (end: EndCut): EndCut => (end === 'left' ? 'right' : end === 'right' ? 'left' : end)

    for (const type of COVER_TYPES) {
      const image = coverType([mirror(type.ends[0]), mirror(type.ends[1])])

      expect(image.code).toBe(type.mirror ?? type.code)
    }
  })
})

describe('covers', () => {
  it('cuts a lone strip square at both ends', () => {
    expect(codes([hexSides(grid, hexAt(grid, 1, 1))[0]])).toEqual(['1J'])
  })

  it('makes a hexagon from six identical trapezoids', () => {
    expect(codes(hexSides(grid, hexAt(grid, 1, 1)))).toEqual(['6A'])
  })

  it('points every cover of a Y at the joint and leaves the outer ends flat', () => {
    const center = hexSides(grid, hexAt(grid, 1, 1))[0].a.key

    expect(codes(sidesAt(grid, center))).toEqual(['3I'])
  })

  it('cuts two hexagons sharing a side into trapezoids, pointed pieces and one double point', () => {
    const sides = [...new Set([...hexSides(grid, hexAt(grid, 1, 1)), ...hexSides(grid, hexAt(grid, 1, 2))])]
    const counts = coverCounts(covers(sides))
    const total = (codes: string[]) => counts.filter(({ type }) => codes.includes(type.code)).reduce((n, { count }) => n + count, 0)

    expect(total(['A'])).toBe(6)
    expect(total(['B'])).toBe(1)
    // Two on each side of the shared wall: one turns left, one right.
    expect(total(['C', 'D'])).toBe(4)
  })

  it('gives a zigzag parallelograms, and flat + angled pieces of opposite hand at its ends', () => {
    // Sides 4 and 5 are a hexagon's two top edges: across two neighbours they zigzag up, down, up, down.
    const zigzag = [hexAt(grid, 1, 1), hexAt(grid, 1, 2)].flatMap((hex) => hexSides(grid, hex).slice(4))
    const list = covers(zigzag)

    expect(list.map((c) => c.side)).toEqual(zigzag)
    expect([list[0].type.code, list[3].type.code].sort()).toEqual(['G', 'H'])
    expect(list.slice(1, 3).every((c) => ['E', 'F'].includes(c.type.code))).toBe(true)
  })
})

describe('coverOutline', () => {
  const from = { x: 0, y: 0 }
  const to = { x: 100, y: 0 }
  const h = 6
  const s = h / Math.sqrt(3)

  it('is a rectangle for flat ends', () => {
    expect(coverOutline(from, to, ['flat', 'flat'], h)).toEqual([
      { x: 0, y: -h }, { x: 100, y: -h }, { x: 100, y: h }, { x: 0, y: h },
    ])
  })

  it('shortens the edge on the inside of a corner and lengthens the outside one', () => {
    const [topLeft, topRight, bottomRight, bottomLeft] = coverOutline(from, to, ['left', 'left'], h)

    // On screen (y down), the left of a cover laid left to right is its top edge.
    expect(topLeft.y).toBeLessThan(0)
    expect(topLeft.x).toBeCloseTo(s)
    expect(topRight.x).toBeCloseTo(100 - s)
    expect(bottomRight.x).toBeCloseTo(100 + s)
    expect(bottomLeft.x).toBeCloseTo(-s)
  })

  it('ends a pointed end on the vertex', () => {
    const outline = coverOutline(from, to, ['point', 'point'], h)

    expect(outline).toHaveLength(6)
    expect(outline).toContainEqual({ x: 100, y: 0 })
    expect(outline).toContainEqual({ x: 0, y: 0 })
  })
})
