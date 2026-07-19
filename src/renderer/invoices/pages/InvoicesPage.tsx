import { useState, useEffect, useCallback } from 'react'
import type { Sale, SaleFilters } from '@shared/types'
import { useAuth } from '@renderer/shared/hooks/useAuth'
import SaleFiltersBar from '../organisms/SaleFiltersBar'
import SaleTable from '../organisms/SaleTable'
import SaleDetailModal from '../organisms/SaleDetailModal'
import CancelSaleModal from '../organisms/CancelSaleModal'

export default function InvoicesPage(): JSX.Element {
  const { session } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<SaleFilters>({ limit: 50 })
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [cancelling, setCancelling] = useState<Sale | null>(null)

  const load = useCallback(async (f: SaleFilters) => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.listSales(f)
      if (res.success && res.data) setSales(res.data)
      else setError(res.error ?? 'Error al cargar ventas')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(filters) }, [filters, load])

  const handleCancel = async (reason: string): Promise<void> => {
    if (!cancelling || !session) return
    const res = await window.electronAPI.cancelSale(cancelling.id, session.userId, reason)
    if (res.success) {
      setCancelling(null)
      load(filters)
    } else {
      throw new Error(res.error ?? 'Error al anular')
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-soft/50">
      <div className="border-b border-hairline bg-canvas px-6 py-4">
        <h2 className="text-title-md text-ink">Historial de Ventas</h2>
      </div>

      <SaleFiltersBar filters={filters} onChange={setFilters} />

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
            {error} <button onClick={() => load(filters)} className="ml-2 underline">Reintentar</button>
          </div>
        )}

        {loading && <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>}

        {!loading && sales.length === 0 && (
          <p className="text-body-sm text-muted-soft py-8 text-center">No hay ventas registradas</p>
        )}

        {!loading && sales.length > 0 && (
          <SaleTable
            sales={sales}
            onViewDetail={setSelectedSale}
            onCancel={setCancelling}
            currentUserId={session?.userId}
          />
        )}
      </div>

      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onCancel={() => { setCancelling(selectedSale); setSelectedSale(null) }}
          currentUserId={session?.userId}
        />
      )}

      {cancelling && (
        <CancelSaleModal
          sale={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setCancelling(null)}
        />
      )}
    </div>
  )
}
