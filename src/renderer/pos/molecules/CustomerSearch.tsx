import { useState, useCallback, useEffect, useRef } from 'react'
import type { Customer } from '@shared/types'
import { useCountry } from '@renderer/shared/hooks/useCountry'

interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void
  selectedCustomer: Customer | null
}

export default function CustomerSearch({ onSelect, selectedCustomer }: CustomerSearchProps): JSX.Element {
  const country = useCountry()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setShowDropdown(false); return }
    setSearching(true)
    try {
      const res = await window.electronAPI.searchCustomers(q.trim())
      if (res.success && res.data) {
        setResults(res.data.filter(c => c.active).slice(0, 8))
        setShowDropdown(true)
      }
    } catch { /* ignore */ }
    finally { setSearching(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { search(query) }, 250)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (selectedCustomer) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
        <div>
          <p className="text-body-sm font-medium text-ink">{selectedCustomer.name}</p>
          <p className="text-caption text-muted font-mono">{selectedCustomer.taxId}</p>
        </div>
        <button
          onClick={() => { onSelect(null); setQuery('') }}
          className="rounded px-2 py-1 text-caption text-muted hover:text-error hover:bg-error/10"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
        placeholder={`Buscar por ${country.taxIdLabel} o nombre...`}
        className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-body-sm text-ink
          placeholder:text-muted-soft focus:border-primary focus:outline-none"
      />

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface-card shadow-lg max-h-48 overflow-y-auto">
          {searching && (
            <p className="px-3 py-2 text-caption text-muted-soft">Buscando...</p>
          )}
          {!searching && results.length === 0 && (
            <p className="px-3 py-2 text-caption text-muted-soft">Sin resultados</p>
          )}
          {!searching && results.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); setQuery(''); setShowDropdown(false) }}
              className="w-full px-3 py-2 text-left hover:bg-surface-soft transition-colors"
            >
              <p className="text-body-sm text-ink">{c.name}</p>
              <p className="text-caption text-muted font-mono">{c.taxId}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
