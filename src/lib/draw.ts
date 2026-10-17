import type { Grid, Point, Side, View, WiringPlan } from '../types'
import { CANVAS, hexCorners } from './grid'
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

export function drawPattern(ctx: CanvasRenderingContext2D, grid: Grid, selected: ReadonlySet<string>) {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height)

  for (const hex of grid.hexes) {
    hexPath(ctx, hex, grid.size)
    ctx.fillStyle = COLORS.hexFill
    ctx.fill()
    ctx.strokeStyle = COLORS.hexLine
    ctx.lineWidth = 2
    ctx.stroke()
  }

  for (const side of grid.sides) {
    if (selected.has(side.key)) {
      line(ctx, side.a, side.b, COLORS.strip, 6)
    }
  }
}

export interface SchematicInput {
  grid: Grid
  sides: readonly Side[]
  plan: WiringPlan
  junctions: ReadonlyMap<string, Junction>
  view: View
}

export function drawSchematic(ctx: CanvasRenderingContext2D, { grid, sides, plan, junctions, view }: SchematicInput) {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height)

  if (sides.length === 0) {
    label(ctx, 'Select sides above to see wiring diagram', { x: CANVAS.width / 2, y: CANVAS.height / 2 }, '14px sans-serif', COLORS.endCap)

    return
  }

  ctx.save()
  applyView(ctx, view)

  // Faint outline of the whole honeycomb for orientation.
  ctx.globalAlpha = 0.3

  for (const hex of grid.hexes) {
    hexPath(ctx, hex, grid.size)
    ctx.strokeStyle = COLORS.ghostLine
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.globalAlpha = 1

  for (const side of sides) {
    line(ctx, side.a, side.b, COLORS.strip, 8)
  }

  plan.jumpers.forEach((jumper, i) => {
    ctx.setLineDash([8, 6])
    line(ctx, jumper.from, jumper.to, COLORS.jumper, 3)
    ctx.setLineDash([])

    const mid = { x: (jumper.from.x + jumper.to.x) / 2, y: (jumper.from.y + jumper.to.y) / 2 }
    const text = `J${i + 1}`

    ctx.font = 'bold 10px sans-serif'

    const width = ctx.measureText(text).width + 8

    ctx.fillStyle = COLORS.jumperFill
    ctx.fillRect(mid.x - width / 2, mid.y - 9, width, 18)
    ctx.strokeStyle = COLORS.jumper
    ctx.lineWidth = 1
    ctx.strokeRect(mid.x - width / 2, mid.y - 9, width, 18)
    label(ctx, text, mid, 'bold 10px sans-serif', COLORS.jumper)
  })

  // Flow direction arrow and order number on every strip.
  plan.runs.forEach((run, i) => {
    const mid = { x: (run.from.x + run.to.x) / 2, y: (run.from.y + run.to.y) / 2 }
    const angle = Math.atan2(run.to.y - run.from.y, run.to.x - run.from.x)

    ctx.beginPath()
    ctx.moveTo(mid.x + 10 * Math.cos(angle), mid.y + 10 * Math.sin(angle))
    ctx.lineTo(mid.x - 7 * Math.cos(angle - 0.5), mid.y - 7 * Math.sin(angle - 0.5))
    ctx.lineTo(mid.x - 7 * Math.cos(angle + 0.5), mid.y - 7 * Math.sin(angle + 0.5))
    ctx.closePath()
    ctx.fillStyle = COLORS.flow
    ctx.fill()

    const badge = { x: mid.x + 14 * Math.cos(angle + Math.PI / 2), y: mid.y + 14 * Math.sin(angle + Math.PI / 2) }

    ctx.beginPath()
    ctx.arc(badge.x, badge.y, 9, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = COLORS.flow
    ctx.lineWidth = 2
    ctx.stroke()
    label(ctx, String(i + 1), badge, 'bold 10px sans-serif', COLORS.flow)
  })

  for (const { vertex, sides: count } of junctions.values()) {
    const isStart = vertex.key === plan.start?.key

    ctx.beginPath()
    ctx.arc(vertex.x, vertex.y, isStart ? 12 : 7, 0, Math.PI * 2)
    ctx.fillStyle = isStart ? COLORS.power : count === 1 ? COLORS.endCap : COLORS.joint
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    if (isStart) {
      label(ctx, '+', vertex, 'bold 12px sans-serif', '#fff')
      label(ctx, `${STRIP.volts}V DC`, { x: vertex.x, y: vertex.y - 20 }, 'bold 11px sans-serif', COLORS.powerText)
    }
  }

  ctx.restore()
  drawLegend(ctx, view.zoom)
}

/** Fixed to the canvas, unaffected by zoom and pan. */
function drawLegend(ctx: CanvasRenderingContext2D, zoom: number) {
  const x = 15
  const y = CANVAS.height - 85

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
  ctx.fillText(`Zoom: ${Math.round(zoom * 100)}%`, CANVAS.width - 15, CANVAS.height - 10)
}
