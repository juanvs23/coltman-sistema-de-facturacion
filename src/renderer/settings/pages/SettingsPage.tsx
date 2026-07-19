import { useState } from 'react'
import TabButton from '../molecules/TabButton'
import UsersTab from '../organisms/UsersTab'
import TaxesTab from '../organisms/TaxesTab'
import CustomersTab from '../organisms/CustomersTab'
import PluginsTab from '../organisms/PluginsTab'
import UsdRateTab from '../organisms/UsdRateTab'

type SettingsTab = 'users' | 'taxes' | 'customers' | 'usd-rate' | 'security' | 'company' | 'fiscal'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'users', label: 'Usuarios' },
  { id: 'taxes', label: 'Impuestos' },
  { id: 'customers', label: 'Clientes' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'usd-rate', label: 'Tasa USD' },
  { id: 'company', label: 'Empresa' },
  { id: 'security', label: 'Seguridad' },
  { id: 'fiscal', label: 'Fiscal' }
]

export default function SettingsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users')

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-surface-soft/50">
      <div className="border-b border-hairline bg-canvas px-6">
        <h2 className="pt-4 text-title-md text-ink">Configuración</h2>
        <nav className="mt-2 flex gap-1 pb-3">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'taxes' && <TaxesTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'plugins' && <PluginsTab />}
        {activeTab === 'usd-rate' && <UsdRateTab />}
        {activeTab === 'security' && (
          <div className="flex h-full items-center justify-center">
            <p className="text-body-sm text-muted-soft">Configuración de seguridad — próximamente</p>
          </div>
        )}
        {activeTab === 'company' && (
          <div className="flex h-full items-center justify-center">
            <p className="text-body-sm text-muted-soft">Datos de la empresa — próximamente</p>
          </div>
        )}
        {activeTab === 'fiscal' && (
          <div className="flex h-full items-center justify-center">
            <p className="text-body-sm text-muted-soft">Configuración fiscal — próximamente</p>
          </div>
        )}
      </div>
    </div>
  )
}
