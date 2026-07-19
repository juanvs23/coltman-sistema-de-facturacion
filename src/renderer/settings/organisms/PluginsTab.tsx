import { useState, useEffect, useCallback } from 'react'

interface PluginInfo {
  id: string
  name: string
  version: string
  description?: string
  enabled: boolean
  visibility?: string
}

export default function PluginsTab(): JSX.Element {
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.listPlugins()
      if (res.success && res.data) setPlugins(res.data)
      else setError(res.error ?? 'Error al cargar')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (plugin: PluginInfo): Promise<void> => {
    const res = await window.electronAPI.togglePluginActive(plugin.id)
    if (res.success && res.data) {
      setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, enabled: res.data!.active } : p))
      // Country plugins require restart to take full effect
      if (plugin.id.startsWith('plugin-') && plugin.id.length === 9) {
        window.location.reload()
      }
    } else {
      setError(res.error ?? 'Error al cambiar estado')
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-muted">{plugins.length} plugins instalados</p>
      </div>

      {error && (
        <div className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {error} <button onClick={load} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {loading && <p className="text-body-sm text-muted-soft py-8 text-center">Cargando...</p>}

      {!loading && plugins.length === 0 && (
        <p className="text-body-sm text-muted-soft py-8 text-center">No hay plugins instalados</p>
      )}

      {!loading && plugins.length > 0 && (
        <div className="flex flex-col gap-2">
          {plugins.map(plugin => (
            <div key={plugin.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors
                ${plugin.enabled ? 'border-hairline bg-surface-card' : 'border-hairline bg-surface-soft opacity-70'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-ink">{plugin.name}</span>
                  <span className="font-mono text-caption text-muted-soft">v{plugin.version}</span>
                  {plugin.visibility === 'internal' && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-caption text-primary">Nativo</span>
                  )}
                </div>
                <p className="text-caption text-muted-soft mt-0.5">{plugin.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-caption ${plugin.enabled ? 'text-success' : 'text-muted-soft'}`}>
                  {plugin.enabled ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  onClick={() => handleToggle(plugin)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${plugin.enabled ? 'bg-success' : 'bg-muted-soft'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${plugin.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
