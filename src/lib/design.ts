import type { Side } from '../types'
import { buildGrid, GRID_LIMITS } from './grid'
import { CHANNEL, nearestStraight } from './parts'

export interface Design {
  /** Honeycomb size in hexagons. */
  cols: number
  rows: number
  /** Keys of the selected sides. */
  sides: string[]
  /** Length of the straight channel piece on every side, in mm: one of CHANNEL.straights. */
  straight: number
  /** Vertex key where the supply connects, or null to pick one automatically. */
  power: string | null
}

export const DEFAULT_DESIGN: Design = {
  cols: GRID_LIMITS.default,
  rows: GRID_LIMITS.default,
  sides: [],
  straight: CHANNEL.defaultStraight,
  power: null,
}

const STORAGE_KEY = 'hex-lights:design'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** A column or row count within GRID_LIMITS; anything unreadable is the default. */
export function gridCount(value: unknown): number {
  const n = Math.round(Number(value))

  return value != null && Number.isFinite(n) ? clamp(n, GRID_LIMITS.min, GRID_LIMITS.max) : GRID_LIMITS.default
}

/** The power input, if a selected side still touches it. */
function keepPower(power: string | null, selected: ReadonlySet<string>, allSides: readonly Side[]): string | null {
  const touched = allSides.some((s) => selected.has(s.key) && (s.a.key === power || s.b.key === power))

  return touched ? power : null
}

/**
 * Adds or removes a side. A power input left on no selected side is dropped,
 * so it doesn't reappear when sides are added back later.
 */
export function toggleSide(design: Design, key: string, allSides: readonly Side[]): Design {
  const sides = design.sides.includes(key) ? design.sides.filter((k) => k !== key) : [...design.sides, key]

  return { ...design, sides, power: keepPower(design.power, new Set(sides), allSides) }
}

/**
 * Changes the honeycomb size. The origin stays put, so sides keep their keys;
 * sides that no longer fit are dropped, along with a power input on them.
 */
export function resizeGrid(design: Design, cols: number, rows: number): Design {
  const grid = buildGrid(gridCount(cols), gridCount(rows))
  const fits = new Set(grid.sides.map((s) => s.key))
  const sides = design.sides.filter((k) => fits.has(k))

  return { ...design, cols: grid.cols, rows: grid.rows, sides, power: keepPower(design.power, new Set(sides), grid.sides) }
}

/**
 * Reads a saved design, dropping anything that doesn't fit its grid.
 * Designs saved before v0.3 have no size: 4 × 4. Designs saved before v0.5
 * have a free side length in metres instead of a straight piece: they get
 * the straight piece that comes closest.
 */
export function parseDesign(raw: string | null): Design {
  let data: Partial<Design> & { sideLength?: unknown } = {}

  try {
    data = JSON.parse(raw ?? '{}') ?? {}
  } catch {
    return DEFAULT_DESIGN
  }

  const legacyLength = Number(data.sideLength)
  const straight = CHANNEL.straights.includes(Number(data.straight))
    ? Number(data.straight)
    : data.sideLength != null && Number.isFinite(legacyLength) ? nearestStraight(legacyLength) : CHANNEL.defaultStraight
  const sides = Array.isArray(data.sides) ? data.sides.filter((k) => typeof k === 'string') : []
  const design: Design = {
    ...DEFAULT_DESIGN,
    sides: [...new Set(sides)],
    straight,
    power: typeof data.power === 'string' ? data.power : null,
  }

  return resizeGrid(design, gridCount(data.cols), gridCount(data.rows))
}

export function loadDesign(): Design {
  try {
    return parseDesign(localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_DESIGN
  }
}

export function saveDesign(design: Design) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(design))
  } catch {
    // Private mode or storage full: the design just won't survive a reload.
  }
}
