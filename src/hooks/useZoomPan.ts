import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { Point, View } from '../types'
import { CANVAS } from '../lib/grid'
import { clampZoom, DEFAULT_VIEW } from '../lib/view'

/** Pointer travel (CSS px) before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 4

interface Drag {
  start: Point
  pan: Point
  /** CSS px to canvas units. */
  scale: number
  moved: boolean
}

/** Wheel to zoom, drag to pan. A drag never ends in a click. */
export function useZoomPan(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [view, setView] = useState<View>(DEFAULT_VIEW)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<Drag | null>(null)
  const justDragged = useRef(false)

  const zoomBy = useCallback((factor: number) => {
    setView((v) => ({ ...v, zoom: clampZoom(v.zoom * factor) }))
  }, [])

  const reset = useCallback(() => setView(DEFAULT_VIEW), [])

  // React's onWheel is passive, so it can't stop the page from scrolling.
  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomBy(e.deltaY > 0 ? 0.9 : 1.1)
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => canvas.removeEventListener('wheel', onWheel)
  }, [canvasRef, zoomBy])

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) {
      return
    }

    drag.current = {
      start: { x: e.clientX, y: e.clientY },
      pan: view.pan,
      scale: CANVAS.width / e.currentTarget.getBoundingClientRect().width,
      moved: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current

    if (!d) {
      return
    }

    const dx = e.clientX - d.start.x
    const dy = e.clientY - d.start.y

    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
      return
    }

    if (!d.moved) {
      d.moved = true
      setDragging(true)
    }

    setView((v) => ({ ...v, pan: { x: d.pan.x + dx * d.scale, y: d.pan.y + dy * d.scale } }))
  }

  const onPointerUp = () => {
    justDragged.current = drag.current?.moved ?? false
    drag.current = null
    setDragging(false)
  }

  /** Call from onClick: true when this click is the release of a drag. */
  const consumeDrag = () => {
    const dragged = justDragged.current

    justDragged.current = false

    return dragged
  }

  return {
    view,
    dragging,
    zoomBy,
    reset,
    consumeDrag,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
