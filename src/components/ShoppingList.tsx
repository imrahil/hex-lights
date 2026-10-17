import type { ReactNode } from 'react'
import { STRIP, type Bill } from '../lib/parts'

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start">
      <span className="mr-2 text-green-600">✓</span>
      <span>{children}</span>
    </li>
  )
}

export function ShoppingList({ bill, jumpers }: { bill: Bill; jumpers: number }) {
  return (
    <section className="rounded-xl border-2 border-green-200 bg-green-50 p-5 shadow-lg">
      <h2 className="mb-3 text-lg font-bold text-green-900">Shopping List</h2>
      <ul className="space-y-2 text-sm" data-testid="shopping-list">
        <Item><strong>{bill.stripMeters} m</strong> LED COB strip (buy {bill.reelMeters} m)</Item>
        <Item><strong>{STRIP.volts}V DC</strong> power supply ({bill.supplyAmps} A minimum)</Item>
        <Item>3D print filament for channels</Item>
        {jumpers > 0 && (
          <Item><strong>{jumpers}</strong> jumper wire{jumpers > 1 ? 's' : ''} (2-conductor)</Item>
        )}
      </ul>
    </section>
  )
}
