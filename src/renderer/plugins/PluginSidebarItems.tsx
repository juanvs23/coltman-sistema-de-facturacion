import { Suspense, lazy } from 'react'
import { usePluginContext } from './PluginProvider'

/**
 * Renders sidebar menu items registered by plugins via UiRegistry.
 * Each item is lazy-loaded via React.lazy + Suspense.
 *
 * @example
 * ```tsx
 * <PluginSidebarItems />
 * ```
 */
export default function PluginSidebarItems(): JSX.Element | null {
  const { uiState } = usePluginContext()

  if (!uiState.menuItems || uiState.menuItems.length === 0) {
    return null
  }

  return (
    <>
      {uiState.menuItems.length > 0 && (
        <div className="border-t border-hairline pt-2 mt-2">
          <p className="px-3 pb-1 text-caption text-muted-soft uppercase tracking-wider text-[10px]">
            Plugins
          </p>
          {uiState.menuItems.map((item) => (
            <PluginMenuItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  )
}

interface MenuItemData {
  id: string
  label: string
  icon: string
  route: string
  permission?: string
}

function PluginMenuItem({ item }: { item: MenuItemData }): JSX.Element {
  // In a full implementation, we'd use useNavigation or a router
  // For now, render a simple button that could navigate to the plugin route
  return (
    <button
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-body-sm text-muted
        transition-colors hover:bg-surface-card hover:text-ink"
      title={item.label}
    >
      <span className="h-4 w-4 flex items-center justify-center text-caption">
        {item.icon ? (
          <PluginIcon icon={item.icon} />
        ) : (
          <span className="text-caption">◆</span>
        )}
      </span>
      <span className="truncate">{item.label}</span>
    </button>
  )
}

function PluginIcon({ icon }: { icon: string }): JSX.Element {
  // Map common icon names to simple placeholders
  // In production, use react-icons or a proper icon system
  const iconMap: Record<string, string> = {
    'package': '📦',
    'settings': '⚙️',
    'chart': '📊',
    'file': '📄',
    'printer': '🖨️',
    'globe': '🌐',
  }

  return (
    <span className="text-caption">{iconMap[icon] ?? '◆'}</span>
  )
}
