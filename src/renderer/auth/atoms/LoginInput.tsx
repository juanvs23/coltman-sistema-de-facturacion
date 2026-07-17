interface LoginInputProps {
  label: string
  type: 'text' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export default function LoginInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoFocus
}: LoginInputProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-caption text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-10 rounded-md border border-hairline bg-canvas px-3.5 text-body-md text-ink
          placeholder:text-muted-soft
          focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
    </div>
  )
}
