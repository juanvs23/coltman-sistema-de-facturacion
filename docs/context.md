# Project Context — Sistema de Facturación

## Language (IA)

- **En chat con el usuario**: español neutro, sin modismos regionales (ni rioplatense, ni venezolano, ni mexicano)
- **En artefactos generados** (UI labels, texto en pantalla, documentación, README, mensajes de error, tooltips, notificaciones, textos de ayuda, copy de cualquier tipo): **español neutro obligatorio**. No usar inglés en UI copy a menos que sea un término técnico universal (PDF, email) o el usuario lo solicite explícitamente.
- **En código, nombres de variables, funciones, tipos, nombres de archivos, commits**: inglés
- No usar voseo, ni "che", ni "pana", ni "vale", ni "wey", ni regionalismos de ningún país

## Overview

POS and invoicing system for Venezuelan SMEs. Desktop application built with Electron + TypeScript + React + Prisma + SQLite. Designed for offline-first operation with future migration to client-server multi-terminal architecture.

## Stack

- **Runtime**: Electron (desktop) with Node.js main process
- **Language**: TypeScript (strict mode)
- **Frontend**: React 18 with Screaming Architecture + Atomic Design
- **Styling**: TailwindCSS with CSS custom properties for dark mode
- **Database**: SQLite via Prisma ORM (migratable to PostgreSQL)
- **Testing**: Vitest + React Testing Library (TDD mandatory)

## Architecture

- **Hexagonal Architecture**: Core domain is pure TypeScript with zero external dependencies.
  - `core/entities/` — Business domain models
  - `core/use-cases/` — Application business rules
  - `core/ports/` — Interface contracts (repositories, services)
  - `infrastructure/` — Adapter implementations (Prisma, printer, USD rate, SENIAT)
  - `plugins/` — Dynamic plugin loading system
  - `ipc/` — Electron IPC handlers (bridge between main and renderer)

- **Screaming Architecture (Frontend)**: Folders organized by business domain, not technical role.
  - `pos/`, `inventory/`, `invoices/`, `cash-register/`, `reports/`, `admin/`, `auth/`, `plugins/`
  - Each domain follows Atomic Design: atoms → molecules → organisms → templates → pages

- **Plugin System**: Plugins implement plugin-specific domain interfaces and are loaded dynamically from `plugins/` directory at runtime.

## Design System

Based on Cal.com design tokens (via getdesign.md) with these adaptations:
- **Dark mode** toggle added with full dark palette
- **Touch targets** increased to 44px minimum for POS use
- **POS-specific components**: keypad, product search, cart, payment modal, cash summary
- **Keyboard-first**: F2/F4/F6 shortcuts for POS operations
- **Typography**: Inter (body), Cal Sans (display), JetBrains Mono (code/receipts)

## Open-Core Architecture

El proyecto es **open-core**:
- **Core POS** (`sistema-facturacion/`): público, licencia MIT
- **Plugin API** (`plugin-api/`): pública, para que cualquiera construya plugins
- **Plugin Loader**: público, carga plugins dinámicamente desde `plugins/`
- **License Manager**: público (código visible), pero la generación de llaves es un backend privado
- **Plugins premium** (fiscal printer, SENIAT, restaurant): privados, distribuidos bajo licencia

El License Manager es auditable. La seguridad está en el backend de licencias (firma asimétrica), no en esconder el código.

## Key Design Decisions

| Decision | Rationale |
|---|---|
| SQLite over MongoDB | ACID transactions, foreign keys, offline-first, single-file DB |
| Prisma over raw SQL | Type-safe queries, easy migration to PostgreSQL in Phase 2 |
| IPC over HTTP (main↔renderer) | Lower latency, no serialization overhead, native Electron pattern |
| CSS variables for dark mode | Cleaner than Tailwind dark: variants, runtime swappable |
| Atomic Design + Screaming | Modular, domain-isolated, plugin-friendly frontend |
| Open-core (public MIT + private plugins) | Community contributions + monetization of complex features |

## Freemium Model

- **Free tier**: Basic POS, inventory, cash register, single terminal
- **Paid upgrades**: Fiscal printer, restaurant module, server-mode multi-terminal, SENIAT electronic invoicing
- Feature gating implemented via license key validation in plugin system

## Venezuelan-Specific Features

- IVA (16%) calculation with retention support
- Official USD rate from BCV / EnParaleloVzla
- Fiscal printer support (Bixolon, Epson, Sharp, SAM4s)
- SENIAT factura electrónica (Phase 2)
- RIF/tax ID validation
- Currency display: Bs. + USD parallel

## Non-Negotiables

- **TDD**: Tests must be written before implementation code
- **Hexagonal Architecture**: Core never depends on infrastructure
- **Screaming Architecture**: Business domains, not technical layers
- **Offline-first**: System must function fully without internet
- **Keyboard-first**: POS operations should be efficient without mouse

## Workflow

- **Rama activa**: `dev` — todo el trabajo se hace aquí
- **Rama estable**: `master` — solo merge desde `dev` cuando está probado
- **Commits**: convencionales (feat/fix/chore/docs), en español o inglés
- **TDD**: tests antes que implementación

## Current State (v0.7.0)

**Branch**: `dev`
**Date**: 2026-07-19

### Completed
- [x] Project structure and tooling (Electron + TS + React + Prisma + SQLite)
- [x] Prisma schema with all domain models + Tax model + ProductTax join table + Customer (pending)
- [x] Core ports/interfaces for all domains
- [x] Auth: login handler real (Prisma + bcrypt) + dev mock for browser
- [x] Authentication UI (login page with dark mode)
- [x] POS shell layout (sidebar + top nav + iconos Icomoon)
- [x] Design system (Cal.com + dark mode + POS adaptations)
- [x] TDD config (Vitest + React Testing Library) — 39 tests
- [x] SDD initialization + skill registry
- [x] Documentation (README, CHANGELOG, context, roadmap, PLAN_ACCION)
- [x] Dependencies installed (npm install)
- [x] electron-vite config con entry points explícitos
- [x] Base de datos SQLite creada y seed ejecutado (3 users, 3 taxes, 22 products)
- [x] Tipografía Inter self-hosted (@fontsource)
- [x] CSP y favicon arreglados
- [x] **Router de navegación** con sidebar activo y 6 vistas
- [x] **Vista Configuración** con tabs: Usuarios, Impuestos, Tasa USD, Seguridad, Empresa, Fiscal
- [x] **CRUD de usuarios** (crear, editar, activar/desactivar)
- [x] **CRUD de impuestos** (crear, editar, activar/desactivar) ✅
- [x] **CRUD de categorías** (dentro de Inventario)
- [x] **CRUD de productos** con selección múltiple de impuestos ✅
- [x] **Pantalla POS** actual con búsqueda + ticket + cobro
- [x] **Tasa USD** configurable desde Settings con persistencia en DB
- [x] **PrismaClient singleton** compartido
- [x] **Sales:create** handler con transacción, correlativo, stock, impuestos múltiples, taxBreakdown

### Completed (v0.3.0)
- [x] **Core multi-país**: ICountryPlugin, Customer.taxId genérico, AppConfig.country
- [x] **plugin-ve 🇻🇪** gratis bundled: RIF, Bs./USD, métodos VE, leyendas SENIAT
- [x] **plugin-co 🇨🇴** placeholder: NIT, COP, métodos CO (Nequi, DaviPlata)
- [x] **Panel de Plugins**: PluginsTab en Settings con toggle + reload al cambiar país
- [x] **PluginStateStore**: JSON persistente (localStorage en dev, archivo en Electron)
- [x] **useCountry() hook**: reactivo al país activo
- [x] **45 tests**

### Completed (v0.4.0 — Fase 1.1)
- [x] **Factura vs Ticket**: toggle visual en TopBar, DocumentType enum en Sale
- [x] **Customer checkout**: búsqueda rápida de cliente en modo Factura (RIF + nombre)
- [x] **Validación backend**: sales:create rechaza FACTURA sin customerId
- [x] **Recibo**: distingue FACTURA (cliente + leyenda) de TICKET (consumidor final)
- [x] **Pestaña Empresa**: CompanyConfig (razón social, RIF, dirección, teléfono, email)
- [x] **Migración**: CompanyConfig creado, campos migrados desde FiscalConfig
- [x] **getReceiptFooter(type)**: pie de recibo por tipo de documento

### Completed (v0.5.0 — Fase 1.2)
- [x] **Rediseño POS**: layout profesional con barcode-first
- [x] **BarcodeInput**: input grande con autofocus permanente, Enter para agregar producto
- [x] **ShortcutBar**: barra de atajos F1-F9 visible
- [x] **N° factura/ticket visible**: correlativo en TopBar durante la transacción
- [x] **Tasa USD fija**: en el encabezado (TopBar)
- [x] **getNextReceiptNumber**: handler IPC para preview de correlativo

### Completed (v0.6.0 — Fase 1.3)
- [x] **Descuento por línea**: porcentaje en cada producto del carrito, aplicado antes de IVA
- [x] **Descuento global**: monto fijo en pantalla de cobro, aplicado después de IVA
- [x] **Notas y referencias**: campo de texto libre en PaymentModal, visible en recibo
- [x] **calcCartTotals**: helper compartido eliminando duplicación CartSummary/PaymentModal
- [x] **F5 (Descuento) y F9 (Nota)** habilitados en ShortcutBar

### Completed (v0.7.0 — Fase 1.4)
- [x] **PrismaSaleRepository**: repositorio hexagonal para ventas
- [x] **Historial de ventas**: tabla con filtros (fecha, método de pago)
- [x] **Detalle de factura**: modal con productos, totales, cliente, notas
- [x] **Anulación de ventas**: con motivo, control de usuario, restauración de stock

### Completed (v0.8.0 — Fase 1.5)
- [x] **Apertura de caja**: modal con monto inicial
- [x] **Movimientos**: ingresos extra y gastos registrables
- [x] **Cierre de caja**: conteo de efectivo, diferencia vs esperado
- [x] **Resumen del día**: balances, ventas por método, movimientos
- [x] **62 tests**

### Pending (Fase 1.6+)
- [ ] **Rediseño UI del POS** — campo código/barras grande, N° visible, tasa fija, atajos
- [ ] **Descuentos** por línea y total
- [ ] **Historial de ventas** con filtros, detalle, reimpresión, anulación
- [ ] **Arqueo de caja** (apertura, movimientos, cierre)
- [ ] **Reportes** (ventas por día/producto/usuario, libro IVA)
- [ ] **Multi-método de pago** en una sola venta
