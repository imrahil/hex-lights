import type { ReactNode } from 'react'
import { formatMeters } from '../lib/dimensions'
import { STRIP, type Bill } from '../lib/parts'

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start">
      <span className="mr-2 text-green-600">✓</span>
      <span>{children}</span>
    </li>
  )
}

export function ShoppingList({ bill, jumperLengths }: { bill: Bill; jumperLengths: number[] }) {
  const jumpers = jumperLengths.length
  const jumperCable = jumperLengths.reduce((sum, l) => sum + l, 0)

  return (
    <section className="rounded-xl border-2 border-green-200 bg-green-50 p-5 shadow-lg">
      <h2 className="mb-3 text-lg font-bold text-green-900">Shopping List</h2>
      <ul className="space-y-2 text-sm" data-testid="shopping-list">
        <Item><strong>{bill.stripMeters} m</strong> LED COB strip (buy {bill.reelMeters} m)</Item>
        <Item>
          <strong>{STRIP.volts}V DC</strong> power supply ({bill.supplyAmps} A minimum, {bill.recommendedAmps} A recommended)
        </Item>
        <Item>3D print filament for channels</Item>
        {jumpers > 0 && (
          <Item>
            <strong>{jumpers}</strong> jumper wire{jumpers > 1 ? 's' : ''} (2-conductor, at least {formatMeters(jumperCable)} in total)
          </Item>
        )}
      </ul>
      {bill.needsInjection && (
        <p data-testid="injection-warning" className="mt-3 rounded-lg bg-amber-100 p-2 text-xs text-amber-800">
          ⚠ Over {STRIP.maxFeedMeters} m of strip on one chain: the far end will dim. Feed power at both ends,
          or run an extra pair of supply wires to a point every {STRIP.maxFeedMeters} m.
        </p>
      )}
    </section>
  )
}
