import { useCountry } from '../../shared/hooks/useCountry'

interface PriceDisplayProps {
  usd: number
  bs: number
  showBs?: boolean
  showUsd?: boolean
}

export default function PriceDisplay({
  usd, bs, showBs = true, showUsd = true
}: PriceDisplayProps): JSX.Element {
  const { currencySymbol } = useCountry()

  return (
    <div className="text-right">
      {showUsd && <p className="text-body-sm font-medium text-ink">${usd.toFixed(2)}</p>}
      {showBs && <p className="text-caption text-muted-soft">{currencySymbol} {bs.toFixed(2)}</p>}
    </div>
  )
}
