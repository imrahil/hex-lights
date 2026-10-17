import { SIDE_LENGTH } from '../lib/design'
import { Panel } from './ui'

export function SideLengthSlider({ value, onChange }: { value: number; onChange: (meters: number) => void }) {
  return (
    <Panel>
      <label htmlFor="side-length" className="mb-2 block text-sm font-medium text-slate-700">
        Side Length: <span className="font-bold text-amber-600">{value.toFixed(2)} m</span>
      </label>
      <input
        id="side-length"
        type="range"
        min={SIDE_LENGTH.min}
        max={SIDE_LENGTH.max}
        step={SIDE_LENGTH.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-500"
      />
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>{SIDE_LENGTH.min} m</span>
        <span>{SIDE_LENGTH.max} m</span>
      </div>
    </Panel>
  )
}
