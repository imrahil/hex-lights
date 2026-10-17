import { RotateCcw } from 'lucide-react'
import type { Bill } from '../lib/parts'

function Stat({ id, label, value, tone }: { id: string; label: string; value: string; tone: string }) {
  return (
    <div className={`flex items-center justify-between rounded-lg p-3 ${tone}`}>
      <span>{label}</span>
      <span data-testid={id} className="text-2xl font-bold">{value}</span>
    </div>
  )
}

export function Summary({ strips, bill, jumpers, onReset }: {
  strips: number
  bill: Bill
  jumpers: number
  onReset: () => void
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
      <h2 className="mb-4 text-lg font-bold text-slate-800">Calculations</h2>
      <div className="space-y-3">
        <Stat id="strips" label="LED Strips" value={String(strips)} tone="bg-slate-50 text-slate-700" />
        <Stat id="length" label="Total Length" value={`${bill.length.toFixed(2)} m`} tone="bg-amber-50 text-amber-700" />
        <Stat id="power" label="Total Power" value={`${bill.watts.toFixed(1)} W`} tone="bg-red-50 text-red-700" />
        <Stat id="jumpers" label="Jumper Wires" value={String(jumpers)} tone="bg-orange-50 text-orange-700" />
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-200"
      >
        <RotateCcw size={16} />
        Reset Selection
      </button>
    </section>
  )
}
