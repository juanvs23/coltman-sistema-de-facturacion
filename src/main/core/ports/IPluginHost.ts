/**
 * Puerto para el sistema de plugins.
 * Define cómo se cargan, inicializan y comunican los plugins con el host.
 */
export interface IPluginHost {
  /** Carga todos los plugins disponibles */
  loadPlugins(): Promise<void>
  /** Obtiene un plugin por su nombre */
  getPlugin<T>(name: string): Promise<T | null>
  /** Lista los plugins cargados */
  listPlugins(): Promise<PluginInfo[]>
  /** Instala un plugin desde una ruta o paquete */
  installPlugin(source: string): Promise<PluginInfo>
  /** Desinstala un plugin */
  uninstallPlugin(name: string): Promise<void>
}

export interface PluginInfo {
  name: string
  version: string
  description: string
  author: string
  enabled: boolean
  type: 'core' | 'external'
  hooks: string[] // Eventos que escucha
}
