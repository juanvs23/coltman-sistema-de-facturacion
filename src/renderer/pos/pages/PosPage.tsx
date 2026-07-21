import { useState, useEffect, useCallback } from 'react'
import type { Product, Sale, Customer, DocumentType } from '@shared/types'
import { useNavigation } from '../../shared/hooks/useNavigation'
import { useAuth } from '../../shared/hooks/useAuth'
import { useInactivityLock } from '../../shared/hooks/useInactivityLock'
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
import type { CartEntry } from '../organisms/ShoppingCart'

export default function PosPage(): JSX.Element {
  const { activeView } = useNavigation()
  const { session } = useAuth()
  const [entries, setEntries] = useState<CartEntry[]>([])
  const [usdRate, setUsdRate] = useState(0)
  const [receiptNumber, setReceiptNumber] = useState(0)
  const [focusKey, setFocusKey] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('TICKET')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [inactivityTimeout, setInactivityTimeout] = useState(600)

  const { isLocked, lockError, unlock } = useInactivityLock(inactivityTimeout)

  const isModalOpen = showPayment || lastSale !== null

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
        setShowPayment(true)
      }
      if (e.key === 'Escape' && entries.length > 0) {
        e.preventDefault()
        setEntries([])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [entries, activeView, isModalOpen])

  const handleShortcut = (key: string): void => {
    if (key === 'F2') setFocusKey(k => k + 1)
    if (key === 'F4' && entries.length > 0) setShowPayment(true)
    if (key === 'F9' && entries.length > 0) setShowPayment(true)
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
      userId: session.userId,
      customerId: selectedCustomer?.id
    })

    if (!res.success) throw new Error(res.error ?? 'Error al crear venta')

    setLastSale(res.data ?? null)
    setShowPayment(false)
    setEntries([])
    loadReceiptNumber()
  }

  const handleNewSale = (): void => {
    setLastSale(null)
    setSelectedCustomer(null)
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
                  selectedCustomer={selectedCustomer}
                  globalDiscount={globalDiscount}
                  onCustomerChange={setSelectedCustomer}
                  onUpdateQuantity={handleUpdateQuantity}
                  onUpdateDiscount={handleUpdateDiscount}
                  onRemove={handleRemove}
                  onClear={handleClear}
                  onCheckout={() => setShowPayment(true)}
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
          customerId={selectedCustomer?.id}
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

      {/* Inactivity Lock Overlay */}
      {isLocked && (
        <LockOverlay lockError={lockError} onUnlock={unlock} />
      )}
    </div>
  )
}
