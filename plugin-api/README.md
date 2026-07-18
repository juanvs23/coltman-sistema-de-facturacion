# @sistema-facturacion/plugin-api

Public API for building plugins for **Sistema de Facturación POS**.

## Installation

```bash
npm install @sistema-facturacion/plugin-api
```

## Quick Start

Create a plugin with this structure:

```
my-plugin/
├── plugin.json
├── index.ts
└── package.json
```

### plugin.json

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Does something useful",
  "author": "Your Name",
  "visibility": "free",
  "target": "main",
  "hooks": ["sale:completed"],
  "coreVersion": ">=0.1.0"
}
```

### index.ts

```ts
import { IPlugin, PluginManifest, PluginResult } from '@sistema-facturacion/plugin-api'

export default class MyPlugin implements IPlugin {
  manifest: PluginManifest = {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'Does something useful',
    author: 'Your Name',
    visibility: 'free',
    target: 'main',
    hooks: ['sale:completed']
  }

  async activate(): Promise<PluginResult> {
    console.log('My plugin activated!')
    return { success: true }
  }

  async deactivate(): Promise<PluginResult> {
    console.log('My plugin deactivated!')
    return { success: true }
  }

  async onHook(event): Promise<PluginResult> {
    if (event.hook === 'sale:completed') {
      console.log('Sale completed:', event.data)
    }
    return { success: true }
  }
}
```

## Available Contracts

| Interface | Description |
|---|---|
| `IPlugin` | Base interface for all plugins |
| `IFiscalPrinter` | Fiscal printer integration (Bixolon, Epson, Sharp, SAM4s) |
| `IUsdRateProvider` | USD exchange rate sources |
| `IRestaurant` | Restaurant module (tables, splits, kitchen) |
| `ISeniat` | SENIAT electronic invoicing |
| `ILicenseManager` | License validation (for premium plugins) |

## License

MIT — this API is open source. Build whatever you want.
