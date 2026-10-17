import type { Extent, Grid, Point, Side, View, WiringPlan } from '../types'
import { coverOutline, type Cover } from './covers'
import { bounds, formatMeters, jumperLengths, patternSize, type Bounds, type Size } from './dimensions'
import { hexCorners } from './grid'
import { STRIP } from './parts'
import { applyView } from './view'
import type { Junction } from './wiring'

const COLORS = {
  hexFill: '#f8fafc',
  hexLine: '#cbd5e1',
  ghostLine: '#e2e8f0',
  strip: '#fbbf24',
  jumper: '#ef4444',
  jumperFill: '#fef2f2',
  flow: '#1e40af',
  power: '#22c55e',
  powerText: '#166534',
  joint: '#3b82f6',
  endCap: '#94a3b8',
  text: '#334155',
  muted: '#64748b',
  dimension: '#475569',
  extension: '#94a3b8',
  cover: '#0369a1',
  coverFill: 'rgba(186, 230, 253, 0.6)',
}

function hexPath(ctx: CanvasRenderingContext2D, center: Point, size: number) {
  const corners = hexCorners(center, size)

  ctx.beginPath()
  ctx.moveTo(corners[0].x, corners[0].y)

  for (const corner of corners.slice(1)) {
    ctx.lineTo(corner.x, corner.y)
  }

  ctx.closePath()
}

function line(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, width: number) {
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.stroke()
}

function label(ctx: CanvasRenderingContext2D, text: string, at: Point, font: string, color: string) {
  ctx.fillStyle = color
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, at.x, at.y)
}

/**
 * How much to enlarge lines and text, in canvas units, so they keep a
 * readable size when a big grid's canvas is shown small. `unitsPerPixel` is
 * canvas units per CSS pixel on screen.
 */
export function uiScale(unitsPerPixel: number): number {
  return Math.max(1, unitsPerPixel * 0.9)
}

const font = (px: number, k: number, weight = 'bold') => `${weight} ${px * k}px sans-serif`

/** `covers`: also outline every transparent cover, with its code. */
export function drawPattern(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  sides: readonly Side[],
  sideLength: number,
  k = 1,
  covers: readonly Cover[] = [],
) {
  ctx.clearRect(0, 0, grid.width, grid.height)

  for (const hex of grid.hexes) {
    hexPath(ctx, hex, grid.size)
    ctx.fillStyle = COLORS.hexFill
    ctx.fill()
    ctx.strokeStyle = COLORS.hexLine
    ctx.lineWidth = 2 * k
    ctx.stroke()
  }

  for (const side of sides) {
    line(ctx, side.a, side.b, COLORS.strip, 6 * k)
  }

  drawCovers(ctx, covers, k)

  const box = bounds(sides)
  const size = patternSize(sides, grid.size, sideLength)

  if (box && size) {
    drawDimensions(ctx, box, size, grid, k)
  }
}

function drawCovers(ctx: CanvasRenderingContext2D, covers: readonly Cover[], k: number) {
  for (const cover of covers) {
    const [first, ...rest] = coverOutline(cover.from, cover.to, cover.ends, 7 * k)

    ctx.beginPath()
    ctx.moveTo(first.x, first.y)

    for (const p of rest) {
      ctx.lineTo(p.x, p.y)
    }

    ctx.closePath()
    ctx.fillStyle = COLORS.coverFill
    ctx.fill()
    ctx.strokeStyle = COLORS.cover
    ctx.lineWidth = 1.2 * k
    ctx.lineJoin = 'miter'
    ctx.stroke()
  }

  // Codes last, so no outline crosses one.
  for (const cover of covers) {
    const mid = { x: (cover.from.x + cover.to.x) / 2, y: (cover.from.y + cover.to.y) / 2 }

    ctx.beginPath()
    ctx.arc(mid.x, mid.y, 8 * k, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.cover
    ctx.fill()
    label(ctx, cover.type.code, mid, font(10, k), '#fff')
  }
}

/** Gap between the pattern and its dimension lines, in canvas units. Fixed: the grid margins are sized for it. */
const DIMENSION_OFFSET = 18

/**
 * Width below the pattern and height to its left, like a technical drawing.
 * Either flips to the other side when it would leave the canvas.
 */
function drawDimensions(ctx: CanvasRenderingContext2D, box: Bounds, size: Size, canvas: Extent, k: number) {
  if (size.width > 0) {
    const below = box.max.y + DIMENSION_OFFSET + 10 <= canvas.height
    const y = below ? box.max.y + DIMENSION_OFFSET : box.min.y - DIMENSION_OFFSET
    const edge = below ? box.max.y : box.min.y

    extension(ctx, { x: box.min.x, y: edge }, { x: box.min.x, y }, k)
    extension(ctx, { x: box.max.x, y: edge }, { x: box.max.x, y }, k)
    dimension(ctx, { x: box.min.x, y }, { x: box.max.x, y }, formatMeters(size.width), k)
  }

  if (size.height > 0) {
    const left = box.min.x - DIMENSION_OFFSET - 10 >= 0
    const x = left ? box.min.x - DIMENSION_OFFSET : box.max.x + DIMENSION_OFFSET
    const edge = left ? box.min.x : box.max.x

    extension(ctx, { x: edge, y: box.min.y }, { x, y: box.min.y }, k)
    extension(ctx, { x: edge, y: box.max.y }, { x, y: box.max.y }, k)
    dimension(ctx, { x, y: box.min.y }, { x, y: box.max.y }, formatMeters(size.height), k)
  }
}

function extension(ctx: CanvasRenderingContext2D, from: Point, to: Point, k: number) {
  ctx.setLineDash([3 * k, 3 * k])
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.strokeStyle = COLORS.extension
  ctx.lineWidth = k
  ctx.stroke()
  ctx.setLineDash([])
}

/** A measured line with end ticks and its length on a pill in the middle, turned to run along it. */
function dimension(ctx: CanvasRenderingContext2D, from: Point, to: Point, text: string, k: number) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const tick = { x: 5 * k * Math.cos(angle + Math.PI / 4), y: 5 * k * Math.sin(angle + Math.PI / 4) }

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)

  for (const end of [from, to]) {
    ctx.moveTo(end.x - tick.x, end.y - tick.y)
    ctx.lineTo(end.x + tick.x, end.y + tick.y)
  }

  ctx.strokeStyle = COLORS.dimension
  ctx.lineWidth = 1.5 * k
  ctx.lineCap = 'butt'
  ctx.stroke()

  ctx.save()
  ctx.translate((from.x + to.x) / 2, (from.y + to.y) / 2)
  // Keep text upright: vertical lines read bottom to top.
  ctx.rotate(Math.abs(angle) > Math.PI / 4 ? -Math.PI / 2 : 0)
  ctx.font = font(11, k)

  const width = ctx.measureText(text).width + 10 * k

  ctx.fillStyle = '#fff'
  ctx.fillRect(-width / 2, -8 * k, width, 16 * k)
  ctx.strokeStyle = COLORS.extension
  ctx.lineWidth = k
  ctx.strokeRect(-width / 2, -8 * k, width, 16 * k)
  label(ctx, text, { x: 0, y: 0 }, font(11, k), COLORS.dimension)
  ctx.restore()
}

export interface SchematicInput {
  grid: Grid
  sides: readonly Side[]
  plan: WiringPlan
  junctions: ReadonlyMap<string, Junction>
  view: View
  /** Metres per hexagon side, for jumper lengths. */
  sideLength: number
  /** Line and text enlargement, from uiScale(). */
  k?: number
}

export function drawSchematic(ctx: CanvasRenderingContext2D, { grid, sides, plan, junctions, view, sideLength, k = 1 }: SchematicInput) {
  const canvas: Extent = grid

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (sides.length === 0) {
    label(ctx, 'Select sides above to see wiring diagram', { x: canvas.width / 2, y: canvas.height / 2 }, font(14, k, 'normal'), COLORS.endCap)

    return
  }

  ctx.save()
  applyView(ctx, view, canvas)

  // Faint outline of the whole honeycomb for orientation.
  ctx.globalAlpha = 0.3

  for (const hex of grid.hexes) {
    hexPath(ctx, hex, grid.size)
    ctx.strokeStyle = COLORS.ghostLine
    ctx.lineWidth = k
    ctx.stroke()
  }

  ctx.globalAlpha = 1

  for (const side of sides) {
    line(ctx, side.a, side.b, COLORS.strip, 8 * k)
  }

  const lengths = jumperLengths(plan.jumpers, grid.size, sideLength)

  plan.jumpers.forEach((jumper, i) => {
    ctx.setLineDash([8 * k, 6 * k])
    line(ctx, jumper.from, jumper.to, COLORS.jumper, 3 * k)
    ctx.setLineDash([])

    const mid = { x: (jumper.from.x + jumper.to.x) / 2, y: (jumper.from.y + jumper.to.y) / 2 }
    const text = `J${i + 1} · ${formatMeters(lengths[i])}`

    ctx.font = font(10, k)

    const width = ctx.measureText(text).width + 8 * k

    ctx.fillStyle = COLORS.jumperFill
    ctx.fillRect(mid.x - width / 2, mid.y - 9 * k, width, 18 * k)
    ctx.strokeStyle = COLORS.jumper
    ctx.lineWidth = k
    ctx.strokeRect(mid.x - width / 2, mid.y - 9 * k, width, 18 * k)
    label(ctx, text, mid, font(10, k), COLORS.jumper)
  })

  // Flow direction arrow and order number on every strip.
  plan.runs.forEach((run, i) => {
    const mid = { x: (run.from.x + run.to.x) / 2, y: (run.from.y + run.to.y) / 2 }
    const angle = Math.atan2(run.to.y - run.from.y, run.to.x - run.from.x)
    const at = (r: number, a: number) => ({ x: mid.x + r * k * Math.cos(a), y: mid.y + r * k * Math.sin(a) })
    const tip = at(10, angle)
    const left = at(-7, angle - 0.5)
    const right = at(-7, angle + 0.5)

    ctx.beginPath()
    ctx.moveTo(tip.x, tip.y)
    ctx.lineTo(left.x, left.y)
    ctx.lineTo(right.x, right.y)
    ctx.closePath()
    ctx.fillStyle = COLORS.flow
    ctx.fill()

    const badge = at(14, angle + Math.PI / 2)

    ctx.beginPath()
    ctx.arc(badge.x, badge.y, 9 * k, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = COLORS.flow
    ctx.lineWidth = 2 * k
    ctx.stroke()
    label(ctx, String(i + 1), badge, font(10, k), COLORS.flow)
  })

  for (const { vertex, sides: count } of junctions.values()) {
    const isStart = vertex.key === plan.start?.key

    ctx.beginPath()
    ctx.arc(vertex.x, vertex.y, (isStart ? 12 : 7) * k, 0, Math.PI * 2)
    ctx.fillStyle = isStart ? COLORS.power : count === 1 ? COLORS.endCap : COLORS.joint
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2 * k
    ctx.stroke()

    if (isStart) {
      label(ctx, '+', vertex, font(12, k), '#fff')
      label(ctx, `${STRIP.volts}V DC`, { x: vertex.x, y: vertex.y - 20 * k }, font(11, k), COLORS.powerText)
    }
  }

  ctx.restore()
  drawLegend(ctx, view.zoom, canvas, k)
}

/** Fixed to the canvas, unaffected by zoom and pan. Drawn from the bottom corners, enlarged by `k`. */
function drawLegend(ctx: CanvasRenderingContext2D, zoom: number, canvas: Extent, k: number) {
  ctx.save()
  ctx.translate(0, canvas.height)
  ctx.scale(k, k)

  const x = 15
  const y = -85

  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.fillRect(10, y - 10, 200, 90)
  ctx.strokeStyle = COLORS.ghostLine
  ctx.lineWidth = 1
  ctx.strokeRect(10, y - 10, 200, 90)

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 11px sans-serif'
  ctx.fillText('Legend:', x, y + 2)

  ctx.fillStyle = COLORS.strip
  ctx.fillRect(x, y + 12, 24, 5)
  ctx.fillStyle = COLORS.text
  ctx.font = '11px sans-serif'
  ctx.fillText('LED Strip', x + 30, y + 18)

  ctx.beginPath()
  ctx.arc(x + 12, y + 35, 7, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.power
  ctx.fill()
  ctx.fillStyle = COLORS.text
  ctx.fillText('Power input (click to set)', x + 30, y + 38)

  ctx.setLineDash([5, 4])
  line(ctx, { x, y: y + 55 }, { x: x + 24, y: y + 55 }, COLORS.jumper, 3)
  ctx.setLineDash([])
  ctx.fillStyle = COLORS.text
  ctx.fillText('Jumper wire', x + 30, y + 58)

  ctx.fillStyle = COLORS.muted
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`Zoom: ${Math.round(zoom * 100)}%`, canvas.width / k - 15, -10)
  ctx.restore()
}
