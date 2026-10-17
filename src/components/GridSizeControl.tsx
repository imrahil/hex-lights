import { Minus, Plus } from 'lucide-react'
import { GRID_LIMITS } from '../lib/grid'
import { Panel } from './ui'

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const button = 'rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100'

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          disabled={value <= GRID_LIMITS.min}
          onClick={() => onChange(value - 1)}
          className={button}
        >
          <Minus size={16} />
        </button>
        <output aria-label={label} className="w-6 text-center text-lg font-bold text-slate-800">{value}</output>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          disabled={value >= GRID_LIMITS.max}
          onClick={() => onChange(value + 1)}
          className={button}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

export function GridSizeControl({ cols, rows, onChange }: {
  cols: number
  rows: number
  onChange: (cols: number, rows: number) => void
}) {
  return (
    <Panel title="Honeycomb">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-8">
        <Stepper label="Columns" value={cols} onChange={(c) => onChange(c, rows)} />
        <Stepper label="Rows" value={rows} onChange={(r) => onChange(cols, r)} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Shrinking removes strips that no longer fit.
      </p>
    </Panel>
  )
}
