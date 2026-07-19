import type { CartEntry } from '../organisms/ShoppingCart'

export interface CartTotals {
  subtotalUsd: number
  taxTotalUsd: number
  discountTotalUsd: number
  totalUsd: number
}

export function calcCartTotals(entries: CartEntry[], globalDiscount: number = 0): CartTotals {
  let subtotalUsd = 0
  let taxTotalUsd = 0
  let discountTotalUsd = 0

  for (const e of entries) {
    const lineSubtotalUsd = e.product.priceUsd * e.quantity
    const lineDiscount = e.discount ?? 0
    const discountedSubtotal = lineSubtotalUsd - lineDiscount
    discountTotalUsd += lineDiscount

    const totalRate = (e.product.taxes ?? []).reduce((s, pt) => s + (pt.tax?.rate ?? 0), 0)
    const lineTax = discountedSubtotal * (totalRate / 100)

    subtotalUsd += discountedSubtotal
    taxTotalUsd += lineTax
  }

  const totalUsd = subtotalUsd + taxTotalUsd - globalDiscount
  return { subtotalUsd, taxTotalUsd, discountTotalUsd, totalUsd }
}
