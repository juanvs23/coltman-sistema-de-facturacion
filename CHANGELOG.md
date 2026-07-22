# Changelog

## [0.11.0] - 2026-07-21

### Added
- **Plugin Kernel Architecture**: AppKernel singleton con 4 registries (PluginRegistry, HookBus, UiRegistry, DataModelRegistry)
- **HookBus**: actions + filters con prioridad numérica estilo WordPress. Sorteo en dispatch, pipeline de filters con reduce.
- **PluginRegistry**: ciclo de vida (activate/deactivate), auto-descubrimiento desde `plugins/` y `built-in/`, rechazo de IDs duplicados
- **UiRegistry**: menú lateral, rutas y settings tabs inyectables por plugins con lazy loading via React.lazy + Suspense
- **DataModelRegistry**: validación de namespace `plugin_<id>_` con regex, migrate() stub
- **4 contratos plugin-api**: IPluginKernel, IHookSubscriber, IPluginUI, IPluginDataModel
- **plugin-ve**: VenezuelaPlugin migrado a `plugins/plugin-ve/` como plugin real implementando ICountryPlugin
- **Core neutro**: sin defaults venezolanos hardcodeados. `AppKernel.getCountryPlugin()` resuelve plugin activo según AppConfig.country
- **useCountry hook**: hook React que expone currencySymbol, taxIdLabel, paymentMethods, defaultTaxes desde el country plugin activo
- **PluginProvider + PluginSidebarItems + PluginSettingsTabs**: contexto React + componentes de UI dinámica para plugins
- **UI dinámica**: `Bs.` → `{currencySymbol}` (~55 componentes), `RIF` → `{taxIdLabel}`, SENIAT condicional a countryCode === 'VE'

### Changed
- PluginLoader refactorizado: recibe kernel, delega activate/discover a PluginRegistry, dispatchHook() deprecado
- main.ts: orden de init kernel → loader → handlers
- handlers.ts: kernel en dependencias, nuevos canales kernel:get-country-plugin y kernel:get-country-config
- 55+ componentes del renderer usan `currencySymbol` dinámico en lugar de `Bs.` hardcodeado
- VenezuelaPlugin movido de `src/main/country/ve/` a `plugins/plugin-ve/src/`

### Removed
- `src/main/country/ve/VenezuelaPlugin.ts` (migrado a plugin-ve)
- `src/shared/country/ve/index.ts` (migrado a plugin-ve/src/)
- Dependencias directas del core a lógica venezolana

### Tests
- 138 tests (24 files) — 0 rotos

---

## [0.10.0] - 2026-07-20

### Added
- **Roles dinámicos**: modelos Role, Permission, RolePermission en BD. Guard RBAC consulta permisos desde BD. Roles predefinidos (superadmin/admin/seller) protegidos contra edición.
- **SecurityTab**: UI para gestionar roles y permisos (crear, editar, eliminar), configurar timeout de inactividad, ver políticas de contraseña y matriz de acceso.
- **Bloqueo por inactividad**: useInactivityLock hook + LockOverlay. Timeout configurable en Settings. En fallos no cierra sesión — permite reintentar.
- **Políticas de contraseña**: 8+ caracteres, mayúscula, minúscula, número. Validación en backend y frontend.
- **FiscalTab**: formulario de impresora fiscal (Bixolon/Epson/Sharp/SAM4s, puerto) + toggles SENIAT (facturación electrónica, envío automático).
- **Multi-método de pago**: PaymentEntry model. PaymentModal rediseñado con pills de métodos, pago mixto (ej: $10 efectivo + Bs. 200 transferencia). Reflejado en recibo, arqueo de caja, reportes e historial.
- **Historial USD**: modelo UsdRate con trazabilidad (tasa, fuente, usuario, fecha). UsdRateTab muestra historial de cambios.

### Changed
- User.role (enum) → User.roleId (FK a Role). AuthSession incluye roleId.
- Guard RBAC: consulta permisos desde BD con caché de 30s.
- config:update registra cada cambio de tasa en UsdRate.
- PaymentModal: nuevo diseño 80vh con método de pills, sin dropdowns.

### Fixed
- Seed: CompanyConfig usa upsert, limpieza completa de modelos nuevos.
- Dev mock: updateConfig/getUsdRate/getFiscalConfig funcionales sin localStorage.

## [0.9.0] - 2026-07-19

### Added
- **Reportes**: 4 reportes — ventas del día (totales por método), por producto (top 20), por usuario, libro IVA
- **Libro IVA**: Resumen mensual de facturas con base imponible, IVA, total — listo para declaración SENIAT
- Filtro por mes en libro IVA
- **Fase 1 del MVP completada** 🎉

## [0.8.0] - 2026-07-19

### Added
- **Arqueo de caja**: Apertura, movimientos (ingresos/gastos) y cierre con diferencia
- **OpenRegisterModal**: Monto inicial de caja
- **CloseRegisterModal**: Conteo de efectivo, diferencia vs esperado, alerta si > 1 Bs.
- **CashMovementForm**: Registro de ingresos extra y gastos
- **cash:open, cash:close, cash:summary, cash:add-movement** IPC handlers
- Dashboard de caja: balances, ventas del día por método, esperado en caja, log de movimientos

## [0.7.0] - 2026-07-19

### Added
- **Historial de ventas**: Tabla con filtros por fecha, método de pago; búsqueda y navegación
- **PrismaSaleRepository**: Repositorio hexagonal para ventas (findAll con filtros, cancel con stock restore)
- **Detalle de factura**: Modal completo con productos, totales, cliente, notas, estado y metadata
- **Anulación de ventas**: CancelSaleModal con motivo obligatorio, control de usuario (solo el vendedor puede anular), restauración automática de stock
- **SaleFiltersBar**: Filtros de fecha (desde/hasta), método de pago
- **SaleTable + SaleRow**: Tabla con status badges, acciones Ver/Anular
- Tipos `SaleFilters` y `CancelSaleRequest`

### Changed
- `ISaleRepository`: findAll ahora acepta objeto `SaleFilters`; cancel acepta `reason`
- `sales:list` y `sales:cancel` implementados (ya no son stubs)
- `Sale` type: agregados `cancelledAt`, `cancelledById`, `cancelledBy`, `notes`
- `main.ts`: PrismaSaleRepository inyectado en handlers

## [0.6.0] - 2026-07-19

### Added
- **Descuento por línea**: Porcentaje de descuento en cada producto del carrito, aplicado antes de IVA
- **Descuento global**: Monto fijo en pantalla de cobro, aplicado después de IVA (regla fiscal VE)
- **Notas y referencias**: Campo de texto libre en PaymentModal, almacenado en Sale.notes, visible en recibo
- **calcCartTotals**: Helper compartido que elimina duplicación de cálculo entre CartSummary y PaymentModal
- **F5 (Descuento) y F9 (Nota)** habilitados en ShortcutBar
- SaleItem.discount agregado al schema Prisma

### Changed
- CartItem: muestra % de descuento editable por línea, total recalculado en tiempo real
- CartSummary: muestra línea de descuento, usa calcCartTotals
- PaymentModal: inputs de descuento global + notas, cálculo unificado
- ReceiptConfirm: muestra descuento y notas cuando existen
- sales:create handler: acepta per-line discount, global discount, y notes

## [0.5.0] - 2026-07-19

### Added
- **Rediseño POS**: Layout profesional de caja registradora con barcode-first
- **BarcodeInput**: Campo grande con autofocus permanente, Enter para agregar producto al carrito
- **ShortcutBar**: Barra de atajos F1-F9 visible (F5-F9 deshabilitados con tooltip "Próximamente")
- **N° factura/ticket en tiempo real**: Correlativo visible en TopBar durante la transacción
- **Tasa USD en encabezado**: Visible permanentemente en TopBar como referencia
- **getNextReceiptNumber**: Handler IPC para preview de correlativo (read-only)
- **62 tests** (de 51)

### Changed
- **PosPage**: Layout reestructurado de flex row a grid vertical (barcode → shortcuts → search/grid | cart)
- **TopBar**: Agregados indicadores de tasa USD + número de recibo
- **ProductSearch**: Se mantiene intacto para búsqueda por nombre (F2)
- **ShoppingCart, CartItem, CartSummary, PaymentModal**: Sin cambios

## [0.4.0] - 2026-07-19

### Added
- **Factura vs Ticket**: Toggle visual Factura/Ticket en TopBar del POS
- **DocumentType enum**: `FACTURA` | `TICKET` en modelo Sale, con validación backend
- **Customer checkout**: Búsqueda rápida de cliente (RIF/nombre) integrada en flujo POS, visible solo en modo Factura
- **CompanyConfig**: Nuevo modelo con razón social, RIF, dirección, teléfono, email
- **Pestaña Empresa**: Formulario completo en Settings reemplazando el placeholder
- **Validación**: `sales:create` rechaza facturas sin cliente con código `CUSTOMER_REQUIRED_FOR_FACTURA`
- **Recibo contextual**: Muestra tipo de documento, datos del cliente (factura) o "Consumidor Final" (ticket)
- **getReceiptFooter(type)**: Pie de recibo por tipo de documento
- **51 tests** (de 45)

### Changed
- `FiscalConfig`: Campos de empresa (taxPayerId, businessName, fiscalAddress) migrados a `CompanyConfig`
- `CreateSaleRequest`: Agregados `documentType`, `userId`, `customerId`
- `useCountry` hook: `receiptFooter` → `getReceiptFooter(type)`

## [0.1.1] - 2026-07-18

### Added
- **Open-core architecture**: `plugin-api/` público con 5 contratos (IPlugin, IFiscalPrinter, IUsdRateProvider, IRestaurant, ISeniat)
- License Manager con feature gating (free/premium/enterprise) y machine binding
- Plugin Loader dinámico con carga desde directorios + dispatch de hooks
- Licencia MIT para el core público
- Seed de base de datos (`prisma/seed.ts`) con datos iniciales: 3 usuarios, 5 categorías, 22 productos, configuración fiscal y de app
- Dev mock de `electronAPI` para desarrollo desde navegador
- `react-icons` con set Icomoon (`react-icons/im`, prefijo `Im`)

### Fixed
- Handler IPC `auth:login` implementado con Prisma + bcrypt (validación real contra DB)
- Content-Security-Policy bloqueaba carga de Google Fonts — migrado a `@fontsource/inter` self-hosted
- Favicon faltante causaba 404 — agregado favicon inline SVG

### Changed
- Dependencias de proyecto instaladas (npm install)
- Schema Prisma: corregidas relaciones inversas faltantes en modelo User
- Configuración electron-vite: agregados entry points explícitos y outDir, corregido root del renderer

## [0.1.0] - 2026-07-17

### Added
- Project initialization with Electron + TypeScript + React + Prisma
- Hexagonal architecture structure (core domain, ports, adapters)
- Screaming Architecture frontend with Atomic Design domains
- Cal.com design system with dark mode extension
- Authentication system with role-based access (SELLER, ADMIN, SUPERADMIN)
- Prisma schema with models: User, Product, Category, Sale, SaleItem, CashRegister, CashMovement, FiscalConfig, AppConfig
- IPC handler scaffold for all domains
- Dark mode toggle with persistent preference
- TDD setup with Vitest + React Testing Library
- Plugin system architecture skeleton
- Offline-first database design (SQLite)
- Venezuelan-specific features: IVA, USD rate, fiscal printer, SENIAT
