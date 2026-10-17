import type { Jumper, Run, Side, Vertex, WiringPlan } from '../types'
import { distance } from './grid'

export interface Junction {
  vertex: Vertex
  /** How many selected sides meet here: 1 = end cap, 2 = corner, 3 = 3-way connector. */
  sides: number
}

/** Every vertex touched by a selected side, with the number of sides meeting there. */
export function junctions(sides: readonly Side[]): Map<string, Junction> {
  const result = new Map<string, Junction>()

  for (const side of sides) {
    for (const vertex of [side.a, side.b]) {
      const junction = result.get(vertex.key)

      if (junction) {
        junction.sides++
      } else {
        result.set(vertex.key, { vertex, sides: 1 })
      }
    }
  }

  return result
}

/**
 * Orders the selected sides into as few continuous runs as practical, each
 * fed from the end of the previous one by a jumper wire.
 *
 * A run is a trail: it never uses a side twice. Runs start at an odd junction
 * (an end cap or a 3-way connector) when there is one, because a trail that
 * starts at an odd vertex always ends at another, so every jumper uses up a
 * pair of them. Inside a run, Fleury's rule (don't cross a bridge while
 * another side is available) keeps the run from stranding sides it could
 * have covered. The first run starts at `powerKey` when that is a junction.
 */
export function planWiring(sides: readonly Side[], powerKey: string | null = null): WiringPlan {
  if (sides.length === 0) {
    return { start: null, runs: [], jumpers: [] }
  }

  const graph = junctions(sides)
  const adjacent = new Map<string, Side[]>()

  for (const side of sides) {
    for (const vertex of [side.a, side.b]) {
      adjacent.set(vertex.key, [...(adjacent.get(vertex.key) ?? []), side])
    }
  }

  const unused = new Set(sides.map((s) => s.key))
  const free = (key: string) => (adjacent.get(key) ?? []).filter((s) => unused.has(s.key))
  const other = (side: Side, key: string) => (side.a.key === key ? side.b : side.a)

  const canReach = (from: string, to: string) => {
    const seen = new Set([from])
    const stack = [from]

    while (stack.length > 0) {
      const key = stack.pop()!

      if (key === to) {
        return true
      }

      for (const side of free(key)) {
        const next = other(side, key).key

        if (!seen.has(next)) {
          seen.add(next)
          stack.push(next)
        }
      }
    }

    return false
  }

  const isBridge = (side: Side, at: string) => {
    unused.delete(side.key)

    const bridge = !canReach(other(side, at).key, at)

    unused.add(side.key)

    return bridge
  }

  const nextStart = (near: Vertex | null): Vertex => {
    const candidates = [...graph.values()].map((j) => j.vertex).filter((v) => free(v.key).length > 0)
    const odd = candidates.filter((v) => free(v.key).length % 2 === 1)
    const pool = odd.length > 0 ? odd : candidates

    if (!near) {
      return pool.find((v) => free(v.key).length === 1) ?? pool[0]
    }

    return pool.reduce((best, v) => (distance(near, v) < distance(near, best) ? v : best))
  }

  const power = powerKey ? graph.get(powerKey)?.vertex : undefined
  const start = power ?? nextStart(null)
  const runs: Run[] = []
  const jumpers: Jumper[] = []
  let current = start

  while (unused.size > 0) {
    if (runs.length > 0) {
      const next = nextStart(current)

      jumpers.push({ from: current, to: next })
      current = next
    }

    for (let options = free(current.key); options.length > 0; options = free(current.key)) {
      const side = options.find((s) => !isBridge(s, current.key)) ?? options[0]
      const to = other(side, current.key)

      runs.push({ key: side.key, from: current, to })
      unused.delete(side.key)
      current = to
    }
  }

  return { start, runs, jumpers }
}
