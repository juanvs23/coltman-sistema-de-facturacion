# Changelog

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
