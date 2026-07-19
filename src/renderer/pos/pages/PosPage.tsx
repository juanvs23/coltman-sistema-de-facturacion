import { useState, useEffect, useCallback } from 'react'
import type { Product, Sale, Customer, DocumentType } from '@shared/types'
import { useNavigation } from '../../shared/hooks/useNavigation'
import { useAuth } from '../../shared/hooks/useAuth'
import TopBar from '../organisms/TopBar'
import Sidebar from '../organisms/Sidebar'
import ContentArea from '../organisms/ContentArea'
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
  const [focusKey, setFocusKey] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('TICKET')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const loadRate = useCallback(async () => {
    const res = await window.electronAPI.getUsdRate()
    if (res.success && res.data) setUsdRate(res.data.rate)
  }, [])

  useEffect(() => {
    loadRate()
    const interval = setInterval(loadRate, 300000)
    return () => clearInterval(interval)
  }, [loadRate])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (activeView !== 'pos') return
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
  }, [entries, activeView])

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
      return [...prev, { product, quantity: 1 }]
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

  const handleClear = (): void => {
    setEntries([])
  }

  const handleCheckout = async (data: PaymentData): Promise<void> => {
    if (!session) throw new Error('Sesión no encontrada')

    const res = await window.electronAPI.createSale({
      items: entries.map(e => ({
        productId: e.product.id,
        quantity: e.quantity,
        priceUsd: e.product.priceUsd
      })),
      documentType,
      paymentMethod: data.paymentMethod,
      cashAmount: data.cashAmount,
      usdRate,
      userId: session.userId,
      customerId: selectedCustomer?.id
    })

    if (!res.success) throw new Error(res.error ?? 'Error al crear venta')

    setLastSale(res.data ?? null)
    setShowPayment(false)
    setEntries([])
  }

  const handleNewSale = (): void => {
    setLastSale(null)
    setSelectedCustomer(null)
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopBar documentType={documentType} onDocumentTypeChange={setDocumentType} />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        {activeView === 'pos' ? (
          <div className="flex flex-1 gap-4 p-4 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <ProductSearch onSelectProduct={handleSelectProduct} focusKey={focusKey} />
            </div>
            <div className="w-96 shrink-0 flex flex-col">
              <ShoppingCart
                entries={entries}
                usdRate={usdRate}
                documentType={documentType}
                selectedCustomer={selectedCustomer}
                onCustomerChange={setSelectedCustomer}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                onClear={handleClear}
                onCheckout={() => setShowPayment(true)}
              />
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
    </div>
  )
}
