# Sistema de Facturación

Punto de venta (POS) y sistema de facturación para PYME venezolana. Offline-first, multiplataforma, con soporte para impresoras fiscales y facturación electrónica SENIAT.

## Stack

- **Desktop**: Electron + TypeScript
- **Frontend**: React + TailwindCSS (Atomic Design + Screaming Architecture)
- **Database**: SQLite via Prisma ORM (migratable to PostgreSQL)
- **Testing**: Vitest + React Testing Library (TDD mandatory)

## Architecture

- **Hexagonal Architecture**: Core domain is pure TypeScript with adapters for persistence, printing, and external services.
- **Screaming Architecture**: Frontend organized by business domain (pos, inventory, invoices, cash-register, admin).
- **Plugin System**: Dynamic loading of third-party modules for feature expansion.

## Project Structure

```
src/
├── main/              # Electron main process (backend)
│   ├── core/          # Domain entities, use cases, ports
│   ├── infrastructure/# Adapters (Prisma, printer, USD rate, SENIAT)
│   ├── plugins/       # Plugin host and loader
│   └── ipc/           # IPC channel handlers
├── renderer/          # React frontend
│   ├── pos/           # Point of Sale domain
│   ├── inventory/     # Inventory management
│   ├── invoices/      # Invoicing
│   ├── cash-register/ # Cash reconciliation
│   ├── reports/       # Reporting
│   ├── admin/         # System administration
│   ├── auth/          # Authentication
│   ├── plugins/       # Plugin UI
│   └── shared/        # Shared components and hooks
└── shared/            # Shared types between main and renderer
```

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to SQLite
npx prisma db push

# Start development
npm run dev

# Run tests
npm test
```

## Features

- POS with keyboard-first workflow
- Inventory management with stock control
- Cash register with daily reconciliation
- Multi-user with roles (SELLER, ADMIN, SUPERADMIN)
- Dark mode toggle
- Offline-first operation
- USD rate auto-update (BCV / EnParaleloVzla)
- Fiscal printer support (Bixolon, Epson, Sharp, SAM4s)
- Plugin system for extensibility

## License

Proprietary — Freemium model. See LICENSE file.
