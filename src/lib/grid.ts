import type { Grid, Hex, Point, Side, Vertex } from '../types'

/** Logical size of both canvases. They are scaled with CSS and drawn at the device pixel ratio. */
export const CANVAS = { width: 620, height: 520 }

export const HEX_SIZE = 70

const ORIGIN: Point = { x: 120, y: 100 }

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
export function buildGrid(cols = 4, rows = 4, size = HEX_SIZE, origin: Point = ORIGIN): Grid {
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

  return { size, hexes, sides: [...sides.values()] }
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
