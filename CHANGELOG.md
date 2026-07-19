# Changelog

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
