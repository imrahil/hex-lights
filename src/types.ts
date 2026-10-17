export interface Point {
  x: number
  y: number
}

/** A hexagon corner. Corners shared by neighbouring hexagons are one vertex. */
export interface Vertex extends Point {
  key: string
}

/** A hexagon edge: one LED strip in its own 3D-printed channel. Shared edges are one side. */
export interface Side {
  key: string
  a: Vertex
  b: Vertex
}

export interface Hex extends Point {
  row: number
  col: number
}

export interface Grid {
  size: number
  hexes: Hex[]
  sides: Side[]
}

/** A side in the order and direction the current flows through it. */
export interface Run {
  key: string
  from: Vertex
  to: Vertex
}

/** A wire joining the end of one continuous run to the start of the next. */
export interface Jumper {
  from: Vertex
  to: Vertex
}

export interface WiringPlan {
  /** Where the 12 V supply connects; null when nothing is selected. */
  start: Vertex | null
  runs: Run[]
  jumpers: Jumper[]
}

/** Zoom and pan of the schematic, in canvas units. */
export interface View {
  zoom: number
  pan: Point
}
