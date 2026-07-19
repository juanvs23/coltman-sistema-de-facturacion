import { ImSearch } from 'react-icons/im'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  autoFocus = false
}: SearchInputProps): JSX.Element {
  return (
    <div className="relative">
      <ImSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-md border border-hairline bg-canvas py-2 pl-10 pr-3 text-body-sm text-ink
          placeholder:text-muted-soft focus:border-primary focus:outline-none"
      />
    </div>
  )
}
