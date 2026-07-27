import { useCountry } from '../../shared/hooks/useCountry'

interface PriceDisplayProps {
  usd: number
  showBs?: boolean
  showUsd?: boolean
}

export default function PriceDisplay({
  usd, showBs = true, showUsd = true
}: PriceDisplayProps): JSX.Element {
  const { currencySymbol, defaultExchangeRate, usdRate } = useCountry()
  const isDualCurrency = defaultExchangeRate !== null && defaultExchangeRate > 0

  return (
    <div className="text-right">
      {isDualCurrency ? (
        <>
          {showBs && <p className="text-body-sm font-medium text-ink">{currencySymbol} {(usd * usdRate).toFixed(2)}</p>}
          {showUsd && <p className="text-caption text-muted-soft">${usd.toFixed(2)} USD</p>}
        </>
      ) : (
        <>
          {showUsd && <p className="text-body-sm font-medium text-ink">${usd.toFixed(2)}</p>}
        </>
      )}
    </div>
  )
}
