import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Product, Sale, DocumentType, QuotationData } from '@shared/types'
import { useNavigation } from '../../shared/hooks/useNavigation'
import { useAuth } from '../../shared/hooks/useAuth'
import { useInactivityLock } from '../../shared/hooks/useInactivityLock'
import { useActiveCashRegister } from '../../shared/hooks/useActiveCashRegister'
import LockOverlay from '../../auth/organisms/LockOverlay'
import TopBar from '../organisms/TopBar'
import Sidebar from '../organisms/Sidebar'
import ContentArea from '../organisms/ContentArea'
import BarcodeInput from '../organisms/BarcodeInput'
import ShortcutBar from '../organisms/ShortcutBar'
import ProductSearch from '../organisms/ProductSearch'
import ShoppingCart from '../organisms/ShoppingCart'
import PaymentModal from '../organisms/PaymentModal'
import type { PaymentData } from '../organisms/PaymentModal'
import ReceiptConfirm from '../organisms/ReceiptConfirm'
import QuotationConfirm from '../organisms/QuotationConfirm'
import type { CartEntry } from '../organisms/ShoppingCart'

export default function PosPage(): JSX.Element {
  const { activeView, navigate } = useNavigation()
  const { session } = useAuth()
  const { register: activeRegister, loading: registerLoading } = useActiveCashRegister()
  const [entries, setEntries] = useState<CartEntry[]>([])
  const [usdRate, setUsdRate] = useState(0)
  const [receiptNumber, setReceiptNumber] = useState(0)
  const [focusKey, setFocusKey] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [lastQuotation, setLastQuotation] = useState<QuotationData | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('FACTURA')
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [inactivityTimeout, setInactivityTimeout] = useState(600)
  const [showRegisterWarning, setShowRegisterWarning] = useState(false)

  const { isLocked, lockError, unlock } = useInactivityLock(inactivityTimeout)

  const isPresupuesto = documentType === 'PRESUPUESTO'
  const isModalOpen = showPayment || lastSale !== null || lastQuotation !== null || showRegisterWarning

  const hasActiveRegister = !registerLoading && activeRegister !== null

  const registerWarningModal = useMemo(() => {
    if (!showRegisterWarning) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-canvas p-6 shadow-2xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
              <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-title-md text-ink font-semibold">Caja cerrada</h3>
            <p className="text-body-sm text-muted">
              No hay un turno de caja abierto. Debe abrir caja antes de poder realizar cobros.
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowRegisterWarning(false)}
                className="flex-1 rounded-lg border border-hairline px-4 py-2.5 text-body-sm font-medium text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setShowRegisterWarning(false); navigate('cash') }}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-medium text-on-primary hover:bg-primary-active transition-colors"
              >
                Abrir caja
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }, [showRegisterWarning, navigate])

  const loadRate = useCallback(async () => {
    const res = await window.electronAPI.getUsdRate()
    if (res.success && res.data) setUsdRate(res.data.rate)
  }, [])

  const loadReceiptNumber = useCallback(async () => {
    const res = await window.electronAPI.getNextReceiptNumber()
    if (res.success && res.data) setReceiptNumber(res.data)
  }, [])

  useEffect(() => {
    loadRate()
    loadReceiptNumber()
    const interval = setInterval(loadRate, 300000)

    window.electronAPI.getConfig().then(res => {
      if (res.success && res.data?.inactivityTimeout) {
        setInactivityTimeout(res.data.inactivityTimeout)
      }
    })

    return () => clearInterval(interval)
  }, [loadRate, loadReceiptNumber])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (activeView !== 'pos' || isModalOpen) return
      if (e.key === 'F2') {
        e.preventDefault()
        setFocusKey(k => k + 1)
      }
      if (e.key === 'F4' && entries.length > 0) {
        e.preventDefault()
        requireRegister(() => {
          if (isPresupuesto) {
            handleCreateQuotation()
          } else {
            setShowPayment(true)
          }
        })
      }
      if (e.key === 'Escape' && entries.length > 0) {
        e.preventDefault()
        setEntries([])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [entries, activeView, isModalOpen, isPresupuesto, hasActiveRegister])

  const handleShortcut = (key: string): void => {
    if (key === 'F2') setFocusKey(k => k + 1)
    if (key === 'F4' && entries.length > 0) {
      requireRegister(() => {
        if (isPresupuesto) {
          handleCreateQuotation()
        } else {
          setShowPayment(true)
        }
      })
    }
    if (key === 'F9' && entries.length > 0) {
      requireRegister(() => {
        if (isPresupuesto) {
          handleCreateQuotation()
        } else {
          setShowPayment(true)
        }
      })
    }
  }

  const handleSelectProduct = (product: Product): void => {
    setEntries(prev => {
      const existing = prev.find(e => e.product.id === product.id)
      if (existing) {
        return prev.map(e =>
          e.product.id === product.id
            ? { ...e, quantity: Math.min(e.quantity + 1, product.type === 'PRODUCT' ? product.stock : 999) }
            : e
        )
      }
      return [...prev, { product, quantity: 1, discount: 0 }]
    })
  }

  const handleUpdateQuantity = (productId: string, quantity: number): void => {
    setEntries(prev =>
      quantity <= 0
        ? prev.filter(e => e.product.id !== productId)
        : prev.map(e => (e.product.id === productId ? { ...e, quantity } : e))
    )
  }

  const handleRemove = (productId: string): void => {
    setEntries(prev => prev.filter(e => e.product.id !== productId))
  }

  const handleUpdateDiscount = (productId: string, discount: number): void => {
    setEntries(prev => prev.map(e => (e.product.id === productId ? { ...e, discount } : e)))
  }

  const handleClear = (): void => {
    setEntries([])
  }

  const requireRegister = (action: () => void): void => {
    if (hasActiveRegister) {
      action()
    } else {
      setShowRegisterWarning(true)
    }
  }

  const handleCheckoutClick = (): void => {
    requireRegister(() => setShowPayment(true))
  }

  const handleQuotationClick = (): void => {
    requireRegister(() => handleCreateQuotation())
  }

  const handleCreateQuotation = async (customerId?: string): Promise<void> => {
    if (!session) return

    const res = await window.electronAPI.createQuotation({
      items: entries.map(e => ({
        productId: e.product.id,
        quantity: e.quantity,
        priceUsd: e.product.priceUsd,
        discount: e.discount || undefined
      })),
      discount: 0,
      usdRate,
      notes: undefined,
      userId: session.userId,
      customerId
    })

    if (!res.success) {
      console.error('Error al crear presupuesto:', res.error)
      return
    }

    setLastQuotation(res.data ?? null)
    setEntries([])
  }

  const handleCheckout = async (data: PaymentData): Promise<void> => {
    if (!session) throw new Error('Sesión no encontrada')

    const res = await window.electronAPI.createSale({
      items: entries.map(e => ({
        productId: e.product.id,
        quantity: e.quantity,
        priceUsd: e.product.priceUsd,
        discount: e.discount || undefined
      })),
      documentType,
      discount: data.globalDiscount,
      payments: data.payments,
      usdRate,
      notes: data.notes,
      motivo: data.motivo,
      customerNotes: data.customerNotes,
      userId: session.userId,
      customerId: data.customerId
    })

    if (!res.success) {
      if (res.error === 'CASH_REGISTER_REQUIRED') {
        throw new Error('No hay un turno de caja abierto. Abra caja antes de cobrar.')
      }
      throw new Error(res.error ?? 'Error al crear venta')
    }

    setLastSale(res.data ?? null)
    setShowPayment(false)
    setEntries([])
    loadReceiptNumber()
  }

  const handleNewSale = (): void => {
    setLastSale(null)
    setLastQuotation(null)
    setGlobalDiscount(0)
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopBar
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        usdRate={usdRate}
        receiptNumber={receiptNumber}
      />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        {activeView === 'pos' ? (
          <div className="flex flex-1 flex-col gap-3 p-4 overflow-hidden">
            {/* Barcode input area */}
            <BarcodeInput
              onProductSelect={handleSelectProduct}
              disabled={isModalOpen}
            />

            {/* Shortcut bar */}
            <ShortcutBar onShortcut={handleShortcut} />

            {/* Search results + Cart */}
            <div className="flex flex-1 gap-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <ProductSearch onSelectProduct={handleSelectProduct} focusKey={focusKey} />
              </div>
              <div className="w-96 shrink-0 flex flex-col">
                <ShoppingCart
                  entries={entries}
                  usdRate={usdRate}
                  documentType={documentType}
                  globalDiscount={globalDiscount}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdateDiscount={handleUpdateDiscount}
                  onRemove={handleRemove}
                  onClear={handleClear}
                  onCheckout={isPresupuesto ? handleQuotationClick : handleCheckoutClick}
                />
              </div>
            </div>
          </div>
        ) : (
          <ContentArea activeView={activeView} />
        )}
      </main>

      {/* Payment Modal */}
      {showPayment && entries.length > 0 && (
        <PaymentModal
          entries={entries}
          usdRate={usdRate}
          documentType={documentType}
          globalDiscount={globalDiscount}
          onConfirm={handleCheckout}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* Receipt Confirmation */}
      {lastSale && (
        <ReceiptConfirm
          sale={lastSale}
          onNewSale={handleNewSale}
        />
      )}

      {/* Quotation Confirmation */}
      {lastQuotation && (
        <QuotationConfirm
          quotation={lastQuotation}
          onNewQuotation={handleNewSale}
        />
      )}

      {/* Cash Register Warning */}
      {registerWarningModal}

      {/* Inactivity Lock Overlay */}
      {isLocked && (
        <LockOverlay lockError={lockError} onUnlock={unlock} />
      )}
    </div>
  )
}
