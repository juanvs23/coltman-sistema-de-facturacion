interface QuantityInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export default function QuantityInput({
  value, onChange, min = 1, max = 999, disabled = false
}: QuantityInputProps): JSX.Element {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="flex h-7 w-7 items-center justify-center rounded border border-hairline bg-canvas text-body-sm
          text-muted transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
        }}
        disabled={disabled}
        className="h-7 w-12 rounded border border-hairline bg-canvas text-center text-body-sm text-ink
          focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        min={min}
        max={max}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="flex h-7 w-7 items-center justify-center rounded border border-hairline bg-canvas text-body-sm
          text-muted transition-colors hover:bg-surface-soft hover:text-ink disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}
