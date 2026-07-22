import { Suspense, lazy, type ComponentType } from 'react'
import { usePluginContext } from './PluginProvider'

interface SettingsTabData {
  id: string
  label: string
  component: string
}

/**
 * Renders plugin-registered settings tabs.
 * Each tab component is lazy-loaded via React.lazy + Suspense.
 *
 * Usage: Pass the rendered tabs list to a parent that manages active tab state.
 *
 * @example
 * ```tsx
 * const { tabs } = usePluginSettingsTabs()
 * // then render tabs in your settings page
 * ```
 */
export function usePluginSettingsTabs(): { tabs: SettingsTabData[] } {
  const { uiState } = usePluginContext()
  return { tabs: uiState.settingsTabs ?? [] }
}

/**
 * Lazy-loads a plugin settings tab component by its path.
 * Falls back to a placeholder if loading fails.
 */
export function lazySettingsTab(
  componentPath: string
): ComponentType {
  try {
    return lazy(() => import(/* @vite-ignore */ componentPath))
  } catch {
    return lazy(() => Promise.resolve({ default: () => <p className="text-body-sm text-muted-soft p-4">Componente no disponible</p> }))
  }
}

/**
 * Fallback component shown while lazy-loaded tabs are loading.
 */
export function TabFallback(): JSX.Element {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
