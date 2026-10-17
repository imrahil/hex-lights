import { STRIP } from '../lib/parts'

const SPECS: [string, string][] = [
  ['Model', STRIP.model],
  ['Voltage', `${STRIP.volts}V DC`],
  ['Colour', STRIP.colour],
  ['Density', `${STRIP.ledsPerMeter} LEDs/m`],
  ['Power', `~${STRIP.wattsPerMeter}W/m`],
  ['Width', `${STRIP.widthMm}mm`],
]

export function StripSpecs() {
  return (
    <section className="rounded-xl bg-slate-800 p-5 text-white shadow-lg">
      <h2 className="mb-3 text-lg font-bold">LED Strip Specs</h2>
      <dl className="space-y-2 text-sm">
        {SPECS.map(([term, value]) => (
          <div key={term} className="flex justify-between">
            <dt className="text-slate-400">{term}:</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
