# hook-bus Specification

## Purpose

Bus de eventos para comunicación core-plugin e inter-plugin. Dos tipos: actions (fire-and-forget) y filters (transformación de datos). Ambos soportan prioridad numérica.

## Requirements

### Requirement: Action hooks

Actions ejecutan callbacks cuando un evento nombrado es despachado. Callbacks reciben `data` y no retornan valor. Prioridad menor = ejecuta primero (default 10).

#### Scenario: Prioridad de ejecución

- GIVEN `hookBus.on('sale:completed', fn, 5)` y `hookBus.on('sale:completed', fn2, 20)`
- WHEN `hookBus.action('sale:completed', { saleId: 1 })`
- THEN fn ejecuta antes que fn2

### Requirement: Filter hooks

Filters reciben un payload, lo transforman, y MUST retornar el payload (posiblemente modificado). Cada callback recibe `(payload: T): T`. La salida de un filter es entrada del siguiente (pipeline).

#### Scenario: Pipeline de filtros

- GIVEN `hookBus.filter('printer:receipt-data', addFooter, 10)` donde addFooter agrega una línea
- WHEN `hookBus.applyFilter('printer:receipt-data', { lines: [...] })`
- THEN el payload retornado contiene la línea de footer agregada

### Requirement: Unsubscription

Un plugin MAY remover sus hook callbacks.

#### Scenario: Desuscripción

- GIVEN un callback registrado en `sale:completed`
- WHEN el plugin llama `hookBus.off('sale:completed', fn)`
- THEN fn ya no se ejecuta cuando el hook se dispara
