# plugin-ui-extension Specification

## Purpose

Plugins inyectan UI en el shell del POS: items de menú, rutas completas, y tabs de configuración. El core renderiza desde UiRegistry.

## Requirements

### Requirement: Menu item registration

Un plugin MAY registrar un item de menú con: `id`, `label`, `icon`, `route`, `permission`.

#### Scenario: Item en sidebar

- GIVEN un plugin registra `{ id: 'fiscal', label: 'Fiscal', icon: 'printer', route: '/plugins/fiscal', permission: 'ADMIN' }`
- WHEN el sidebar renderiza
- THEN un item "Fiscal" aparece con el icono especificado, visible solo para usuarios ADMIN

### Requirement: Settings tab registration

Un plugin MAY registrar un tab de configuración con: `id`, `label`, `component` (React lazy component).

#### Scenario: Tab en Settings

- GIVEN un plugin registra un settings tab via UiRegistry
- WHEN el usuario abre Settings
- THEN el tab aparece y al hacer clic renderiza el componente del plugin dentro de un `<Suspense>`

### Requirement: Lazy loading

Plugin UI components MUST cargarse lazy via `React.lazy()`. El core envuelve cada ruta en `<Suspense>`.

#### Scenario: Carga bajo demanda

- GIVEN una ruta registrada con `React.lazy(() => import('./FiscalPage'))`
- WHEN el usuario navega a esa ruta
- THEN el componente se fetch bajo demanda; un skeleton se muestra mientras carga
