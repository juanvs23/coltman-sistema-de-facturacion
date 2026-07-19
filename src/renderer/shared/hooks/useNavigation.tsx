import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type ViewId = 'pos' | 'inventory' | 'invoices' | 'cash' | 'reports' | 'settings'

export interface NavItem {
  id: ViewId
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'pos', label: 'Punto de Venta' },
  { id: 'inventory', label: 'Inventario' },
  { id: 'invoices', label: 'Facturación' },
  { id: 'cash', label: 'Caja' },
  { id: 'reports', label: 'Reportes' },
  { id: 'settings', label: 'Configuración' }
]

interface NavigationContextType {
  activeView: ViewId
  navigate: (view: ViewId) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }): JSX.Element {
  const [activeView, setActiveView] = useState<ViewId>('pos')

  const navigate = useCallback((view: ViewId) => {
    setActiveView(view)
  }, [])

  return (
    <NavigationContext.Provider value={{ activeView, navigate }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
