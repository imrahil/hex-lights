import { useCallback, useState, type MouseEvent } from 'react'
import { Layers } from 'lucide-react'
import type { Grid, Side } from '../types'
import type { Cover } from '../lib/covers'
import { useCanvas } from '../hooks/useCanvas'
import { drawPattern, uiScale } from '../lib/draw'
import { sideAt } from '../lib/grid'
import { hitTolerance, toCanvas } from '../lib/view'
import { canvasStyle, Hint, Panel } from './ui'

export function PatternCanvas({ grid, sides, covers, sideLength, onToggle }: {
  grid: Grid
  sides: readonly Side[]
  covers: readonly Cover[]
  sideLength: number
  onToggle: (sideKey: string) => void
}) {
  const [showCovers, setShowCovers] = useState(false)
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, unitsPerPixel: number) => drawPattern(ctx, grid, sides, sideLength, uiScale(unitsPerPixel), showCovers ? covers : []),
    [grid, sides, sideLength, covers, showCovers],
  )
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
    <Panel
      title="Design Your Pattern"
      actions={(
        <button
          type="button"
          aria-pressed={showCovers}
          onClick={() => setShowCovers((on) => !on)}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${showCovers ? 'bg-sky-700 text-white hover:bg-sky-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          <Layers size={14} />
          Show covers
        </button>
      )}
    >
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
