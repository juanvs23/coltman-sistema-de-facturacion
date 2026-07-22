# plugin-registry Specification

## Purpose

Gestión del ciclo de vida de plugins: descubrimiento, registro, activación, desactivación y teardown. Los plugins se auto-descubren desde el filesystem.

## Requirements

### Requirement: Auto-discovery

Plugins en `plugins/<id>/` (external) y `src/main/plugins/built-in/<id>/` (core) MUST ser auto-descubiertos al iniciar. Cada plugin MUST tener un `plugin.json` válido con al menos: `id`, `name`, `version`, `visibility`.

#### Scenario: Plugin externo descubierto

- GIVEN un `plugins/fiscal-printer/plugin.json` válido
- WHEN el kernel inicia
- THEN el plugin se registra y su manifest está disponible via `pluginRegistry.list()`

### Requirement: Lifecycle methods

Cada plugin MUST implementar `activate(): PluginResult` y `deactivate(): PluginResult`. Activation MAY registrar hooks, UI, y data models. Deactivation MUST liberar recursos.

#### Scenario: Activación exitosa

- GIVEN un plugin registrado
- WHEN se activa exitosamente
- THEN sus hooks están suscritos, UI entries en UiRegistry, y data models migrados
- AND `pluginRegistry.isActive(id)` retorna `true`

### Requirement: Duplicate id rejection

Dos plugins con el mismo `id` MUST NOT registrarse. El segundo es rechazado con error.

#### Scenario: ID duplicado

- GIVEN un plugin con id="fiscal-printer" ya registrado
- WHEN otro plugin con el mismo id es descubierto
- THEN el kernel logea un warning y lo omite
