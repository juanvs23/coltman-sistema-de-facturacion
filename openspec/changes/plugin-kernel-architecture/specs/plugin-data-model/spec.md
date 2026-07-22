# plugin-data-model Specification

## Purpose

Plugins extienden el schema de base de datos con sus propias tablas. Las tablas usan namespace `plugin_<id>_` para prevenir colisiones. El kernel gestiona migraciones.

## Requirements

### Requirement: Schema declaration

Un plugin MAY declarar modelos Prisma adicionales en su propio `schema.prisma`. Todos los nombres de tabla MUST tener prefijo `plugin_<id>_`.

#### Scenario: Migración de plugin

- GIVEN un plugin con id "fiscal-printer" que declara `model plugin_fiscal_printer_Log { ... }`
- WHEN el kernel ejecuta migración
- THEN una tabla `plugin_fiscal_printer_Log` se crea en la base de datos SQLite

### Requirement: Namespace enforcement

El kernel MUST validar que todas las tablas declaradas por un plugin comiencen con `plugin_<id>_` y REJECT el schema si alguna tabla viola esta regla.

#### Scenario: Tabla sin prefijo

- GIVEN un plugin schema con un nombre de tabla sin prefijo
- WHEN el kernel lo valida
- THEN la activación del plugin falla con un error descriptivo

### Requirement: Isolation guarantee

El kernel MUST NOT permitir acceso cross-plugin a tablas via Prisma. Cada plugin opera solo en sus tablas `plugin_<id>_*`.

#### Scenario: Aislamiento entre plugins

- GIVEN plugin A crea `plugin_a_Settings` y plugin B crea `plugin_b_Settings`
- WHEN cualquiera consulta
- THEN solo puede leer/escribir sus propias tablas namespacedas
