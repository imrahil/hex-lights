import { CHANNEL, sideLengthOf } from '../lib/parts'
import { Panel } from './ui'

/** Picks the straight channel piece. The slider steps through the lengths that can be printed. */
export function ChannelSlider({ value, onChange }: { value: number; onChange: (straightMm: number) => void }) {
  const index = Math.max(0, CHANNEL.straights.indexOf(value))
  const side = Math.round(sideLengthOf(value) * 1000)

  return (
    <Panel>
      <label htmlFor="straight-channel" className="mb-1 block text-sm font-medium text-slate-700">
        Straight channel: <span className="font-bold text-amber-600">{value} mm</span>
      </label>
      <p className="mb-2 text-xs text-slate-500">
        Each side is {side} mm: the straight piece plus 2 × {CHANNEL.cornerArm} mm corner arms.
      </p>
      <input
        id="straight-channel"
        type="range"
        min={0}
        max={CHANNEL.straights.length - 1}
        step={1}
        value={index}
        aria-valuetext={`${value} mm`}
        onChange={(e) => onChange(CHANNEL.straights[Number(e.target.value)])}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-500"
      />
      {/* Each label sits under its stop; the end ones are pulled in so they stay inside. */}
      <div className="relative mt-1 h-4 text-xs text-slate-400" aria-hidden="true">
        {CHANNEL.straights.map((mm, i) => {
          const at = i / (CHANNEL.straights.length - 1)

          return (
            <span
              key={mm}
              className={`absolute ${mm === value ? 'font-bold text-amber-600' : ''}`}
              style={{ left: `${at * 100}%`, transform: `translateX(-${at * 100}%)` }}
            >
              {mm}
            </span>
          )
        })}
      </div>
    </Panel>
  )
}
