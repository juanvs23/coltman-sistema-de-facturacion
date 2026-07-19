interface Shortcut {
  key: string
  label: string
  enabled: boolean
  tooltip?: string
}

const SHORTCUTS: Shortcut[] = [
  { key: 'F1', label: 'Ayuda', enabled: false, tooltip: 'Próximamente' },
  { key: 'F2', label: 'Buscar', enabled: true },
  { key: 'F4', label: 'Cobrar', enabled: true },
  { key: 'F5', label: 'Descuento', enabled: true, tooltip: 'Descuentos por línea en el carrito' },
  { key: 'F6', label: 'Anular', enabled: false, tooltip: 'Próximamente' },
  { key: 'F7', label: 'Retener', enabled: false, tooltip: 'Próximamente' },
  { key: 'F8', label: 'Cliente', enabled: false, tooltip: 'Próximamente' },
  { key: 'F9', label: 'Nota', enabled: true, tooltip: 'Agregar nota en la pantalla de cobro' }
]

interface ShortcutBarProps {
  onShortcut: (key: string) => void
}

export default function ShortcutBar({ onShortcut }: ShortcutBarProps): JSX.Element {
  return (
    <div className="flex gap-1" role="toolbar" aria-label="Atajos de teclado">
      {SHORTCUTS.map(s => (
        <button
          key={s.key}
          onClick={() => s.enabled && onShortcut(s.key)}
          disabled={!s.enabled}
          title={s.tooltip ?? s.label}
          className={`flex-1 rounded-md px-2 py-1.5 text-center text-caption font-medium transition-colors
            ${s.enabled
              ? 'border border-hairline bg-surface-card text-muted hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer'
              : 'border border-hairline bg-surface-soft text-muted-soft opacity-50 cursor-not-allowed'
            }`}
        >
          <span className="block text-[10px] leading-none text-muted-soft">{s.key}</span>
          <span className="block mt-0.5">{s.label}</span>
        </button>
      ))}
    </div>
  )
}
