import type { Point, View } from '../types'
import { CANVAS } from './grid'

export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 3

export const DEFAULT_VIEW: View = { zoom: 1, pan: { x: 0, y: 0 } }

export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM)
}

/** A pointer position in canvas units (the canvas is scaled with CSS). */
export function toCanvas(client: Point, rect: DOMRect): Point {
  return {
    x: ((client.x - rect.left) * CANVAS.width) / rect.width,
    y: ((client.y - rect.top) * CANVAS.height) / rect.height,
  }
}

/** Zoom about the canvas centre, then pan. */
export function applyView(ctx: CanvasRenderingContext2D, { zoom, pan }: View) {
  ctx.translate(CANVAS.width / 2 + pan.x, CANVAS.height / 2 + pan.y)
  ctx.scale(zoom, zoom)
  ctx.translate(-CANVAS.width / 2, -CANVAS.height / 2)
}

/** The inverse of applyView: a canvas point back to drawing coordinates. */
export function toWorld(p: Point, { zoom, pan }: View): Point {
  return {
    x: (p.x - CANVAS.width / 2 - pan.x) / zoom + CANVAS.width / 2,
    y: (p.y - CANVAS.height / 2 - pan.y) / zoom + CANVAS.height / 2,
  }
}
