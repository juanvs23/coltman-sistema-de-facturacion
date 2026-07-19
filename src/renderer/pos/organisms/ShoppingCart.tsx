import type { Product, Customer, DocumentType } from '@shared/types'
import CartItem from '../molecules/CartItem'
import CartSummary from '../molecules/CartSummary'
import CustomerSearch from '../molecules/CustomerSearch'

export interface CartEntry {
  product: Product
  quantity: number
  discount: number
}

interface ShoppingCartProps {
  entries: CartEntry[]
  usdRate: number
  documentType: DocumentType
  selectedCustomer: Customer | null
  globalDiscount: number
  onCustomerChange: (customer: Customer | null) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onUpdateDiscount: (productId: string, discount: number) => void
  onRemove: (productId: string) => void
  onClear: () => void
  onCheckout: () => void
}

export default function ShoppingCart({
  entries, usdRate, documentType, selectedCustomer, globalDiscount, onCustomerChange,
  onUpdateQuantity, onUpdateDiscount, onRemove, onClear, onCheckout
}: ShoppingCartProps): JSX.Element {
  const isFactura = documentType === 'FACTURA'

  return (
    <div className="flex h-full flex-col rounded-lg border border-hairline bg-surface-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h3 className="text-body-sm font-medium text-ink">
          {isFactura ? 'Factura' : 'Ticket'} ({entries.length} item{entries.length !== 1 ? 's' : ''})
        </h3>
        {entries.length > 0 && (
          <button onClick={onClear}
            className="text-caption text-muted-soft transition-colors hover:text-error">
            Vaciar
          </button>
        )}
      </div>

      {/* Customer search — only in Factura mode */}
      {isFactura && entries.length > 0 && (
        <div className="px-4 py-3 border-b border-hairline">
          <p className="text-caption text-muted mb-2">Cliente</p>
          <CustomerSearch
            onSelect={onCustomerChange}
            selectedCustomer={selectedCustomer}
          />
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-body-sm text-muted-soft">Carrito vacío</p>
            <p className="text-caption text-muted-soft mt-1">Seleccione productos para comenzar</p>
          </div>
        </div>
      )}

      {/* Items list */}
      {entries.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          {entries.map((entry) => (
            <CartItem
              key={entry.product.id}
              entry={entry}
              usdRate={usdRate}
              onUpdateQuantity={onUpdateQuantity}
              onUpdateDiscount={onUpdateDiscount}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      {/* Summary + checkout */}
      {entries.length > 0 && (
        <>
          <CartSummary entries={entries} usdRate={usdRate} globalDiscount={globalDiscount} />
          <div className="border-t border-hairline px-4 py-3">
            <button
              onClick={onCheckout}
              className="w-full rounded-lg bg-primary py-3 text-body-sm font-medium text-on-primary
                transition-opacity hover:opacity-90"
            >
              Cobrar (F4)
            </button>
          </div>
        </>
      )}
    </div>
  )
}
