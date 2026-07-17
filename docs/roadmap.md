# Roadmap

## Fase 1 — POS Base (MVP) — Estimado: 6-8 semanas

### Semana 1-2: Setup y Core
- [x] Estructura del proyecto y tooling
- [x] Schema de base de datos (Prisma + SQLite)
- [ ] Sistema de autenticación (login, roles, sesión)
- [ ] Setup de CI/CD básico
- [ ] Pruebas de humo del setup

### Semana 3-4: POS — Núcleo
- [ ] CRUD de productos (código, nombre, precio, stock, categoría)
- [ ] Pantalla POS con búsqueda de productos
- [ ] Carrito de compras (agregar, quitar, ajustar cantidad)
- [ ] Cálculo de IVA (16%)
- [ ] Modal de cobro (métodos de pago, cálculo de vuelto)

### Semana 5-6: Gestión
- [ ] Arqueo de caja (apertura, movimientos, cierre)
- [ ] Historial de ventas (búsqueda, filtros, detalle)
- [ ] Cancelación de ventas
- [ ] Reportes básicos (ventas del día, por método de pago)
- [ ] Admin de usuarios (CRUD básico)

### Semana 7-8: Pulido
- [ ] Atajos de teclado completos (F2, F4, F6, Escape)
- [ ] Dark mode refinado
- [ ] Validaciones y edge cases
- [ ] Tests de integración (POS flow completo)
- [ ] Testing E2E con Playwright
- [ ] Build de distribución (instalador Windows)

## Fase 1.5 — Plugins y Extensibilidad — Estimado: 2-3 semanas

- [ ] Sistema de plugins funcional (carga dinámica desde directorio)
- [ ] API de plugins documentada
- [ ] Plugin de ejemplo
- [ ] Feature-gating para modelo freemium
- [ ] Sistema de licencias básico

## Fase 2 — Monetización y Avanzado — Estimado: 4-6 semanas

- [ ] **Plugin: Impresora Fiscal** (Bixolon, Epson, Sharp, SAM4s)
- [ ] **Plugin: USD Rate** (BCV, EnParaleloVzla, CriptoDólar)
- [ ] **Plugin: Restaurante** (mesas, comandas, splits)
- [ ] Modo servidor multi-caja (Electron cliente + servidor Node)
- [ ] Migración SQLite → PostgreSQL
- [ ] Sincronización offline/online

## Fase 3 — SENIAT y Factura Electrónica — Estimado: 4-6 semanas

- [ ] Factura electrónica SENIAT (XML firmado)
- [ ] Validación RIF / IVSS
- [ ] Libros IVA (compras/ventas)
- [ ] Retenciones de IVA e ISLR
- [ ] Reportes fiscales

## Fase 4 — Escalamiento — Estimado: 6-8 semanas

- [ ] Múltiples locales
- [ ] Dashboard web
- [ ] App móvil (consulta de precios, inventario)
- [ ] API pública para integraciones
- [ ] Marketplace de plugins
