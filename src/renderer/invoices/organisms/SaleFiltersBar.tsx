import { useState } from 'react'
import type { SaleFilters } from '@shared/types'

interface SaleFiltersBarProps {
  filters: SaleFilters
  onChange: (filters: SaleFilters) => void
}

export default function SaleFiltersBar({ filters, onChange }: SaleFiltersBarProps): JSX.Element {
  const [from, setFrom] = useState(filters.from ?? '')
  const [to, setTo] = useState(filters.to ?? '')
  const [method, setMethod] = useState(filters.paymentMethod ?? '')

  const apply = (): void => {
    onChange({
      ...filters,
      from: from || undefined,
      to: to ? `${to}T23:59:59` : undefined,
      paymentMethod: method || undefined
    })
  }

  const clear = (): void => {
    setFrom(''); setTo(''); setMethod('')
    onChange({ limit: 50 })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-hairline bg-canvas px-6 py-3">
      <div className="flex items-center gap-2">
        <label className="text-caption text-muted">Desde</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="rounded border border-hairline bg-canvas px-2 py-1 text-caption text-ink focus:border-primary focus:outline-none" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-caption text-muted">Hasta</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="rounded border border-hairline bg-canvas px-2 py-1 text-caption text-ink focus:border-primary focus:outline-none" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-caption text-muted">Método</label>
        <select value={method} onChange={e => setMethod(e.target.value)}
          className="rounded border border-hairline bg-canvas px-2 py-1 text-caption text-ink focus:border-primary focus:outline-none">
          <option value="">Todos</option>
          <option value="CASH">Efectivo</option>
          <option value="TRANSFER">Transferencia</option>
          <option value="DEBIT_CARD">Débito</option>
          <option value="CREDIT_CARD">Crédito</option>
          <option value="DIVISA">Divisa</option>
          <option value="MIXED">—</option>
        </select>
      </div>
      <button onClick={apply}
        className="rounded-md bg-primary px-3 py-1 text-caption text-on-primary hover:opacity-90">
        Filtrar
      </button>
      <button onClick={clear}
        className="rounded-md border border-hairline px-3 py-1 text-caption text-muted hover:text-ink">
        Limpiar
      </button>
      <p className="text-caption text-muted-soft ml-auto">
        Últimas {filters.limit ?? 50} ventas
      </p>
    </div>
  )
}
