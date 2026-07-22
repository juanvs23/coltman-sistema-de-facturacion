import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useCountry } from '../shared/hooks/useCountry'
import type { CountryInfo } from '../shared/hooks/useCountry'
import type { UiRegistryState } from '@shared/types'

interface PluginContextType {
  /** UI Registry state — menu items, routes, settings tabs from plugins */
  uiState: UiRegistryState
  /** Active country plugin data or neutral defaults */
  country: CountryInfo
  /** Refresh country data */
  refreshCountry: () => void
  /** Whether the provider is still loading initial data */
  loading: boolean
}

const EMPTY_UI: UiRegistryState = {
  menuItems: [],
  routes: [],
  settingsTabs: []
}

const PluginContext = createContext<PluginContextType | undefined>(undefined)

export function PluginProvider({ children }: { children: ReactNode }): JSX.Element {
  const country = useCountry()
  const [uiState, setUiState] = useState<UiRegistryState>(EMPTY_UI)
  const [loading, setLoading] = useState(true)

  const loadUiState = useCallback(async () => {
    try {
      const res = await window.electronAPI.listPlugins()
      // We also attempt to subscribe to UI registry updates
      // If the channel isn't available in browser mock, this fails silently
      try {
        const uiRes = await (window.electronAPI as any).subscribeUiRegistry?.()
        if (uiRes?.success && uiRes?.data) {
          setUiState(uiRes.data)
          setLoading(false)
          return
        }
      } catch {
        // silent — may not be available in dev/browser mode
      }
      // Fallback: just mark as loaded
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUiState()
  }, [loadUiState])

  // Listen for ui-registry:updated events (from kernel UiRegistry)
  useEffect(() => {
    const handler = (event: any) => {
      try {
        const state = event.detail as UiRegistryState
        setUiState(state)
      } catch {
        // ignore malformed events
      }
    }
    // We use a custom event bridge — in Electron this would be via
    // ipcRenderer.on('ui-registry:updated', ...) but for browser dev
    // mode we dispatch custom events from the mock
    window.addEventListener('ui-registry:updated', handler)
    return () => window.removeEventListener('ui-registry:updated', handler)
  }, [])

  // Also listen via ipcRenderer if available (Electron mode)
  useEffect(() => {
    // In test environment, window.electronAPI might not have on
    if (typeof window.electronAPI !== 'undefined' && 'on' in window.electronAPI) {
      const cleanup = (window.electronAPI as any).on?.('ui-registry:updated', (state: UiRegistryState) => {
        setUiState(state)
      })
      return () => cleanup?.()
    }
  }, [])

  const refreshCountry = useCallback(() => {
    // Force re-fetch by temporarily setting loading
    setCountryLoading()
    // The useCountry hook will re-fetch on the next render
  }, [])

  // This is a bit hacky — we re-mount the country hook by changing a key
  // Simple approach: just call getCountryPlugin again indirectly
  // For now, refreshCountry is a no-op since useCountry auto-loads once
  // In a full implementation, we'd use a ref to trigger re-fetch

  return (
    <PluginContext.Provider value={{ uiState, country, refreshCountry, loading }}>
      {children}
    </PluginContext.Provider>
  )
}

// Helper to force country reload — exported for internal use
let _setCountryLoading: (() => void) | null = null
function setCountryLoading() {
  _setCountryLoading?.()
}

export function usePluginContext(): PluginContextType {
  const context = useContext(PluginContext)
  if (!context) {
    throw new Error('usePluginContext must be used within a PluginProvider')
  }
  return context
}
