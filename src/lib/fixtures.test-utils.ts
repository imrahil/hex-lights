import type { Grid, Hex, Side } from '../types'
import { hexCorners, vertexAt } from './grid'

/** The six sides of one hexagon, in clockwise order. */
export function hexSides(grid: Grid, hex: Hex): Side[] {
  const vertices = grid.sides.flatMap((s) => [s.a, s.b])
  const corners = hexCorners(hex, grid.size).map((p) => vertexAt(vertices, p, 1)!.key)

  return corners.map((key, i) => {
    const next = corners[(i + 1) % 6]

    return grid.sides.find((s) => (s.a.key === key && s.b.key === next) || (s.a.key === next && s.b.key === key))!
  })
}

export function hexAt(grid: Grid, row: number, col: number): Hex {
  return grid.hexes.find((h) => h.row === row && h.col === col)!
}

/** All sides that touch the vertex `key`. */
export function sidesAt(grid: Grid, key: string): Side[] {
  return grid.sides.filter((s) => s.a.key === key || s.b.key === key)
}
