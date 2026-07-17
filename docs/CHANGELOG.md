# Changelog

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
