import { useCallback, type MouseEvent } from 'react'
import type { Grid, Side } from '../types'
import { useCanvas } from '../hooks/useCanvas'
import { drawPattern } from '../lib/draw'
import { CANVAS, sideAt } from '../lib/grid'
import { toCanvas } from '../lib/view'
import { Hint, Panel } from './ui'

export function PatternCanvas({ grid, sides, sideLength, onToggle }: {
  grid: Grid
  sides: readonly Side[]
  sideLength: number
  onToggle: (sideKey: string) => void
}) {
  const draw = useCallback((ctx: CanvasRenderingContext2D) => drawPattern(ctx, grid, sides, sideLength), [grid, sides, sideLength])
  const ref = useCanvas(draw)

  const onClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const point = toCanvas({ x: e.clientX, y: e.clientY }, e.currentTarget.getBoundingClientRect())
    const side = sideAt(grid.sides, point)

    if (side) {
      onToggle(side.key)
    }
  }

  return (
    <Panel title="Design Your Pattern">
      <canvas
        ref={ref}
        onClick={onClick}
        data-testid="pattern"
        aria-label="Honeycomb pattern. Click a hexagon side to add or remove an LED strip."
        className="mx-auto block w-full max-w-[620px] cursor-crosshair rounded-lg border border-slate-200 bg-white"
        style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}` }}
      />
      <Hint>Click on hexagon sides to select/deselect them</Hint>
    </Panel>
  )
}
