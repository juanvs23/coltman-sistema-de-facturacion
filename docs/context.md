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

- **Plugin System**: AppKernel singleton with 4 registries (PluginRegistry, HookBus, UiRegistry, DataModelRegistry). Plugins implement ICountryPlugin and are auto-discovered from `plugins/` directory.

### Open-Core Architecture

El proyecto es **open-core**:
- **Core POS** (`sistema-facturacion/`): público, licencia MIT
- **Plugin API** (`plugin-api/`): pública, para que cualquiera construya plugins
- **Plugin Loader**: público, carga plugins dinámicamente desde `plugins/`
- **License Manager**: público (código visible), pero la generación de llaves es un backend privado
- **Plugins premium** (fiscal printer, SENIAT, restaurant): privados, distribuidos bajo licencia

El License Manager es auditable. La seguridad está en el backend de licencias (firma asimétrica), no en esconder el código.

### Freemium Model

- **Free tier**: Basic POS, inventory, cash register, single terminal
- **Paid upgrades**: Fiscal printer, restaurant module, server-mode multi-terminal, SENIAT electronic invoicing
- Feature gating implemented via license key validation in plugin system

## Design System

Based on Cal.com design tokens (via getdesign.md) with these adaptations:
- **Dark mode** toggle added with full dark palette
- **Touch targets** increased to 44px minimum for POS use
- **POS-specific components**: keypad, product search, cart, payment modal, cash summary
- **Keyboard-first**: F2/F4/F6 shortcuts for POS operations
- **Typography**: Inter (body), Cal Sans (display), JetBrains Mono (code/receipts)

## Key Design Decisions

| Decision | Rationale |
|---|---|
| SQLite over MongoDB | ACID transactions, foreign keys, offline-first, single-file DB |
| Prisma over raw SQL | Type-safe queries, easy migration to PostgreSQL in Phase 2 |
| IPC over HTTP (main↔renderer) | Lower latency, no serialization overhead, native Electron pattern |
| CSS variables for dark mode | Cleaner than Tailwind dark: variants, runtime swappable |
| Atomic Design + Screaming | Modular, domain-isolated, plugin-friendly frontend |
| Open-core (public MIT + private plugins) | Community contributions + monetization of complex features |

## Venezuelan-Specific Features

- IVA (16%) calculation with retention support
- Official USD rate from BCV / EnParaleloVzla
- Fiscal printer support (Bixolon, Epson, Sharp, SAM4s)
- SENIAT factura electrónica (Phase 2)
- RIF/tax ID validation with person type extraction (V/E/J/G/P)
- Person subtypes: contribuyente, no_contribuyente, especial, independiente, dependiente
- Legal types for juridical persons: CA, SRL, SC, Fundación, Asociación
- Payment bank selector: 16 Venezuelan banks (Banesco, Mercantil, Provincial, etc.)
- Currency display: Bs. + USD parallel with automatic conversion

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

## Current State

| Field | Value |
|---|---|
| **Version** | v0.12.0 |
| **Branch** | `dev` |
| **Tests** | 148+4 flaky (25 files) |
| **Fase 1** | ✅ MVP Core completa |
| **Plugin Kernel Architecture** | ✅ PR 1/2/3 completados |
| **Fase 2** | ✅ Cabos sueltos completa |
| **Presupuestos** | ✅ Sistema de cotizaciones con modelo propio + conversión a factura |
| **ShiftConfig** | ✅ Turnos configurables por nombre, días y horario |
| **InvoiceDocument** | ✅ Factura congelada con 40+ campos, multi-moneda, plugin-ready |
| **Personas VE** | ✅ Tipos V/E/J/G/P con subtipos y legalType para jurídicas |
| **PaymentEntry.bank** | ✅ Banco de origen para tarjetas y transferencias |
| **Fase 3** | ⬜ Monetización (Producto) — pendiente |
| **Fase 4** | ⬜ Lanzamiento — pendiente |

Ver `docs/ROADMAP.md` para detalle de fases, estimaciones y dependencias.
Ver `CHANGELOG.md` para historial completo de versiones.
