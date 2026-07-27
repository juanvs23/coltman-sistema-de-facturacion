import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@renderer/shared/hooks/useAuth'
import { useCountry } from '@renderer/shared/hooks/useCountry'
import OpenRegisterModal from '../organisms/OpenRegisterModal'
import CloseRegisterModal from '../organisms/CloseRegisterModal'
import CashMovementForm from '../organisms/CashMovementForm'

interface CashRegisterData {
  id: string
  openingBalance: number
  closingBalance?: number
  closedAt?: string
  openedAt: string
  movements: Array<{
    id: string
    type: string
    amount: number
    description?: string
    createdAt: string
    user?: { fullName: string }
  }>
  openedBy?: { fullName: string }
  closedBy?: { fullName: string }
  shiftConfig?: { id: string; name: string; startTime: string; endTime: string } | null
}

interface CashSummary {
  registers: CashRegisterData[]
  sales: Array<{ payments: Array<{ method: string; amountBs: number }> }>
}

function toDateInput(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export default function CashRegisterPage(): JSX.Element {
  const { session } = useAuth()
  const { currencySymbol } = useCountry()
  const [summary, setSummary] = useState<CashSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showOpen, setShowOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showMovement, setShowMovement] = useState(false)
  const [selectedShiftIdx, setSelectedShiftIdx] = useState(0)

  // Date navigation
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => toDateInput(today))
  const isToday = viewDate === toDateInput(today)
  const autoNavigated = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.getCashSummary({ date: viewDate })
      if (res.success && res.data) {
        const raw = res.data as Record<string, unknown>
        const registers = (raw.registers as CashRegisterData[]) ?? (raw.register ? [raw.register as CashRegisterData] : [])
        setSummary({ registers, sales: (raw.sales ?? []) as CashSummary['sales'] })
        setSelectedShiftIdx(0)

        // If no registers for this date, check if there's an active register
        // from another date and auto-navigate to it (once per mount)
        if (registers.length === 0 && !autoNavigated.current) {
          const activeRes = await window.electronAPI.getActiveCashRegister()
          if (activeRes.success && activeRes.data) {
            const activeDate = new Date(activeRes.data.openedAt)
            const activeDateStr = toDateInput(activeDate)
            if (activeDateStr !== viewDate) {
              autoNavigated.current = true
              setViewDate(activeDateStr)
              return // load() will re-fire via the viewDate change
            }
          }
        }
      } else {
        setError(res.error ?? 'Error al cargar')
      }
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [viewDate])

  useEffect(() => { load() }, [load])

  const registers = summary?.registers ?? []
  const selectedRegister = registers[selectedShiftIdx] ?? null
  const isOpen = selectedRegister && !selectedRegister.closingBalance

  // Check if there's any open register (backend también valida)
  const anyOpen = registers.some(r => !r.closingBalance)
  const hasRegisters = registers.length > 0

  // Sales totals for the selected register
  const registerCreatedAt = selectedRegister ? new Date(selectedRegister.createdAt) : null
  const registerClosedAt = selectedRegister?.closedAt ? new Date(selectedRegister.closedAt) : null
  const registerSales = (summary?.sales ?? []).filter(s => {
    if (!registerCreatedAt) return false
    // Find the oldest payment creation time to determine if sale is within register window
    const saleDate = new Date(s.payments?.[0]?.createdAt ?? registerCreatedAt)
    if (!registerClosedAt) return saleDate >= registerCreatedAt
    return saleDate >= registerCreatedAt && saleDate <= registerClosedAt
  })

  // If no register-specific filter works, fallback to all sales for the day
  const displaySales = registerSales.length > 0 ? registerSales : (summary?.sales ?? [])

  const salesByMethod = displaySales.reduce((acc, s) => {
    for (const p of s.payments) {
      acc[p.method] = (acc[p.method] ?? 0) + p.amountBs
    }
    return acc
  }, {} as Record<string, number>)

  const salesTotal = Object.values(salesByMethod).reduce((sum, v) => sum + v, 0)

  // Expected cash per register
  const incomeMovements = (selectedRegister?.movements ?? [])
    .filter(m => m.type === 'INCOME')
    .reduce((sum, m) => sum + m.amount, 0)
  const expenseMovements = (selectedRegister?.movements ?? [])
    .filter(m => m.type === 'EXPENSE')
    .reduce((sum, m) => sum + m.amount, 0)
  const openingAmount = selectedRegister?.openingBalance ?? 0
  const expectedCash = openingAmount + salesTotal + incomeMovements - expenseMovements

  // Next turno number
  const nextTurno = registers.length + 1

  // Daily totals (all registers)
  const dailySalesByMethod = (summary?.sales ?? []).reduce((acc, s) => {
    for (const p of s.payments) {
      acc[p.method] = (acc[p.method] ?? 0) + p.amountBs
    }
    return acc
  }, {} as Record<string, number>)
  const dailySalesTotal = Object.values(dailySalesByMethod).reduce((sum, v) => sum + v, 0)

  const goToday = (): void => setViewDate(toDateInput(new Date()))
  const goPrevDay = (): void => {
    const d = new Date(viewDate)
    d.setDate(d.getDate() - 1)
    setViewDate(toDateInput(d))
  }
  const goNextDay = (): void => {
    const d = new Date(viewDate)
    d.setDate(d.getDate() + 1)
    if (d <= today) setViewDate(toDateInput(d))
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-soft/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline bg-canvas px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-title-md text-ink">Arqueo de Caja</h2>

          {/* Date navigation */}
          <div className="flex items-center gap-1 rounded-lg border border-hairline px-2 py-1">
            <button onClick={goPrevDay} className="p-1 text-muted hover:text-ink">&larr;</button>
            <input
              type="date"
              value={viewDate}
              max={toDateInput(today)}
              onChange={(e) => setViewDate(e.target.value)}
              className="w-36 text-center text-body-sm text-ink bg-transparent border-none outline-none [color-scheme:var(--color-scheme)]"
            />
            <button onClick={goNextDay} className="p-1 text-muted hover:text-ink disabled:opacity-30"
              disabled={viewDate === toDateInput(today)}>&rarr;</button>
            {!isToday && (
              <button onClick={goToday} className="ml-1 text-caption text-primary hover:underline">Hoy</button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!anyOpen && (
            <button onClick={() => setShowOpen(true)}
              className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary hover:opacity-90">
              Abrir caja
            </button>
          )}
          {isToday && isOpen && (
            <>
              <button onClick={() => setShowMovement(true)}
                className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted hover:text-ink">
                + Movimiento
              </button>
              <button onClick={() => setShowClose(true)}
                className="rounded-md bg-warning px-4 py-2 text-body-sm text-on-primary hover:opacity-90">
                Cerrar turno
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
            {error} <button onClick={load} className="ml-2 underline">Reintentar</button>
          </div>
        )}

        {loading && <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>}

        {/* Empty state — no registers for this date */}
        {!loading && !hasRegisters && isToday && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-title-sm text-muted-soft mb-2">Sin turnos hoy</p>
            <p className="text-body-sm text-muted-soft mb-4">Aún no se ha abierto caja</p>
            <button onClick={() => setShowOpen(true)}
              className="rounded-md bg-primary px-6 py-3 text-body-sm text-on-primary hover:opacity-90">
              Abrir caja
            </button>
          </div>
        )}

        {!loading && !hasRegisters && !isToday && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-title-sm text-muted-soft mb-2">Sin registros</p>
            <p className="text-body-sm text-muted-soft">No hay turnos de caja para esta fecha</p>
          </div>
        )}

        {!loading && hasRegisters && (
          <div className="space-y-6 max-w-2xl">
            {/* Daily summary */}
            <div className="rounded-lg border border-hairline bg-surface-card p-4">
              <p className="text-caption text-muted mb-2">Resumen del día</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-body-sm text-muted">Turnos</p>
                  <p className="text-title-sm text-ink">{registers.length}</p>
                </div>
                <div>
                  <p className="text-body-sm text-muted">Ventas totales</p>
                  <p className="text-title-sm text-ink">{currencySymbol} {dailySalesTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-body-sm text-muted">Aperturas</p>
                  <p className="text-title-sm text-ink">{currencySymbol} {registers.reduce((s, r) => s + r.openingBalance, 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Shift selector tabs */}
            {registers.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {registers.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedShiftIdx(i)}
                    className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                      i === selectedShiftIdx
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-card text-muted border border-hairline hover:text-ink'
                    }`}
                  >
                    Turno {i + 1}
                    {!r.closingBalance ? ' (Activo)' : ''}
                  </button>
                ))}
              </div>
            )}

            {/* Selected register card */}
            <div className={`rounded-lg border p-4 ${
              isOpen ? 'border-success/30 bg-success/5' : 'border-hairline bg-surface-card'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-body-sm font-medium text-ink">
                    Turno {selectedShiftIdx + 1}
                    {selectedRegister?.shiftConfig && (
                      <span className="text-muted font-normal ml-1">— {selectedRegister.shiftConfig.name}</span>
                    )}
                  </p>
                  <p className="text-caption text-muted">
                    {selectedRegister?.shiftConfig
                      ? `${selectedRegister.shiftConfig.startTime} a ${selectedRegister.shiftConfig.endTime}`
                      : ''}
                    {selectedRegister?.openedBy && (
                      <> · Abrió: {selectedRegister.openedBy.fullName}</>
                    )}
                    {selectedRegister?.closedAt && (
                      <> · Cerró: {new Date(selectedRegister.closedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-caption font-medium ${
                  isOpen ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
                }`}>
                  {isOpen ? 'Activo' : 'Cerrado'}
                </span>
              </div>

              {/* Balances */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="rounded-lg border border-hairline bg-canvas p-3">
                  <p className="text-caption text-muted">Apertura</p>
                  <p className="text-title-sm text-ink">{currencySymbol} {openingAmount.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-hairline bg-canvas p-3">
                  <p className="text-caption text-muted">Ventas</p>
                  <p className="text-title-sm text-ink">{currencySymbol} {salesTotal.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-hairline bg-canvas p-3">
                  <p className="text-caption text-muted">Esperado</p>
                  <p className="text-title-sm text-ink">{currencySymbol} {expectedCash.toFixed(2)}</p>
                </div>
              </div>

              {/* Sales by method */}
              {Object.keys(salesByMethod).length > 0 && (
                <div className="mb-4">
                  <p className="text-caption text-muted mb-1">Ventas por método</p>
                  <div className="space-y-1">
                    {Object.entries(salesByMethod).map(([method, total]) => (
                      <div key={method} className="flex justify-between text-body-sm">
                        <span className="text-muted">{method}</span>
                        <span className="text-ink">{currencySymbol} {total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Movements log */}
              {(selectedRegister?.movements ?? []).length > 0 && (
                <div>
                  <p className="text-caption text-muted mb-2">Movimientos</p>
                  <div className="space-y-1.5">
                    {selectedRegister!.movements.map(m => (
                      <div key={m.id} className="flex items-center justify-between text-body-sm border-b border-hairline/50 pb-1.5 last:border-0">
                        <div>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium mr-2 ${
                            m.type === 'OPENING' ? 'bg-primary/10 text-primary' :
                            m.type === 'CLOSING' ? 'bg-muted/10 text-muted' :
                            m.type === 'INCOME' ? 'bg-success/10 text-success' :
                            'bg-error/10 text-error'
                          }`}>
                            {m.type === 'OPENING' ? 'Apertura' : m.type === 'CLOSING' ? 'Cierre' :
                             m.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                          </span>
                          <span className="text-muted">{m.description || '—'}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-medium ${m.type === 'EXPENSE' ? 'text-error' : 'text-ink'}`}>
                            {m.type === 'EXPENSE' ? '−' : '+'}{currencySymbol} {m.amount.toFixed(2)}
                          </span>
                          <p className="text-[10px] text-muted-soft">
                            {new Date(m.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                            {m.user?.fullName ? ` · ${m.user.fullName}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Closer info */}
              {selectedRegister?.closedBy && (
                <div className="mt-4 pt-3 border-t border-hairline">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-muted">Cerrada por</span>
                    <span className="text-ink font-medium">{selectedRegister.closedBy.fullName}</span>
                  </div>
                  <div className="flex justify-between text-body-sm">
                    <span className="text-muted">Cierre</span>
                    <span className="text-ink">{currencySymbol} {selectedRegister.closingBalance?.toFixed(2)}</span>
                  </div>
                  {selectedRegister.closingBalance != null && expectedCash > 0 && (
                    <div className="flex justify-between text-body-sm">
                      <span className="text-muted">Diferencia</span>
                      <span className={Math.abs(selectedRegister.closingBalance - expectedCash) > 1 ? 'text-error font-medium' : 'text-success font-medium'}>
                        {currencySymbol} {(selectedRegister.closingBalance - expectedCash).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showOpen && (
        <OpenRegisterModal
          turno={nextTurno}
          onConfirm={async (data) => {
            const res = await window.electronAPI.openRegister(data)
            if (!res.success) {
              alert(res.error ?? 'Error al abrir caja')
              return
            }
            setShowOpen(false)
            load()
            window.dispatchEvent(new CustomEvent('register:changed'))
          }}
          onCancel={() => setShowOpen(false)}
        />
      )}

      {showClose && selectedRegister && (
        <CloseRegisterModal
          expectedCash={expectedCash}
          onConfirm={async (data) => {
            const res = await window.electronAPI.closeRegister({
              registerId: selectedRegister.id,
              closingBalance: data.closingBalance,
              date: data.date,
              time: data.time,
              userId: session?.userId ?? ''
            })
            if (!res.success) {
              alert(res.error ?? 'Error al cerrar caja')
              return
            }
            setShowClose(false)
            load()
            window.dispatchEvent(new CustomEvent('register:changed'))
          }}
          onCancel={() => setShowClose(false)}
        />
      )}

      {showMovement && selectedRegister && (
        <CashMovementForm
          registerId={selectedRegister.id}
          userId={session?.userId ?? ''}
          onDone={() => { setShowMovement(false); load() }}
          onCancel={() => setShowMovement(false)}
        />
      )}
    </div>
  )
}
