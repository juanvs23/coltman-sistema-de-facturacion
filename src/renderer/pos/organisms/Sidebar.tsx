import { useNavigation, NAV_ITEMS } from '../../shared/hooks/useNavigation'
import { ImCart, ImBoxAdd, ImFileText2, ImCoinDollar, ImStatsBars, ImWrench } from 'react-icons/im'
import type { ViewId } from '../../shared/hooks/useNavigation'

const ICON_MAP: Record<ViewId, React.ComponentType<{ className?: string }>> = {
  pos: ImCart,
  inventory: ImBoxAdd,
  invoices: ImFileText2,
  cash: ImCoinDollar,
  reports: ImStatsBars,
  settings: ImWrench
}

export default function Sidebar(): JSX.Element {
  const { activeView, navigate } = useNavigation()

  return (
    <nav className="w-56 shrink-0 border-r border-hairline bg-surface-soft p-3">
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.id]
          const isActive = activeView === item.id

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-body-sm transition-colors
                ${isActive
                  ? 'bg-surface-card text-ink font-medium'
                  : 'text-muted hover:bg-surface-card hover:text-ink'
                }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
