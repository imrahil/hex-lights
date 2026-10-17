import type { Extent, Point, View } from '../types'

export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 3

export const DEFAULT_VIEW: View = { zoom: 1, pan: { x: 0, y: 0 } }

export function clampZoom(zoom: number): number {
  return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM)
}

/** A pointer position in canvas units (the canvas is scaled with CSS). */
export function toCanvas(client: Point, rect: DOMRect, canvas: Extent): Point {
  return {
    x: ((client.x - rect.left) * canvas.width) / rect.width,
    y: ((client.y - rect.top) * canvas.height) / rect.height,
  }
}

/**
 * How far from a target a click may land, in canvas units: `units`, or
 * `cssPixels` on screen when the canvas is shown smaller than its logical
 * size, so big grids stay easy to hit.
 */
export function hitTolerance(units: number, cssPixels: number, rect: DOMRect, canvas: Extent): number {
  return Math.max(units, (cssPixels * canvas.width) / rect.width)
}

/** Zoom about the canvas centre, then pan. */
export function applyView(ctx: CanvasRenderingContext2D, { zoom, pan }: View, canvas: Extent) {
  ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y)
  ctx.scale(zoom, zoom)
  ctx.translate(-canvas.width / 2, -canvas.height / 2)
}

/** The inverse of applyView: a canvas point back to drawing coordinates. */
export function toWorld(p: Point, { zoom, pan }: View, canvas: Extent): Point {
  return {
    x: (p.x - canvas.width / 2 - pan.x) / zoom + canvas.width / 2,
    y: (p.y - canvas.height / 2 - pan.y) / zoom + canvas.height / 2,
  }
}
