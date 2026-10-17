import { describe, expect, it } from 'vitest'
import type { Point, View } from '../types'
import { CANVAS } from './grid'
import { applyView, clampZoom, MAX_ZOOM, MIN_ZOOM, toCanvas, toWorld } from './view'

/** Records applyView's transform as a function, the way the canvas would apply it. */
function forward(view: View): (p: Point) => Point {
  const steps: ((p: Point) => Point)[] = []
  const ctx = {
    translate: (dx: number, dy: number) => steps.push((p) => ({ x: p.x + dx, y: p.y + dy })),
    scale: (sx: number, sy: number) => steps.push((p) => ({ x: p.x * sx, y: p.y * sy })),
  }

  applyView(ctx as unknown as CanvasRenderingContext2D, view)

  // Canvas transforms compose so the last call applies to the point first.
  return (p) => steps.reduceRight((q, step) => step(q), p)
}

describe('toWorld', () => {
  it('undoes applyView', () => {
    const view = { zoom: 1.7, pan: { x: 40, y: -25 } }
    const p = { x: 123, y: 456 }
    const back = toWorld(forward(view)(p), view)

    expect(back.x).toBeCloseTo(p.x)
    expect(back.y).toBeCloseTo(p.y)
  })

  it('zooms about the canvas centre', () => {
    const center = { x: CANVAS.width / 2, y: CANVAS.height / 2 }

    expect(toWorld(center, { zoom: 2.5, pan: { x: 0, y: 0 } })).toEqual(center)
  })
})

describe('toCanvas', () => {
  it('scales CSS pixels to canvas units', () => {
    const rect = { left: 10, top: 20, width: CANVAS.width / 2, height: CANVAS.height / 2 } as DOMRect

    expect(toCanvas({ x: 60, y: 70 }, rect)).toEqual({ x: 100, y: 100 })
  })
})

describe('clampZoom', () => {
  it('keeps zoom within limits', () => {
    expect(clampZoom(0.1)).toBe(MIN_ZOOM)
    expect(clampZoom(10)).toBe(MAX_ZOOM)
    expect(clampZoom(1.2)).toBe(1.2)
  })
})
