# Tasks: Plugin Kernel Architecture

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800-1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Fase 1) → dev → PR 2 (Fase 2) → dev → PR 3 (Fase 3+4) → dev |
| Delivery strategy | ask-on-risk (decidido: stacked PRs to dev) |
| Chain strategy | stacked-to-dev |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-dev
400-line budget risk: High

## Phase 1: Foundation — Contracts & Kernel Registries

- [x] 1.1 Crear `plugin-api/src/contracts/IPluginKernel.ts` — interface con accessors a 4 registries
- [x] 1.2 Crear `plugin-api/src/contracts/IHookSubscriber.ts` — on/off/action/applyFilter contracts
- [x] 1.3 Crear `plugin-api/src/contracts/IPluginUI.ts` — addMenuItem/addRoute/addSettingsTab
- [x] 1.4 Crear `plugin-api/src/contracts/IPluginDataModel.ts` — registerSchema(schema: string)
- [x] 1.5 Modificar `plugin-api/src/types.ts` — añadir HookPriority, UiMenuItem, UiRoute, UiSettingsTab, PluginSchema
- [x] 1.6 Crear `src/main/core/kernel/AppKernel.ts` — singleton, init() inyecta prisma+window, 4 accessors
- [x] 1.7 Crear `src/main/core/kernel/PluginRegistry.ts` — register/activate/deactivate/list, validación duplicados
- [x] 1.8 Crear `src/main/core/kernel/HookBus.ts` — actions+filters maps, priority sort asc, on/off/action/applyFilter
- [x] 1.9 Crear `src/main/core/kernel/UiRegistry.ts` — menu/route/tab collections, emite IPC en mutación
- [x] 1.10 Crear `src/main/core/kernel/DataModelRegistry.ts` — regex namespace validation, migrate() stub
- [x] 1.11 Test: HookBus dispatch respeta prioridad (5 antes que 20), filter pipeline encadena payloads
- [x] 1.12 Test: PluginRegistry rechaza id duplicado, activate cambia isActive()
- [x] 1.13 Test: DataModelRegistry rechaza schema sin prefijo plugin_<id>_
- [x] 1.14 Verificar: suite existente (114 tests) pasa sin cambios

## Phase 2: Core Refactor — PluginLoader, Wiring & VenezuelaPlugin

- [x] 2.1 Refactor `src/main/plugins/PluginLoader.ts` — recibir kernel, delegar activate a PluginRegistry, eliminar dispatchHook()
- [x] 2.2 Modificar `src/main/main.ts` — instanciar AppKernel primero, pasar a PluginLoader e IPC handlers
- [x] 2.3 Modificar `src/main/ipc/handlers.ts` — recibir kernel, registrar canales UiRegistry IPC
- [x] 2.4 Modificar `src/shared/types/index.ts` — añadir UiRegistryState, PluginHookDef para IPC bridge
- [x] 2.5 Test: integración kernel init → plugin discovery → hook dispatch end-to-end
- [x] 2.6 Crear `plugins/plugin-ve/` — estructura del plugin de Venezuela (plugin.json, package.json)
- [x] 2.7 Migrar `VenezuelaPlugin` de `src/main/country/ve/` a `plugins/plugin-ve/src/index.ts`
- [x] 2.8 Mover `src/shared/country/ve/` a `plugins/plugin-ve/src/` (RIF, footers, etc.)
- [x] 2.9 Hacer core neutro — eliminar defaults venezolanos del core, todo país viene de ICountryPlugin
- [x] 2.10 Resolver plugin activo según `AppConfig.country` — kernel obtiene country plugin dinámicamente
- [x] 2.11 Eliminar `src/main/country/ve/VenezuelaPlugin.ts` y `src/shared/country/ve/` del core

## Phase 3: UI Integration — Kernel IPC Bridge & Country Hook

- [x] 3.1 Agregar IPC handler `kernel:get-country-plugin` en main process — retorna datos del ICountryPlugin activo (currencySymbol, taxIdLabel, paymentMethods, defaultTaxes, etc.)
- [x] 3.2 Agregar IPC handler `kernel:get-country-config` en main process — retorna AppConfig.country
- [x] 3.3 Crear hook `src/renderer/shared/hooks/useCountry.ts` — hook React que consume los IPC handlers y cachea el country plugin activo
- [x] 3.4 Crear `src/renderer/plugins/PluginProvider.tsx` — React context que expone: uiRegistry state + country plugin activo + kernel config
- [x] 3.5 Crear `src/renderer/plugins/PluginSidebarItems.tsx` — renderiza menú items desde UiRegistry context
- [x] 3.6 Crear `src/renderer/plugins/PluginSettingsTabs.tsx` — settings tabs con React.lazy + Suspense
- [x] 3.7 Reemplazar `Bs.` hardcodeado en el renderer por `country.currencySymbol` — ~55 ocurrencias en POS, caja, reportes, facturas, settings
- [x] 3.8 Reemplazar `RIF` hardcodeado en CompanyTab por `country.taxIdLabel` (CustomersTab ya usaba useCountry)
- [x] 3.9 Reemplazar `IVA` hardcodeado en ReportsPage por `{currencySymbol}` (TaxesTab/ProductCard son genéricos)
- [x] 3.10 Hacer FiscalTab dinámico — ocultar sección SENIAT si el país activo no es Venezuela
- [x] 3.11 Actualizar dev mock en `src/renderer/main.tsx` — añadir getCountryPlugin y getCountryConfig
- [x] 3.12 Test: useCountry retorna datos correctos, PluginProvider renderiza sin crash con registry vacío, formatCurrency

## Phase 4: Data Model — Migration Pipeline

- [ ] 4.1 Implementar DataModelRegistry.migrate() — ejecuta `prisma db push` sobre schema parcial del plugin
- [ ] 4.2 Verificar: tablas plugin_<id>_ creadas en SQLite sin afectar schema core
