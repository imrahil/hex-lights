import { useCallback, useRef, type MouseEvent } from 'react'
import { Move, Zap, ZoomIn, ZoomOut } from 'lucide-react'
import type { Grid, Side, WiringPlan } from '../types'
import { useCanvas } from '../hooks/useCanvas'
import { useZoomPan } from '../hooks/useZoomPan'
import { drawSchematic } from '../lib/draw'
import { CANVAS, vertexAt } from '../lib/grid'
import { toCanvas, toWorld } from '../lib/view'
import type { Junction } from '../lib/wiring'
import { Hint, IconButton, Panel } from './ui'

export function SchematicCanvas({ grid, sides, plan, junctions, onPickPower }: {
  grid: Grid
  sides: readonly Side[]
  plan: WiringPlan
  junctions: ReadonlyMap<string, Junction>
  onPickPower: (vertexKey: string) => void
}) {
  // useZoomPan needs the element for its wheel listener; useCanvas owns the ref, so bridge them.
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { view, dragging, zoomBy, reset, consumeDrag, handlers } = useZoomPan(canvasRef)
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => drawSchematic(ctx, { grid, sides, plan, junctions, view }),
    [grid, sides, plan, junctions, view],
  )
  const drawRef = useCanvas(draw)

  const setRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas
    drawRef.current = canvas
  }, [drawRef])

  const onClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (consumeDrag()) {
      return
    }

    const point = toWorld(toCanvas({ x: e.clientX, y: e.clientY }, e.currentTarget.getBoundingClientRect()), view)
    const vertex = vertexAt([...junctions.values()].map((j) => j.vertex), point)

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
        className="mx-auto block w-full max-w-[620px] touch-none rounded-lg border border-slate-200 bg-slate-50"
        style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}`, cursor: dragging ? 'grabbing' : 'grab' }}
      />
      <Hint>Scroll to zoom • Drag to pan • Click vertex to set power input</Hint>
    </Panel>
  )
}
