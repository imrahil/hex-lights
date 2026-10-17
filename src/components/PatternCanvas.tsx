import { useCallback, type MouseEvent } from 'react'
import type { Grid, Side } from '../types'
import { useCanvas } from '../hooks/useCanvas'
import { drawPattern, uiScale } from '../lib/draw'
import { sideAt } from '../lib/grid'
import { hitTolerance, toCanvas } from '../lib/view'
import { canvasStyle, Hint, Panel } from './ui'

export function PatternCanvas({ grid, sides, sideLength, onToggle }: {
  grid: Grid
  sides: readonly Side[]
  sideLength: number
  onToggle: (sideKey: string) => void
}) {
  const draw = useCallback((ctx: CanvasRenderingContext2D, unitsPerPixel: number) => drawPattern(ctx, grid, sides, sideLength, uiScale(unitsPerPixel)), [grid, sides, sideLength])
  const ref = useCanvas(draw, grid)

  const onClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const point = toCanvas({ x: e.clientX, y: e.clientY }, rect, grid)
    const side = sideAt(grid.sides, point, hitTolerance(12, 10, rect, grid))

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
        className="mx-auto block cursor-crosshair rounded-lg border border-slate-200 bg-white"
        style={canvasStyle(grid)}
      />
      <Hint>Click on hexagon sides to select/deselect them</Hint>
    </Panel>
  )
}
