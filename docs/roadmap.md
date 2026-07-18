# Roadmap — Sistema de Facturación POS

## Estado Actual (v0.1.1)

### ✅ Completado
- [x] Proyecto inicializado (Electron + TS + React + Prisma + SQLite)
- [x] Schema Prisma con todas las entidades de dominio
- [x] Configuración de electron-vite con entry points y build
- [x] .env con DATABASE_URL
- [x] Base de datos SQLite creada y sincronizada
- [x] Seed de datos: 3 usuarios, 5 categorías, 22 productos, configs
- [x] UI de login con validación real (Prisma + bcrypt)
- [x] Dev mock de electronAPI para desarrollo en navegador
- [x] Layout POS (top nav + sidebar + contenido)
- [x] Iconos Icomoon en menú de navegación
- [x] Dark mode toggle
- [x] CSP y favicon arreglados
- [x] Tipografía Inter self-hosted (via @fontsource)
- [x] **Open-core architecture**: Plugin API pública (5 contratos), License Manager, Plugin Loader dinámico

### 🔲 Por hacer

#### Fase 0 — Arquitectura Open-Core ✅
- [x] `plugin-api/` con interfaces públicas (IPlugin, IFiscalPrinter, IUsdRateProvider, IRestaurant, ISeniat)
- [x] License Manager público (validador auditable, generación privada)
- [x] Plugin Loader con carga dinámica desde directorios
- [x] Feature gating (free / premium / enterprise)
- [ ] Backend de licencias (servicio privado — fuera del repo)
- [ ] CI/CD para publicar plugin-api como npm package

#### Fase 1 — MVP POS (6-8 semanas)
Cada feature arranca con TDD.

##### Prioridad 0 — Router de navegación
- [ ] Menú lateral navega entre vistas (inventario, facturación, caja, reportes, admin)
- [ ] Placeholder views para cada sección
- [ ] Item activo resaltado en el sidebar

##### Prioridad 1 — Core POS
- [ ] Persistir sesión en electron-store
- [ ] CRUD de productos (lista, crear, editar, stock)
- [ ] Pantalla POS: búsqueda de productos + carrito de compras
- [ ] Cálculo de IVA (16%) y totales
- [ ] Modal de cobro (métodos de pago, vuelto, tasa USD)
- [ ] Arqueo de caja (apertura, movimientos, cierre)
- [ ] Historial de ventas (filtros, detalle, cancelación)
- [ ] Reportes básicos (ventas del día, por método de pago)
- [ ] Admin de usuarios (CRUD, roles)

##### Prioridad 2 — Calidad
- [ ] Atajos de teclado (F2, F4, F6, Escape)
- [ ] Validaciones y edge cases
- [ ] Tests de integración (flujo POS completo)
- [ ] Tests E2E con Playwright
- [ ] Build de distribución (instalador Windows/Linux)

#### Fase 2 — Plugins Premium (futuro)
- [ ] Plugin: Impresora fiscal (Bixolon, Epson, Sharp, SAM4s)
- [ ] Plugin: USD Rate (BCV, EnParaleloVzla, CriptoDólar)
- [ ] Plugin: Restaurante (mesas, comandas, splits)
- [ ] Modo servidor multi-caja
- [ ] Migración SQLite → PostgreSQL
- [ ] Sincronización offline/online

#### Fase 3 — SENIAT (futuro)
- [ ] Factura electrónica SENIAT
- [ ] Libros IVA
- [ ] Retenciones de IVA e ISLR

## Notas

- **TDD obligatorio**: cada feature empieza con test
- **MVP mínimo**: navegación + producto + POS + cobro + caja
- **Prioridad 0 actual**: router de navegación (desbloquea el resto de vistas)
- **Open-core**: el core es MIT público, los plugins premium son privados
