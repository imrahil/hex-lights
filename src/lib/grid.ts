import type { Grid, Hex, Point, Side, Vertex } from '../types'

export const HEX_SIZE = 70

/** Columns and rows of hexagons the user can choose. */
export const GRID_LIMITS = { min: 1, max: 8, default: 4 }

/**
 * Centre of the top-left hexagon. Never change it: vertex keys, and so every
 * saved design, are measured from here.
 */
const ORIGIN: Point = { x: 120, y: 100 }

/** Canvas space right of and below the honeycomb (left and top come from ORIGIN). Room for dimension lines. */
const MARGIN = { right: 15, bottom: 35 }

/** Corners of a pointy-top hexagon, clockwise from the upper-right one. */
export function hexCorners(center: Point, size: number): Point[] {
  const corners: Point[] = []

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6

    corners.push({ x: center.x + size * Math.cos(angle), y: center.y + size * Math.sin(angle) })
  }

  return corners
}

/**
 * An offset honeycomb (odd rows shifted right by half a hexagon) with every
 * side listed once. Every corner sits on a lattice of half-widths by
 * half-sizes, so vertices are keyed by lattice indices: neighbouring hexagons
 * agree on a shared corner without comparing floats.
 */
export function buildGrid(cols = GRID_LIMITS.default, rows = GRID_LIMITS.default, size = HEX_SIZE, origin: Point = ORIGIN): Grid {
  const width = size * Math.sqrt(3)
  const hexes: Hex[] = []
  const vertices = new Map<string, Vertex>()
  const sides = new Map<string, Side>()

  const vertexAtCorner = (p: Point): Vertex => {
    const key = `${Math.round((p.x - origin.x) / (width / 2))},${Math.round((p.y - origin.y) / (size / 2))}`
    let vertex = vertices.get(key)

    if (!vertex) {
      vertex = { key, x: p.x, y: p.y }
      vertices.set(key, vertex)
    }

    return vertex
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const hex = { row, col, x: origin.x + col * width + (row % 2) * (width / 2), y: origin.y + row * size * 1.5 }
      const corners = hexCorners(hex, size).map(vertexAtCorner)

      hexes.push(hex)

      for (let i = 0; i < 6; i++) {
        const side = makeSide(corners[i], corners[(i + 1) % 6])

        if (!sides.has(side.key)) {
          sides.set(side.key, side)
        }
      }
    }
  }

  // Odd rows are shifted right by half a hexagon, so any second row widens the grid.
  const right = origin.x + (cols - 1) * width + (rows > 1 ? width / 2 : 0) + width / 2
  const bottom = origin.y + (rows - 1) * size * 1.5 + size

  return {
    cols,
    rows,
    size,
    width: Math.round(right + MARGIN.right),
    height: Math.round(bottom + MARGIN.bottom),
    hexes,
    sides: [...sides.values()],
  }
}

function makeSide(a: Vertex, b: Vertex): Side {
  const [first, second] = a.key < b.key ? [a, b] : [b, a]

  return { key: `${first.key}|${second.key}`, a: first, b: second }
}

export function distance(p: Point, q: Point): number {
  return Math.hypot(p.x - q.x, p.y - q.y)
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared))

  return distance(p, { x: a.x + t * dx, y: a.y + t * dy })
}

/** The side closest to `p`, if it is within `tolerance`. */
export function sideAt(sides: readonly Side[], p: Point, tolerance = 12): Side | null {
  let best: Side | null = null
  let bestDistance = tolerance

  for (const side of sides) {
    const d = distanceToSegment(p, side.a, side.b)

    if (d < bestDistance) {
      best = side
      bestDistance = d
    }
  }

  return best
}

/** The vertex closest to `p`, if it is within `tolerance`. */
export function vertexAt(vertices: Iterable<Vertex>, p: Point, tolerance = 15): Vertex | null {
  let best: Vertex | null = null
  let bestDistance = tolerance

  for (const vertex of vertices) {
    const d = distance(p, vertex)

    if (d < bestDistance) {
      best = vertex
      bestDistance = d
    }
  }

  return best
}
