import { describe, expect, it } from 'vitest'
import type { Side, WiringPlan } from '../types'
import { buildGrid } from './grid'
import { hexAt, hexSides, sidesAt } from './fixtures.test-utils'
import { junctions, planWiring } from './wiring'

const grid = buildGrid()

/** The plan is physically buildable: every side once, runs chained, every break bridged by a jumper. */
function expectValidPlan(plan: WiringPlan, sides: Side[]) {
  expect(plan.runs.map((r) => r.key).sort()).toEqual(sides.map((s) => s.key).sort())

  for (const run of plan.runs) {
    const side = sides.find((s) => s.key === run.key)!

    expect([run.from.key, run.to.key].sort()).toEqual([side.a.key, side.b.key].sort())
  }

  expect(plan.runs[0].from.key).toBe(plan.start?.key)

  const breaks = plan.runs.slice(1).flatMap((run, i) => {
    const previous = plan.runs[i]

    return previous.to.key === run.from.key ? [] : [{ from: previous.to.key, to: run.from.key }]
  })

  expect(plan.jumpers.map((j) => ({ from: j.from.key, to: j.to.key }))).toEqual(breaks)
}

/** Fewest runs possible: one per connected piece, or half its odd junctions if more. */
function minimumJumpers(sides: Side[]): number {
  const parent = new Map<string, string>()
  const find = (k: string): string => (parent.get(k) === k ? k : find(parent.get(k)!))

  for (const s of sides) {
    for (const k of [s.a.key, s.b.key]) {
      if (!parent.has(k)) {
        parent.set(k, k)
      }
    }

    parent.set(find(s.a.key), find(s.b.key))
  }

  const odd = new Map<string, number>()

  for (const [key, { sides: count }] of junctions(sides)) {
    const root = find(key)

    odd.set(root, (odd.get(root) ?? 0) + (count % 2))
  }

  return [...odd.values()].reduce((sum, n) => sum + Math.max(1, n / 2), 0) - 1
}

describe('junctions', () => {
  it('counts the sides meeting at each vertex', () => {
    const ring = hexSides(grid, hexAt(grid, 0, 0))
    const counts = [...junctions(ring).values()].map((j) => j.sides)

    expect(counts).toEqual([2, 2, 2, 2, 2, 2])
  })
})

describe('planWiring', () => {
  it('has nothing to plan without sides', () => {
    expect(planWiring([])).toEqual({ start: null, runs: [], jumpers: [] })
  })

  it('wires a single hexagon as one loop', () => {
    const ring = hexSides(grid, hexAt(grid, 1, 1))
    const plan = planWiring(ring)

    expectValidPlan(plan, ring)
    expect(plan.jumpers).toHaveLength(0)
    expect(plan.runs.at(-1)!.to.key).toBe(plan.start!.key)
  })

  it('wires two hexagons sharing a side in one run, starting at a 3-way junction', () => {
    const sides = [...new Set([...hexSides(grid, hexAt(grid, 1, 1)), ...hexSides(grid, hexAt(grid, 1, 2))])]
    const plan = planWiring(sides)

    expect(sides).toHaveLength(11)
    expectValidPlan(plan, sides)
    expect(plan.jumpers).toHaveLength(0)
    expect(junctions(sides).get(plan.start!.key)!.sides).toBe(3)
  })

  it('needs a jumper for a Y, which no single strip can trace', () => {
    const center = hexSides(grid, hexAt(grid, 1, 1))[0].a.key
    const y = sidesAt(grid, center)
    const plan = planWiring(y)

    expect(y).toHaveLength(3)
    expectValidPlan(plan, y)
    expect(plan.jumpers).toHaveLength(1)
  })

  it('bridges separate pieces with a jumper', () => {
    const a = hexSides(grid, hexAt(grid, 0, 0))[0]
    const b = hexSides(grid, hexAt(grid, 3, 3))[3]
    const plan = planWiring([a, b])

    expectValidPlan(plan, [a, b])
    expect(plan.jumpers).toHaveLength(1)
  })

  it('starts at an end cap when no power input is set', () => {
    const ring = hexSides(grid, hexAt(grid, 1, 1))
    const open = ring.slice(0, 4)
    const plan = planWiring(open)

    expectValidPlan(plan, open)
    expect(junctions(open).get(plan.start!.key)!.sides).toBe(1)
  })

  it('starts at the chosen power input', () => {
    const ring = hexSides(grid, hexAt(grid, 1, 1))
    const power = ring[3].b.key
    const plan = planWiring(ring, power)

    expectValidPlan(plan, ring)
    expect(plan.start!.key).toBe(power)
  })

  it('ignores a power input that is no longer on a selected side', () => {
    const ring = hexSides(grid, hexAt(grid, 1, 1))
    const plan = planWiring(ring, 'not-a-vertex')

    expectValidPlan(plan, ring)
  })

  it('makes a valid plan with as few jumpers as possible for random patterns', () => {
    let seed = 42

    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31

      return seed / 2 ** 31
    }

    for (let i = 0; i < 300; i++) {
      const density = 0.2 + random() * 0.7
      const sides = grid.sides.filter(() => random() < density)

      if (sides.length === 0) {
        continue
      }

      const plan = planWiring(sides)

      expectValidPlan(plan, sides)
      expect(plan.jumpers.length).toBe(minimumJumpers(sides))
    }
  })
})
