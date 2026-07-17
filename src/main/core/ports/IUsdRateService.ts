import type { UsdRate } from '@shared/types'

export interface IUsdRateService {
  /** Obtiene la tasa actual desde la fuente configurada */
  getCurrentRate(): Promise<UsdRate>
  /** Obtiene el historial de tasas */
  getHistory(days: number): Promise<UsdRate[]>
}
