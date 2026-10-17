import { useEffect, useRef, useState } from 'react'
import type { Extent } from '../types'

/**
 * A canvas drawn in `extent` logical units, at the size it is shown (times
 * the device pixel ratio) so lines stay sharp at any size. `draw` gets the
 * context, already scaled to logical units, and how many logical units one
 * CSS pixel spans. It runs whenever it changes, so pass a memoised callback.
 */
export function useCanvas(draw: (ctx: CanvasRenderingContext2D, unitsPerPixel: number) => void, { width, height }: Extent) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [shownWidth, setShownWidth] = useState(0)

  useEffect(() => {
    const canvas = ref.current

    if (!canvas) {
      return
    }

    const observer = new ResizeObserver(([entry]) => setShownWidth(entry.contentRect.width))

    observer.observe(canvas)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx || shownWidth === 0) {
      return
    }

    const scale = (shownWidth * (window.devicePixelRatio || 1)) / width

    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    draw(ctx, width / shownWidth)
  }, [draw, width, height, shownWidth])

  return ref
}
