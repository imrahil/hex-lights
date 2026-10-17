import type { ReactNode } from 'react'

export function Panel({ title, icon, actions, children, className = '' }: {
  title?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-lg ${className}`}>
      {(title || actions) && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-semibold text-slate-600">{title}</h2>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200"
    >
      {children}
    </button>
  )
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-center text-sm text-slate-500">{children}</p>
}
