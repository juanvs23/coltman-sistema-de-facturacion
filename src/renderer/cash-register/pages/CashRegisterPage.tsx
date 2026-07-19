import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@renderer/shared/hooks/useAuth'
import OpenRegisterModal from '../organisms/OpenRegisterModal'
import CloseRegisterModal from '../organisms/CloseRegisterModal'
import CashMovementForm from '../organisms/CashMovementForm'

interface CashRegisterData {
  id: string
  openingBalance: number
  closingBalance?: number
  closedAt?: string
  date: string
  createdAt: string
  movements: Array<{
    id: string
    type: string
    amount: number
    description?: string
    createdAt: string
    user?: { fullName: string }
  }>
  closedBy?: { fullName: string }
}

interface CashSummary {
  register: CashRegisterData | null
  sales: Array<{ paymentMethod: string; total: number }>
}

export default function CashRegisterPage(): JSX.Element {
  const { session } = useAuth()
  const [summary, setSummary] = useState<CashSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showOpen, setShowOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showMovement, setShowMovement] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.getCashSummary()
      if (res.success && res.data) {
        setSummary(res.data as CashSummary)
      } else {
        setError(res.error ?? 'Error al cargar')
      }
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const register = summary?.register
  const isOpen = register && !register.closingBalance
  const isClosed = register && register.closingBalance

  // Calculate sales totals
  const salesByMethod = (summary?.sales ?? []).reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total
    return acc
  }, {} as Record<string, number>)

  const salesTotal = Object.values(salesByMethod).reduce((sum, v) => sum + v, 0)

  // Calculate expected cash
  const incomeMovements = (register?.movements ?? [])
    .filter(m => m.type === 'INCOME')
    .reduce((sum, m) => sum + m.amount, 0)
  const expenseMovements = (register?.movements ?? [])
    .filter(m => m.type === 'EXPENSE')
    .reduce((sum, m) => sum + m.amount, 0)
  const openingAmount = register?.openingBalance ?? 0
  const expectedCash = openingAmount + salesTotal + incomeMovements - expenseMovements

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-soft/50">
      <div className="flex items-center justify-between border-b border-hairline bg-canvas px-6 py-4">
        <h2 className="text-title-md text-ink">Arqueo de Caja</h2>
        <div className="flex gap-2">
          {!isOpen && !isClosed && (
            <button onClick={() => setShowOpen(true)}
              className="rounded-md bg-primary px-4 py-2 text-body-sm text-on-primary hover:opacity-90">
              Abrir caja
            </button>
          )}
          {isOpen && (
            <>
              <button onClick={() => setShowMovement(true)}
                className="rounded-md border border-hairline px-4 py-2 text-body-sm text-muted hover:text-ink">
                + Movimiento
              </button>
              <button onClick={() => setShowClose(true)}
                className="rounded-md bg-warning px-4 py-2 text-body-sm text-on-primary hover:opacity-90">
                Cerrar caja
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

        {!loading && !register && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-title-sm text-muted-soft mb-2">Caja cerrada</p>
            <p className="text-body-sm text-muted-soft mb-4">No hay caja abierta para hoy</p>
            <button onClick={() => setShowOpen(true)}
              className="rounded-md bg-primary px-6 py-3 text-body-sm text-on-primary hover:opacity-90">
              Abrir caja
            </button>
          </div>
        )}

        {!loading && register && (
          <div className="space-y-6 max-w-2xl">
            {/* Status card */}
            <div className={`rounded-lg border p-4 ${
              isOpen ? 'border-success/30 bg-success/5' : 'border-hairline bg-surface-card'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm font-medium text-ink">
                    {isOpen ? 'Caja abierta' : 'Caja cerrada'}
                  </p>
                  <p className="text-caption text-muted">
                    {new Date(register.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long' })}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-caption font-medium ${
                  isOpen ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
                }`}>
                  {isOpen ? 'Activa' : 'Cerrada'}
                </span>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-caption text-muted">Apertura</p>
                <p className="text-title-sm text-ink">Bs. {openingAmount.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-caption text-muted">Ventas del día</p>
                <p className="text-title-sm text-ink">Bs. {salesTotal.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-caption text-muted">Esperado en caja</p>
                <p className="text-title-sm text-ink">Bs. {expectedCash.toFixed(2)}</p>
              </div>
            </div>

            {/* Sales by method */}
            {Object.keys(salesByMethod).length > 0 && (
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-body-sm font-medium text-ink mb-2">Ventas por método</p>
                <div className="space-y-1">
                  {Object.entries(salesByMethod).map(([method, total]) => (
                    <div key={method} className="flex justify-between text-body-sm">
                      <span className="text-muted">{method}</span>
                      <span className="text-ink">Bs. {total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movements log */}
            {(register.movements ?? []).length > 0 && (
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-body-sm font-medium text-ink mb-3">Movimientos</p>
                <div className="space-y-2">
                  {register.movements.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-body-sm border-b border-hairline/50 pb-2 last:border-0">
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
                          {m.type === 'EXPENSE' ? '−' : '+'}Bs. {m.amount.toFixed(2)}
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
            {register.closedBy && (
              <div className="rounded-lg border border-hairline bg-surface-card p-4">
                <p className="text-caption text-muted">Cerrada por</p>
                <p className="text-body-sm text-ink">{register.closedBy.fullName}</p>
                <p className="text-caption text-muted-soft">
                  Cierre: Bs. {register.closingBalance?.toFixed(2)}
                  {register.closingBalance != null && expectedCash > 0 && (
                    <span className={Math.abs(register.closingBalance - expectedCash) > 1 ? 'text-error' : 'text-success'}>
                      {' · Diferencia: Bs. '}{(register.closingBalance - expectedCash).toFixed(2)}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showOpen && (
        <OpenRegisterModal
          onConfirm={async (balance: number) => {
            await window.electronAPI.openRegister(balance)
            setShowOpen(false)
            load()
          }}
          onCancel={() => setShowOpen(false)}
        />
      )}

      {showClose && register && (
        <CloseRegisterModal
          expectedCash={expectedCash}
          onConfirm={async (closingBalance: number) => {
            await window.electronAPI.closeRegister(register.id, closingBalance, session?.userId ?? '')
            setShowClose(false)
            load()
          }}
          onCancel={() => setShowClose(false)}
        />
      )}

      {showMovement && register && (
        <CashMovementForm
          registerId={register.id}
          userId={session?.userId ?? ''}
          onDone={() => { setShowMovement(false); load() }}
          onCancel={() => setShowMovement(false)}
        />
      )}
    </div>
  )
}
