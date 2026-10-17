import type { Point, Side, Vertex } from '../types'

/**
 * How one end of a transparent cover is cut, from what meets it at that vertex:
 * - `flat`: nothing (an end cap), cut square
 * - `point`: two other covers (3-way joint), cut to a 120° point
 * - `left` / `right`: one other cover (corner), mitred at 60° to the axis.
 *   Which edge comes up short, looking along the cover from its first end
 *   to its second, says which way the corner turns.
 */
export type EndCut = 'flat' | 'point' | 'left' | 'right'

export interface CoverType {
  /** Short code printed on the pattern. Fixed per shape, so it means the same part in every design. */
  code: string
  name: string
  /** The shape in its catalogue orientation, first end on the left. */
  ends: [EndCut, EndCut]
  /** Code of the mirror-image shape, which is a different part: covers can't be turned upside down. */
  mirror?: string
}

/** Every shape a cover can have on a honeycomb, most common first. */
export const COVER_TYPES: CoverType[] = [
  { code: 'A', name: 'Angled both ends, trapezoid', ends: ['left', 'left'] },
  { code: 'B', name: 'Pointed both ends', ends: ['point', 'point'] },
  { code: 'C', name: 'Pointed + angled', ends: ['point', 'left'], mirror: 'D' },
  { code: 'D', name: 'Pointed + angled', ends: ['point', 'right'], mirror: 'C' },
  { code: 'E', name: 'Angled both ends, parallelogram', ends: ['left', 'right'], mirror: 'F' },
  { code: 'F', name: 'Angled both ends, parallelogram', ends: ['right', 'left'], mirror: 'E' },
  { code: 'G', name: 'Flat + angled', ends: ['flat', 'left'], mirror: 'H' },
  { code: 'H', name: 'Flat + angled', ends: ['flat', 'right'], mirror: 'G' },
  { code: 'I', name: 'Flat + pointed', ends: ['flat', 'point'] },
  { code: 'J', name: 'Flat both ends', ends: ['flat', 'flat'] },
]

const swap = (end: EndCut): EndCut => (end === 'left' ? 'right' : end === 'right' ? 'left' : end)

/**
 * Turning a cover end for end (it stays face up) swaps its ends, and what
 * was its left edge is now its right.
 */
export function reversed([first, second]: [EndCut, EndCut]): [EndCut, EndCut] {
  return [swap(second), swap(first)]
}

const byEnds = new Map<string, CoverType>()

for (const type of COVER_TYPES) {
  byEnds.set(type.ends.join(), type)
  byEnds.set(reversed(type.ends).join(), type)
}

export function coverType(ends: [EndCut, EndCut]): CoverType {
  return byEnds.get(ends.join())!
}

export interface Cover {
  side: Side
  /** Laid from `from` to `to`; `ends` are relative to that direction. */
  from: Vertex
  to: Vertex
  ends: [EndCut, EndCut]
  type: CoverType
}

/** Which side of the line a→b the point p is on, as seen on screen (y down). */
function sideOf(a: Point, b: Point, p: Point): 'left' | 'right' {
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)

  return cross < 0 ? 'left' : 'right'
}

/** One cover per selected side, with its end cuts and shape. */
export function covers(sides: readonly Side[]): Cover[] {
  const at = new Map<string, Side[]>()

  for (const side of sides) {
    for (const v of [side.a, side.b]) {
      at.set(v.key, [...(at.get(v.key) ?? []), side])
    }
  }

  return sides.map((side) => {
    const { a: from, b: to } = side

    const cut = (end: Vertex): EndCut => {
      const others = at.get(end.key)!.filter((s) => s !== side)

      if (others.length === 0) {
        return 'flat'
      }

      if (others.length > 1) {
        return 'point'
      }

      const far = others[0].a.key === end.key ? others[0].b : others[0].a

      // The mitre shortens the edge on the inside of the corner: the side the next cover is on.
      return sideOf(from, to, far)
    }

    const ends: [EndCut, EndCut] = [cut(from), cut(to)]

    return { side, from, to, ends, type: coverType(ends) }
  })
}

/** How many of each cover shape, in catalogue order, leaving out shapes not used. */
export function coverCounts(list: readonly Cover[]): { type: CoverType; count: number }[] {
  return COVER_TYPES
    .map((type) => ({ type, count: list.filter((c) => c.type === type).length }))
    .filter(({ count }) => count > 0)
}

/**
 * Outline of a cover `halfWidth` either side of the centre line from `from`
 * to `to`, as a polygon. Mitres and points meet the neighbours' cuts on the
 * lines that bisect the 120° between covers, so they set back by
 * halfWidth / √3 along the axis.
 */
export function coverOutline(from: Point, to: Point, [first, second]: [EndCut, EndCut], halfWidth: number): Point[] {
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const d = { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
  const left = { x: d.y, y: -d.x }
  const setback = halfWidth / Math.sqrt(3)

  const at = (base: Point, along: number, across: number): Point => ({
    x: base.x + d.x * along + left.x * across,
    y: base.y + d.y * along + left.y * across,
  })

  // How far each edge reaches past (+) or short of (−) the end vertex.
  const reach = (end: EndCut, edge: 'left' | 'right') => {
    if (end === 'flat') {
      return 0
    }

    if (end === 'point') {
      return -setback
    }

    return end === edge ? -setback : setback
  }

  const outline: Point[] = [
    at(from, -reach(first, 'left'), halfWidth),
    at(to, reach(second, 'left'), halfWidth),
  ]

  if (second === 'point') {
    outline.push(at(to, 0, 0))
  }

  outline.push(at(to, reach(second, 'right'), -halfWidth), at(from, -reach(first, 'right'), -halfWidth))

  if (first === 'point') {
    outline.push(at(from, 0, 0))
  }

  return outline
}
