interface PriceDisplayProps {
  usd: number
  bs: number
  showBs?: boolean
  showUsd?: boolean
}

export default function PriceDisplay({
  usd, bs, showBs = true, showUsd = true
}: PriceDisplayProps): JSX.Element {
  return (
    <div className="text-right">
      {showUsd && <p className="text-body-sm font-medium text-ink">${usd.toFixed(2)}</p>}
      {showBs && <p className="text-caption text-muted-soft">Bs. {bs.toFixed(2)}</p>}
    </div>
  )
}
