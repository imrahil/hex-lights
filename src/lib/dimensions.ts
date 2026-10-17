import type { Jumper, Point, Side } from '../types'
import { distance } from './grid'

export interface Bounds {
  min: Point
  max: Point
}

/** Bounding box of the selected sides' centre lines, in canvas units. */
export function bounds(sides: readonly Side[]): Bounds | null {
  if (sides.length === 0) {
    return null
  }

  const points = sides.flatMap((s) => [s.a, s.b])
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)

  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  }
}

/** Canvas units to metres: one hexagon side is `hexSize` units and `sideLength` metres. */
export function toMeters(units: number, hexSize: number, sideLength: number): number {
  return (units * sideLength) / hexSize
}

export interface Size {
  width: number
  height: number
}

/** Overall width and height of the pattern in metres, measured between channel centre lines. */
export function patternSize(sides: readonly Side[], hexSize: number, sideLength: number): Size | null {
  const box = bounds(sides)

  if (!box) {
    return null
  }

  return {
    width: toMeters(box.max.x - box.min.x, hexSize, sideLength),
    height: toMeters(box.max.y - box.min.y, hexSize, sideLength),
  }
}

/** Straight-line length of each jumper in metres: the least cable it can take. */
export function jumperLengths(jumpers: readonly Jumper[], hexSize: number, sideLength: number): number[] {
  return jumpers.map((j) => toMeters(distance(j.from, j.to), hexSize, sideLength))
}

export function formatMeters(meters: number): string {
  return `${meters.toFixed(2)} m`
}
