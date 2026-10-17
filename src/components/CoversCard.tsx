import type { EndCut, Cover } from '../lib/covers'
import { coverCounts, coverOutline } from '../lib/covers'

/** The cover's outline in its catalogue orientation, as drawn on the pattern. */
export function CoverIcon({ ends }: { ends: [EndCut, EndCut] }) {
  const points = coverOutline({ x: 8, y: 12 }, { x: 64, y: 12 }, ends, 7)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')

  return (
    <svg width="72" height="24" viewBox="0 0 72 24" aria-hidden="true" className="shrink-0">
      <polygon points={points} className="fill-sky-200 stroke-sky-700" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  )
}

export function CoversCard({ covers, sideLength }: { covers: readonly Cover[]; sideLength: number }) {
  const counts = coverCounts(covers)

  return (
    <section className="rounded-xl border-2 border-sky-200 bg-sky-50 p-5 shadow-lg">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-sky-900">Transparent Covers</h2>
        <span data-testid="covers-total" className="text-xl font-bold text-sky-700">{covers.length}</span>
      </div>
      {counts.length === 0 && <p className="text-sm text-sky-700">Select sides to see which covers to print.</p>}
      <ul className="space-y-2">
        {counts.map(({ type, count }) => (
          <li key={type.code} className="flex items-center justify-between gap-2 rounded-lg bg-white p-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-700 text-xs font-bold text-white">
                {type.code}
              </span>
              <CoverIcon ends={type.ends} />
              <span className="text-sm text-sky-900">
                {type.name}
                {type.mirror && <span className="text-xs text-sky-600"> (mirror of {type.mirror})</span>}
              </span>
            </div>
            <span data-testid={`cover-${type.code}`} className="text-xl font-bold text-sky-700">{count}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-sky-700">
        One cover per strip, {Math.round(sideLength * 1000)} mm along its centre line. Angled ends meet one
        other cover, pointed ends meet two, flat ends stop at an end cap. Covers can't be flipped, so
        mirrored shapes are separate prints. Show covers on the pattern to see where each one goes.
      </p>
    </section>
  )
}
