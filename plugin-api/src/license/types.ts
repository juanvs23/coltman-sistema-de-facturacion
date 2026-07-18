/**
 * Feature definition for gating.
 */
export interface FeatureDefinition {
  /** Unique feature key */
  key: string
  /** Display name */
  name: string
  /** Description shown in the UI */
  description: string
  /** Whether this feature requires a license */
  requiresLicense: boolean
  /** Plugin ID that provides this feature */
  pluginId: string
  /** Pricing tier */
  tier: 'free' | 'premium' | 'enterprise'
}

/**
 * All built-in feature keys.
 * Plugin features are registered dynamically.
 */
export const BUILT_IN_FEATURES: Record<string, FeatureDefinition> = {
  'core-pos': {
    key: 'core-pos',
    name: 'Punto de Venta',
    description: 'POS básico con carrito, cobro y arqueo de caja',
    requiresLicense: false,
    pluginId: 'core',
    tier: 'free'
  },
  'inventory': {
    key: 'inventory',
    name: 'Inventario',
    description: 'Gestión de productos, categorías y stock',
    requiresLicense: false,
    pluginId: 'core',
    tier: 'free'
  },
  'fiscal-printer': {
    key: 'fiscal-printer',
    name: 'Impresora Fiscal',
    description: 'Soporte para impresoras fiscales (Bixolon, Epson, Sharp, SAM4s)',
    requiresLicense: true,
    pluginId: 'fiscal-printer',
    tier: 'premium'
  },
  'usd-rate': {
    key: 'usd-rate',
    name: 'Tasa del Dólar',
    description: 'Fuentes automáticas de tasa BCV, EnParaleloVzla, CriptoDólar',
    requiresLicense: false,
    pluginId: 'usd-rate',
    tier: 'free'
  },
  'restaurant': {
    key: 'restaurant',
    name: 'Módulo Restaurante',
    description: 'Mesas, comandas, splits e impresión de cocina',
    requiresLicense: true,
    pluginId: 'restaurant',
    tier: 'premium'
  },
  'seniat': {
    key: 'seniat',
    name: 'Factura Electrónica SENIAT',
    description: 'XML firmado, envío SENIAT, libros IVA',
    requiresLicense: true,
    pluginId: 'seniat',
    tier: 'enterprise'
  },
  'multi-terminal': {
    key: 'multi-terminal',
    name: 'Multi Terminal',
    description: 'Modo servidor con múltiples cajas en red',
    requiresLicense: true,
    pluginId: 'multi-terminal',
    tier: 'enterprise'
  }
}
