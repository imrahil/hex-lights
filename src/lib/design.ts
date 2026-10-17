export interface Design {
  /** Keys of the selected sides. */
  sides: string[]
  /** Length of one side in metres. */
  sideLength: number
  /** Vertex key where the supply connects, or null to pick one automatically. */
  power: string | null
}

export const DEFAULT_DESIGN: Design = { sides: [], sideLength: 0.5, power: null }

export const SIDE_LENGTH = { min: 0.1, max: 2, step: 0.05 }

const STORAGE_KEY = 'hex-lights:design'

/** Reads a saved design, dropping anything that doesn't fit the current grid. */
export function parseDesign(raw: string | null, validSides: ReadonlySet<string>): Design {
  let data: Partial<Design> = {}

  try {
    data = JSON.parse(raw ?? '{}') ?? {}
  } catch {
    return DEFAULT_DESIGN
  }

  const sides = Array.isArray(data.sides) ? [...new Set(data.sides.filter((k) => validSides.has(k)))] : []
  const length = Number(data.sideLength)

  return {
    sides,
    sideLength: Number.isFinite(length) ? Math.min(Math.max(length, SIDE_LENGTH.min), SIDE_LENGTH.max) : DEFAULT_DESIGN.sideLength,
    power: typeof data.power === 'string' ? data.power : null,
  }
}

export function loadDesign(validSides: ReadonlySet<string>): Design {
  try {
    return parseDesign(localStorage.getItem(STORAGE_KEY), validSides)
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
