import { useEffect, useMemo, useState } from 'react'
import { PatternCanvas } from './components/PatternCanvas'
import { PrintPartsCard } from './components/PrintPartsCard'
import { SchematicCanvas } from './components/SchematicCanvas'
import { ShoppingList } from './components/ShoppingList'
import { SideLengthSlider } from './components/SideLengthSlider'
import { StripSpecs } from './components/StripSpecs'
import { Summary } from './components/Summary'
import { loadDesign, saveDesign } from './lib/design'
import { buildGrid } from './lib/grid'
import { billOfMaterials, printParts } from './lib/parts'
import { junctions, planWiring } from './lib/wiring'

const GRID = buildGrid()
const SIDE_KEYS = new Set(GRID.sides.map((s) => s.key))

export function App() {
  const [design, setDesign] = useState(() => loadDesign(SIDE_KEYS))

  useEffect(() => saveDesign(design), [design])

  const selected = useMemo(() => new Set(design.sides), [design.sides])
  const sides = useMemo(() => GRID.sides.filter((s) => selected.has(s.key)), [selected])
  const joints = useMemo(() => junctions(sides), [sides])
  const plan = useMemo(() => planWiring(sides, design.power), [sides, design.power])
  const parts = useMemo(() => printParts(sides), [sides])
  const bill = billOfMaterials(sides.length, design.sideLength)

  const toggleSide = (key: string) => setDesign((d) => ({
    ...d,
    sides: d.sides.includes(key) ? d.sides.filter((k) => k !== key) : [...d.sides, key],
  }))

  const togglePower = (key: string) => setDesign((d) => ({ ...d, power: d.power === key ? null : key }))

  const reset = () => setDesign((d) => ({ ...d, sides: [], power: null }))

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <h1 className="mb-6 text-3xl font-bold text-slate-800">Hexagon Garage Light Calculator</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <PatternCanvas grid={GRID} selected={selected} onToggle={toggleSide} />
            <SchematicCanvas grid={GRID} sides={sides} plan={plan} junctions={joints} onPickPower={togglePower} />
            <SideLengthSlider value={design.sideLength} onChange={(sideLength) => setDesign((d) => ({ ...d, sideLength }))} />
          </div>

          <div className="space-y-4">
            <Summary strips={sides.length} bill={bill} jumpers={plan.jumpers.length} onReset={reset} />
            <PrintPartsCard parts={parts} sideLength={design.sideLength} />
            <StripSpecs />
            <ShoppingList bill={bill} jumpers={plan.jumpers.length} />
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Hex Lights v{__APP_VERSION__}
        </footer>
      </main>
    </div>
  )
}
