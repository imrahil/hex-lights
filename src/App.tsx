import { useEffect, useMemo, useState } from 'react'
import { CoversCard } from './components/CoversCard'
import { GridSizeControl } from './components/GridSizeControl'
import { PatternCanvas } from './components/PatternCanvas'
import { PrintPartsCard } from './components/PrintPartsCard'
import { SchematicCanvas } from './components/SchematicCanvas'
import { ShoppingList } from './components/ShoppingList'
import { ChannelSlider } from './components/ChannelSlider'
import { StripSpecs } from './components/StripSpecs'
import { Summary } from './components/Summary'
import { covers } from './lib/covers'
import { loadDesign, resizeGrid, saveDesign, toggleSide } from './lib/design'
import { jumperLengths, patternSize } from './lib/dimensions'
import { buildGrid } from './lib/grid'
import { billOfMaterials, printParts, sideLengthOf } from './lib/parts'
import { junctions, planWiring } from './lib/wiring'

export function App() {
  const [design, setDesign] = useState(loadDesign)

  useEffect(() => saveDesign(design), [design])

  const grid = useMemo(() => buildGrid(design.cols, design.rows), [design.cols, design.rows])
  const selected = useMemo(() => new Set(design.sides), [design.sides])
  const sides = useMemo(() => grid.sides.filter((s) => selected.has(s.key)), [grid, selected])
  const joints = useMemo(() => junctions(sides), [sides])
  const plan = useMemo(() => planWiring(sides, design.power), [sides, design.power])
  const parts = useMemo(() => printParts(sides), [sides])
  const coverList = useMemo(() => covers(sides), [sides])
  const sideLength = sideLengthOf(design.straight)
  const bill = billOfMaterials(sides.length, sideLength)
  const size = patternSize(sides, grid.size, sideLength)
  const jumpers = jumperLengths(plan.jumpers, grid.size, sideLength)

  const onToggleSide = (key: string) => setDesign((d) => toggleSide(d, key, grid.sides))

  const togglePower = (key: string) => setDesign((d) => ({ ...d, power: d.power === key ? null : key }))

  const reset = () => setDesign((d) => ({ ...d, sides: [], power: null }))

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <h1 className="mb-6 text-3xl font-bold text-slate-800">Hexagon Garage Light Calculator</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <PatternCanvas grid={grid} sides={sides} covers={coverList} sideLength={sideLength} onToggle={onToggleSide} />
            <SchematicCanvas grid={grid} sides={sides} sideLength={sideLength} plan={plan} junctions={joints} onPickPower={togglePower} />
            <GridSizeControl cols={design.cols} rows={design.rows} onChange={(cols, rows) => setDesign((d) => resizeGrid(d, cols, rows))} />
            <ChannelSlider value={design.straight} onChange={(straight) => setDesign((d) => ({ ...d, straight }))} />
          </div>

          <div className="space-y-4">
            <Summary strips={sides.length} size={size} bill={bill} jumpers={plan.jumpers.length} onReset={reset} />
            <PrintPartsCard parts={parts} straight={design.straight} />
            <CoversCard covers={coverList} sideLength={sideLength} />
            <StripSpecs />
            <ShoppingList bill={bill} jumperLengths={jumpers} />
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Hex Lights v{__APP_VERSION__}
        </footer>
      </main>
    </div>
  )
}
