# Plan de Acción — Sistema de Facturación POS

## Estado: v0.1.1
## Objetivo: MVP funcional (v1.0.0)

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 No iniciado | 📝 En especificación | 🔧 En desarrollo | ✅ Completado |
| `(días)` | Tiempo estimado |
| `#N` | Depende de tarea N |
| `🧪` | Requiere tests (TDD) |

---

## Fase 1 — Fundación (semanas 1-2)

### 1.1 Router de navegación interna 🔴 (3 días)

**Objetivo**: El menú lateral cambia de vista sin recargar la página.

**Dependencias**: ninguna

**Tareas:**

- [ ] `1.1.1` Crear `NavigationContext` con estado de ruta activa
  - Provider con `activeView` + `navigate(view)`
  - Hook `useNavigation()` para consumir desde cualquier componente
  - **🧪 Test**: prueba que el contexto cambia de estado al navegar

- [ ] `1.1.2` Refactorizar `PosPage.tsx` para usar el contexto de navegación
  - Extraer `Sidebar` a su propio componente
  - Extraer `TopBar` a su propio componente
  - Extraer `ContentArea` que renderiza la vista activa
  - **🧪 Test**: prueba que el sidebar renderiza los items

- [ ] `1.1.3` Crear vistas placeholder en cada dominio
  - `InventoryPage.tsx` — "Módulo de Inventario — Próximamente"
  - `InvoicesPage.tsx` — "Módulo de Facturación — Próximamente"
  - `CashRegisterPage.tsx` — "Módulo de Caja — Próximamente"
  - `ReportsPage.tsx` — "Módulo de Reportes — Próximamente"
  - `AdminPage.tsx` — "Módulo de Administración — Próximamente"
  - **🧪 Test**: prueba que cada placeholder se renderiza

- [ ] `1.1.4` Resaltar item activo en el sidebar
  - Clase `bg-surface-card text-ink` para el item seleccionado
  - Transición suave entre vistas
  - **🧪 Test**: prueba visual de clase condicional

---

### 1.2 Persistencia de sesión 🔴 (2 días)

**Objetivo**: La sesión sobrevive al cerrar y reabrir la app.

**Dependencias**: ninguna

- [ ] `1.2.1` Implementar `sessionStorage` en el handler `auth:login`
  - Guardar sesión en `electron-store` (cifrado)
  - Devolver sesión al cargar la app (handler `auth:session`)
  - **🧪 Test**: prueba que la sesión persiste entre llamadas

- [ ] `1.2.2` Conectar `useAuth.tsx` con `getSession` al montar
  - Llamar `window.electronAPI.getSession()` en el mount del AuthProvider
  - Si hay sesión válida, saltar pantalla de login
  - **🧪 Test**: prueba que el provider carga sesión existente

---

### 1.3 Repositorios Prisma 🔴 (3 días)

**Objetivo**: Implementar los adapters de infraestructura para acceder a la DB.

**Dependencias**: ninguna

- [ ] `1.3.1` Crear `PrismaProductRepository`
  - `findAll()` — listar productos (con filtro opcional por categoría)
  - `findById(id)` — buscar por UUID
  - `findByCode(code)` — buscar por SKU/código
  - `search(query)` — búsqueda textual por nombre o código
  - `create(product)` — crear producto
  - `update(id, data)` — actualizar producto
  - `delete(id)` — borrado lógico (active=false)
  - `updateStock(id, quantity)` — ajustar stock
  - **🧪 Test**: prueba contra DB de test (SQLite :memory:)

- [ ] `1.3.2` Crear `PrismaSaleRepository`
  - `create(sale)` — crear venta con items en transacción
  - `findById(id)` — buscar con items y producto
  - `findAll(filters)` — filtrar por fecha, método de pago, usuario
  - `cancel(id, userId)` — cancelar venta
  - `getDailySummary(date)` — resumen del día
  - **🧪 Test**: prueba transaccional

- [ ] `1.3.3` Crear `PrismaCashRegisterRepository`
  - `create(register)` — apertura de caja
  - `addMovement(movement)` — registrar movimiento
  - `close(id, balance)` — cierre de caja
  - `findByDate(date)` — buscar caja del día
  - **🧪 Test**: prueba de movimientos

- [ ] `1.3.4` Crear `PrismaUserRepository`
  - `findByUsername(username)` — buscar por login
  - `findAll()` — listar usuarios
  - `create(user)` — crear usuario
  - `update(id, data)` — actualizar
  - `toggleActive(id)` — activar/desactivar
  - **🧪 Test**: prueba CRUD básico

---

## Fase 2 — Núcleo POS (semanas 3-5)

### 2.1 CRUD de productos 🔴 (4 días) `#1.3.1`

**Objetivo**: Pantalla completa de gestión de productos.

**Dependencias**: 1.1 (router), 1.3.1 (repo productos)

**Frontend (Atomic Design):**

- [ ] `2.1.1` **Atoms**: `SearchInput`, `ProductBadge` (estado stock)
- [ ] `2.1.2` **Molecules**: `ProductRow` (tabla), `ProductForm` (crear/editar)
- [ ] `2.1.3` **Organisms**: `ProductTable` (lista + búsqueda + filtros), `ProductModal` (crear/editar)
- [ ] `2.1.4` **Template/Page**: `InventoryPage` con los organismos
  - **🧪 Test**: renderizado del listado, filtrado, creación

**Backend (IPC):**

- [ ] `2.1.5` Handler `products:list` conectado a `PrismaProductRepository.findAll()`
- [ ] `2.1.6` Handler `products:search` conectado a repo
- [ ] `2.1.7` Handler `products:create` con validación Zod
- [ ] `2.1.8` Handler `products:update` con validación
- [ ] `2.1.9` Handler `products:delete` (borrado lógico)
  - **🧪 Test**: cada handler prueba éxito y error

---

### 2.2 Pantalla POS — Búsqueda y carrito 🔴 (5 días) `#2.1`

**Objetivo**: El corazón del sistema — pantalla de venta con carrito.

**Dependencias**: 2.1 (CRUD productos)

**Frontend (Atomic Design):**

- [ ] `2.2.1` **Atoms**: `ProductCard` (para grilla de productos), `QuantityInput`, `PriceDisplay`
- [ ] `2.2.2` **Molecules**: `ProductGrid` (resultados de búsqueda), `CartItem` (línea del carrito), `CartSummary` (subtotal/IVA/total)
- [ ] `2.2.3` **Organisms**: `ProductSearch` (barra + resultados), `ShoppingCart` (lista + resumen)
- [ ] `2.2.4` **Template**: `PosTemplate` (search panel + cart panel)
- [ ] `2.2.5` Reemplazar `PosPage.tsx` con la template real
  - Diseño responsive: sidebar search a la izquierda, carrito a la derecha
  - Teclado: F2 foco en búsqueda, Escape limpiar carrito
  - **🧪 Test**: agregar producto al carrito, cambiar cantidad, calcular total

**Backend:**

- [ ] `2.2.6` Handler `products:search` con búsqueda por código y nombre
  - **🧪 Test**: búsqueda exacta y parcial

---

### 2.3 Modal de cobro 🔴 (4 días) `#2.2`

**Objetivo**: Procesar el pago de una venta.

**Dependencias**: 2.2 (carrito), 1.3.2 (repo ventas)

- [ ] `2.3.1` **Atom**: `PaymentMethodIcon` (icono por método)
- [ ] `2.3.2` **Molecules**: `PaymentMethodSelector` (radio buttons con íconos), `CashBreakdown` (cálculo de vuelto), `UsdRateDisplay`
- [ ] `2.3.3` **Organism**: `PaymentModal` (modal completo de cobro)
  - Selección de método (efectivo, transferencia, tarjeta débito/crédito, divisa, mixto)
  - Si es efectivo: input de monto recibido + cálculo de vuelto automático
  - Si es divisa: mostrar tasa USD actual + monto en USD
  - Si es mixto: desglose por método
  - Resumen: subtotal, IVA, descuento, total
  - Botón "Confirmar pago" → handler `sales:create`
  - **🧪 Test**: cada método de pago, cálculo de vuelto, error si monto insuficiente

- [ ] `2.3.4` Handler `sales:create` en IPC
  - Recibir items + método de pago + montos
  - Validar stock (si es PRODUCT, descontar inventario)
  - Generar número de factura correlativo
  - Calcular IVA, subtotal, total
  - Guardar en transacción: Sale + SaleItems
  - **🧪 Test**: venta exitosa, stock insuficiente, producto inactivo

---

### 2.4 Arqueo de caja 🔴 (4 días) `#1.3.3`

**Objetivo**: Control de apertura y cierre de caja con movimientos.

**Dependencias**: 1.3.3 (repo caja), 1.1 (router)

- [ ] `2.4.1` **Molecules**: `RegisterOpenForm` (monto inicial), `MovementForm` (ingreso/gasto/retiro), `CloseSummary` (total vs esperado)
- [ ] `2.4.2` **Organism**: `RegisterPanel` con tabs (abrir si no hay / movimientos / cerrar)
- [ ] `2.4.3` **Template**: `CashRegisterPage`
  - Si no hay caja abierta hoy: mostrar formulario de apertura
  - Si hay caja abierta: mostrar movimientos + botón de cierre
  - Diferencia: calcular total esperado (apertura + ventas + ingresos - gastos - retiros)
  - **🧪 Test**: apertura, registrar movimiento, cierre con diferencia

- [ ] `2.4.4` Handler `cash:open` — crear caja del día
- [ ] `2.4.5` Handler `cash:addMovement` — registrar movimiento
- [ ] `2.4.6` Handler `cash:close` — cerrar caja con validación
- [ ] `2.4.7` Handler `cash:summary` — resumen del día
  - **🧪 Test**: cada handler

---

### 2.5 Historial de ventas 🔴 (3 días) `#1.3.2`

**Objetivo**: Consultar, filtrar y cancelar ventas anteriores.

**Dependencias**: 1.3.2 (repo ventas), 1.1 (router)

- [ ] `2.5.1` **Molecules**: `SaleRow` (fila de tabla), `SaleFilters` (fecha, método, estado), `SaleDetail` (modal con items)
- [ ] `2.5.2` **Organism**: `SaleHistoryTable` (lista paginada + filtros + búsqueda)
- [ ] `2.5.3` **Template**: `InvoicesPage`
  - Tabla con scroll infinito o paginación
  - Click en fila → modal con detalle (items, impuestos, usuario)
  - Botón "Anular" solo si está COMPLETED
  - Confirmación de anulación
  - **🧪 Test**: filtros, detalle, cancelación

- [ ] `2.5.4` Handler `sales:list` con filtros
- [ ] `2.5.5` Handler `sales:cancel` con verificación de permisos
  - **🧪 Test**: listado filtrado, cancelación exitosa, error si ya cancelada

---

### 2.6 Reportes básicos 🔴 (3 días) `#1.3.2, #1.3.3`

**Objetivo**: Visualizar datos agregados de ventas y caja.

**Dependencias**: repositorios, 1.1 (router)

- [ ] `2.6.1` **Molecules**: `StatCard` (tarjeta con número grande + etiqueta), `ReportChart` (placeholder con barras CSS)
- [ ] `2.6.2` **Organism**: `DailySummary` (ventas hoy, ticket promedio, métodos de pago), `TopProducts` (top 10 más vendidos), `CashSummary` (comparativa cierre)
- [ ] `2.6.3` **Template**: `ReportsPage`
  - Cards de resumen del día
  - Top productos más vendidos
  - Distribución por método de pago (barras horizontales)
  - Selector de fechas
  - **🧪 Test**: renderizado con datos mock

- [ ] `2.6.4` Handler `reports:daily` — resumen del día
- [ ] `2.6.5` Handler `reports:topProducts` — top 10
  - **🧪 Test**: datos correctos

---

### 2.7 Admin de usuarios 🔴 (3 días) `#1.3.4`

**Objetivo**: Gestionar usuarios del sistema.

**Dependencias**: 1.3.4 (repo usuarios), 1.1 (router)

- [ ] `2.7.1` **Molecules**: `UserRow`, `UserForm`, `RoleBadge`
- [ ] `2.7.2` **Organism**: `UserTable` (lista + crear + editar), `UserModal` (detalle)
- [ ] `2.7.3` **Template**: `AdminPage`
  - Solo accesible para ADMIN y SUPERADMIN
  - Lista de usuarios con rol, estado, fecha de creación
  - Crear usuario: username, nombre, rol, contraseña
  - Editar: cambiar rol, activar/desactivar
  - **🧪 Test**: CRUD, acceso por rol

- [ ] `2.7.4` Handler `users:list`
- [ ] `2.7.5` Handler `users:create` (bcrypt hash)
- [ ] `2.7.6` Handler `users:update`
- [ ] `2.7.7` Handler `users:toggleActive`

---

## Fase 3 — Calidad y Distribución (semanas 6-7)

### 3.1 Atajos de teclado 🔴 (2 días)

**Objetivo**: Operación eficiente sin mouse.

- [ ] `3.1.1` Hook global `useKeyboard` con mapa de atajos
  - `F2` → buscar producto (foco en search)
  - `F4` → abrir cobro (si hay carrito con items)
  - `F6` → finalizar venta (en modal de cobro)
  - `Escape` → cerrar modal / limpiar búsqueda
  - `F8` → toggle dark mode
  - **🧪 Test**: atajos disparan acciones correctas

### 3.2 Validaciones y edge cases 🔴 (2 días)

- [ ] `3.2.1` Validación Zod en todos los handlers IPC
  - Esquemas para cada operación (create product, create sale, etc.)
  - Mensajes de error en español neutro
- [ ] `3.2.2` Manejo de errores global en el renderer
  - Toast/snackbar para errores de IPC
  - Estado vacío para listas sin datos
  - Mensajes de error amigables
  - **🧪 Test**: errores de validación, red, datos vacíos

### 3.3 Tests de integración 🔴 (3 días)

- [ ] `3.3.1` Setup de base de test en memoria (SQLite `:memory:`)
- [ ] `3.3.2` Test de flujo completo: login → buscar producto → agregar carrito → cobrar
- [ ] `3.3.3` Test de flujo de caja: apertura → registrar movimiento → cierre
- [ ] `3.3.4` Test de permisos: SELLER no accede a admin

### 3.4 Build y distribución 🔴 (2 días)

- [ ] `3.4.1` Probar `npm run build` en producción
- [ ] `3.4.2` Configurar `electron-builder` para Linux (AppImage)
- [ ] `3.4.3` Configurar `electron-builder` para Windows (NSIS)
- [ ] `3.4.4` Probar instalador en máquina limpia
- [ ] `3.4.5` Scripts CI/CD básicos (GitHub Actions): lint + typecheck + test + build

---

## Fase 4 — Post-MVP (futuro inmediato)

### 4.1 Plugin USD Rate 🔴
- [ ] Implementar `IUsdRateProvider` para BCV
- [ ] Implementar para EnParaleloVzla
- [ ] Implementar para CriptoDólar
- [ ] UI de configuración de fuente USD
- [ ] Auto-actualización cada N minutos

### 4.2 Plugin Impresora Fiscal 🔴
- [ ] Implementar `IFiscalPrinter` para Bixolon
- [ ] Implementar para Epson
- [ ] Implementar para Sharp
- [ ] Implementar para SAM4s
- [ ] UI de configuración de impresora

### 4.3 Modo multi-caja 🔴
- [ ] Servidor Node independiente
- [ ] Cliente Electron se conecta vía WebSocket
- [ ] Sincronización de ventas entre cajas

---

## Resumen de esfuerzo

| Fase | Tareas | Días estimados | Semanas |
|------|--------|----------------|---------|
| 1 — Fundación | 4 bloques | ~11 | 2 |
| 2 — Núcleo POS | 7 bloques | ~26 | 5 |
| 3 — Calidad | 4 bloques | ~9 | 2 |
| **Total MVP** | **15 bloques** | **~46** | **~9** |

## Dependencias clave

```
1.1 Router ───────────┬── 2.1 CRUD productos ── 2.2 POS carrito ── 2.3 Cobro
                        │                                                
1.3.1 Repo Producto ───┘                                                
1.3.2 Repo Venta ───────────────────────────── 2.3 Cobro ── 2.5 Historial
1.3.3 Repo Caja ─────────────────────────────────────────── 2.4 Arqueo
1.3.4 Repo Usuario ────────────────────────────────────────── 2.7 Admin
1.2 Sesión ─────────────────────────────────────── (transversal)
3.1 Atajos ────────────────────────────────────── (transversal)
```

---

## Issues de GitHub sugeridos

Por cada bloque de tareas se creará un issue en GitHub con:

- Título: `[Fase1] Router de navegación interna`
- Checklist con las subtareas
- Labels: `feature`, `fase-1`, `frontend`, `backend`
- Milestone: `v1.0.0 MVP`
- Assignee: por definir

```
Milestone: v1.0.0 MVP
├── #1 Router de navegación
├── #2 Persistencia de sesión
├── #3 Repositorios Prisma
├── #4 CRUD de productos
├── #5 Pantalla POS + carrito
├── #6 Modal de cobro
├── #7 Arqueo de caja
├── #8 Historial de ventas
├── #9 Reportes básicos
├── #10 Admin de usuarios
├── #11 Atajos de teclado
├── #12 Validaciones
├── #13 Tests de integración
└── #14 Build y distribución
```
