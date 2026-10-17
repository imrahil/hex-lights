import { useCallback, useRef, type MouseEvent } from 'react'
import { Move, Zap, ZoomIn, ZoomOut } from 'lucide-react'
import type { Grid, Side, WiringPlan } from '../types'
import { useCanvas } from '../hooks/useCanvas'
import { useZoomPan } from '../hooks/useZoomPan'
import { drawSchematic, uiScale } from '../lib/draw'
import { vertexAt } from '../lib/grid'
import { hitTolerance, toCanvas, toWorld } from '../lib/view'
import type { Junction } from '../lib/wiring'
import { canvasStyle, Hint, IconButton, Panel } from './ui'

export function SchematicCanvas({ grid, sides, sideLength, plan, junctions, onPickPower }: {
  grid: Grid
  sides: readonly Side[]
  sideLength: number
  plan: WiringPlan
  junctions: ReadonlyMap<string, Junction>
  onPickPower: (vertexKey: string) => void
}) {
  // useZoomPan needs the element for its wheel listener; useCanvas owns the ref, so bridge them.
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { view, dragging, zoomBy, reset, consumeDrag, handlers } = useZoomPan(canvasRef, grid.width)
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, unitsPerPixel: number) => drawSchematic(ctx, { grid, sides, plan, junctions, view, sideLength, k: uiScale(unitsPerPixel) }),
    [grid, sides, plan, junctions, view, sideLength],
  )
  const drawRef = useCanvas(draw, grid)

  const setRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas
    drawRef.current = canvas
  }, [drawRef])

  const onClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (consumeDrag()) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const point = toWorld(toCanvas({ x: e.clientX, y: e.clientY }, rect, grid), view, grid)
    const tolerance = hitTolerance(15, 12, rect, grid) / view.zoom
    const vertex = vertexAt([...junctions.values()].map((j) => j.vertex), point, tolerance)

    if (vertex) {
      onPickPower(vertex.key)
    }
  }

  return (
    <Panel
      title="Wiring Schematic"
      icon={<Zap className="h-4 w-4 text-blue-500" />}
      actions={(
        <>
          <IconButton label="Zoom in" onClick={() => zoomBy(1.2)}>
            <ZoomIn size={16} />
          </IconButton>
          <IconButton label="Zoom out" onClick={() => zoomBy(0.8)}>
            <ZoomOut size={16} />
          </IconButton>
          <IconButton label="Reset view" onClick={reset}>
            <Move size={16} />
          </IconButton>
        </>
      )}
    >
      <canvas
        ref={setRef}
        onClick={onClick}
        {...handlers}
        data-testid="schematic"
        aria-label="Wiring schematic. Scroll to zoom, drag to pan, click a junction to set the power input."
        className="mx-auto block touch-none rounded-lg border border-slate-200 bg-slate-50"
        style={{ ...canvasStyle(grid), cursor: dragging ? 'grabbing' : 'grab' }}
      />
      <Hint>Scroll to zoom • Drag to pan • Click vertex to set power input</Hint>
    </Panel>
  )
}
