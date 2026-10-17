import type { ReactNode } from 'react'
import type { PrintParts } from '../lib/parts'

function PartRow({ id, icon, label, count }: { id: string; icon: ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-purple-800">{label}</span>
      </div>
      <span data-testid={id} className="text-xl font-bold text-purple-700">{count}</span>
    </div>
  )
}

function PathIcon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="text-purple-500" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PrintPartsCard({ parts, sideLength }: { parts: PrintParts; sideLength: number }) {
  return (
    <section className="rounded-xl border-2 border-purple-200 bg-purple-50 p-5 shadow-lg">
      <h2 className="mb-3 text-lg font-bold text-purple-900">🖨️ 3D Print Parts</h2>
      <div className="space-y-2">
        <PartRow id="part-straight" icon={<div className="h-1 w-8 rounded bg-purple-500" />} label="Straight channels" count={parts.straight} />
        <PartRow id="part-corners" icon={<PathIcon d="M4 12 L12 12 L20 4" />} label="Corners (120°)" count={parts.corners} />
        <PartRow id="part-three-way" icon={<PathIcon d="M12 4 L12 12 M12 12 L4 18 M12 12 L20 18" />} label="3-way connectors" count={parts.threeWay} />
        <PartRow id="part-end-caps" icon={<div className="h-3 w-4 rounded-r bg-purple-500" />} label="End caps" count={parts.endCaps} />
      </div>
      <p className="mt-3 text-xs text-purple-600">
        Channel length: {(sideLength * 100).toFixed(0)} cm each
      </p>
    </section>
  )
}
