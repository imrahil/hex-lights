import { useEffect, useRef } from 'react'
import { CANVAS } from '../lib/grid'

/**
 * A canvas of CANVAS logical units, backed at the device pixel ratio so lines
 * stay sharp on HiDPI screens. `draw` runs whenever it changes, so pass a
 * memoised callback.
 */
export function useCanvas(draw: (ctx: CanvasRenderingContext2D) => void) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')

    if (!canvas || !ctx) {
      return
    }

    const dpr = window.devicePixelRatio || 1

    canvas.width = CANVAS.width * dpr
    canvas.height = CANVAS.height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw(ctx)
  }, [draw])

  return ref
}
