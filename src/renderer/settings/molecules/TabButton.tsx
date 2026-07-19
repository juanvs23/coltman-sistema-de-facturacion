interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

export default function TabButton({ label, active, onClick }: TabButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 text-body-sm font-medium transition-colors
        ${active
          ? 'bg-surface-card text-ink shadow-sm'
          : 'text-muted hover:bg-surface-soft hover:text-ink'
        }`}
    >
      {label}
    </button>
  )
}
