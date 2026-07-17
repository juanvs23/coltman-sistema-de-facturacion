# Project Context — Sistema de Facturación

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

## Key Design Decisions

| Decision | Rationale |
|---|---|
| SQLite over MongoDB | ACID transactions, foreign keys, offline-first, single-file DB |
| Prisma over raw SQL | Type-safe queries, easy migration to PostgreSQL in Phase 2 |
| IPC over HTTP (main↔renderer) | Lower latency, no serialization overhead, native Electron pattern |
| CSS variables for dark mode | Cleaner than Tailwind dark: variants, runtime swappable |
| Atomic Design + Screaming | Modular, domain-isolated, plugin-friendly frontend |

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
