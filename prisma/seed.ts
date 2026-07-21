import { PrismaClient, ProductType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const USD_RATE = 48.50

function calcBs(usd: number, rate: number = USD_RATE): number {
  return Math.round(usd * rate * 100) / 100
}

const PERMISSION_DEFS: { handler: string; description: string; category: string }[] = [
  { handler: 'products:list', description: 'Listar productos', category: 'inventory' },
  { handler: 'products:search', description: 'Buscar productos', category: 'inventory' },
  { handler: 'products:create', description: 'Crear productos', category: 'inventory' },
  { handler: 'products:update', description: 'Editar productos', category: 'inventory' },
  { handler: 'products:delete', description: 'Eliminar productos', category: 'inventory' },
  { handler: 'categories:list', description: 'Listar categorias', category: 'inventory' },
  { handler: 'categories:create', description: 'Crear categorias', category: 'inventory' },
  { handler: 'categories:update', description: 'Editar categorias', category: 'inventory' },
  { handler: 'categories:delete', description: 'Eliminar categorias', category: 'inventory' },
  { handler: 'taxes:list', description: 'Listar impuestos', category: 'taxes' },
  { handler: 'taxes:create', description: 'Crear impuestos', category: 'taxes' },
  { handler: 'taxes:update', description: 'Editar impuestos', category: 'taxes' },
  { handler: 'customers:list', description: 'Listar clientes', category: 'customers' },
  { handler: 'customers:search', description: 'Buscar clientes', category: 'customers' },
  { handler: 'customers:find-by-tax-id', description: 'Buscar por RIF', category: 'customers' },
  { handler: 'customers:create', description: 'Crear clientes', category: 'customers' },
  { handler: 'customers:update', description: 'Editar clientes', category: 'customers' },
  { handler: 'customers:delete', description: 'Eliminar clientes', category: 'customers' },
  { handler: 'sales:create', description: 'Crear ventas', category: 'sales' },
  { handler: 'sales:list', description: 'Listar ventas', category: 'sales' },
  { handler: 'sales:cancel', description: 'Anular ventas', category: 'sales' },
  { handler: 'sales:next-receipt-number', description: 'Ver correlativo', category: 'sales' },
  { handler: 'cash:open', description: 'Abrir caja', category: 'cash' },
  { handler: 'cash:close', description: 'Cerrar caja', category: 'cash' },
  { handler: 'cash:summary', description: 'Ver resumen de caja', category: 'cash' },
  { handler: 'cash:add-movement', description: 'Registrar movimiento de caja', category: 'cash' },
  { handler: 'reports:daily', description: 'Reporte diario', category: 'reports' },
  { handler: 'reports:by-product', description: 'Reporte por producto', category: 'reports' },
  { handler: 'reports:by-user', description: 'Reporte por usuario', category: 'reports' },
  { handler: 'reports:iva', description: 'Libro IVA', category: 'reports' },
  { handler: 'config:get', description: 'Ver configuracion', category: 'config' },
  { handler: 'config:update', description: 'Editar configuracion', category: 'config' },
  { handler: 'company:get', description: 'Ver datos de empresa', category: 'config' },
  { handler: 'company:update', description: 'Editar datos de empresa', category: 'config' },
  { handler: 'usd:rate', description: 'Ver tasa USD', category: 'config' },
  { handler: 'usd:history', description: 'Historial de tasas USD', category: 'config' },
  { handler: 'printer:test', description: 'Probar impresora', category: 'printer' },
  { handler: 'printer:print-receipt', description: 'Imprimir recibo', category: 'printer' },
  { handler: 'fiscal:get', description: 'Ver configuracion fiscal', category: 'config' },
  { handler: 'fiscal:update', description: 'Editar configuracion fiscal', category: 'config' },
  { handler: 'users:list', description: 'Listar usuarios', category: 'admin' },
  { handler: 'users:create', description: 'Crear usuarios', category: 'admin' },
  { handler: 'users:update', description: 'Editar usuarios', category: 'admin' },
  { handler: 'users:toggle-active', description: 'Activar/desactivar usuarios', category: 'admin' },
  { handler: 'plugins:list', description: 'Listar plugins', category: 'admin' },
  { handler: 'plugins:install', description: 'Instalar plugins', category: 'admin' },
  { handler: 'plugins:toggle-active', description: 'Activar/desactivar plugins', category: 'admin' },
  { handler: 'roles:list', description: 'Listar roles', category: 'admin' },
  { handler: 'roles:create', description: 'Crear roles', category: 'admin' },
  { handler: 'roles:update', description: 'Editar roles', category: 'admin' },
  { handler: 'roles:delete', description: 'Eliminar roles', category: 'admin' },
]

const SELLER_PERMISSIONS = [
  'products:list', 'products:search',
  'categories:list',
  'taxes:list',
  'customers:list', 'customers:search', 'customers:find-by-tax-id',
  'sales:create', 'sales:list', 'sales:cancel', 'sales:next-receipt-number',
  'cash:summary',
  'reports:daily', 'reports:by-product', 'reports:by-user', 'reports:iva',
  'config:get',
  'company:get',
  'usd:rate',
  'usd:history',
]

const ADMIN_PERMISSIONS = [
  ...SELLER_PERMISSIONS,
  'products:create', 'products:update', 'products:delete',
  'categories:create', 'categories:update', 'categories:delete',
  'taxes:create', 'taxes:update',
  'customers:create', 'customers:update', 'customers:delete',
  'cash:open', 'cash:close', 'cash:add-movement',
  'config:update',
  'company:update',
  'printer:test', 'printer:print-receipt',
  'fiscal:get', 'fiscal:update',
]

const SUPERADMIN_PERMISSIONS = [
  ...ADMIN_PERMISSIONS,
  'users:list', 'users:create', 'users:update', 'users:toggle-active',
  'plugins:list', 'plugins:install', 'plugins:toggle-active',
  'roles:list', 'roles:create', 'roles:update', 'roles:delete',
]

async function main(): Promise<void> {
  console.log('🌱 Seeding database...')

  // ── Clean existing data ──────────────────────────────────────
  await prisma.productTax.deleteMany()
  await prisma.tax.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.cashMovement.deleteMany()
  await prisma.cashRegister.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()
  await prisma.companyConfig.deleteMany()
  await prisma.fiscalConfig.deleteMany()
  await prisma.appConfig.deleteMany()

  // ── Permissions ─────────────────────────────────────────────
  console.log('  Creating permissions...')
  for (const perm of PERMISSION_DEFS) {
    await prisma.permission.upsert({
      where: { handler: perm.handler },
      create: perm,
      update: { description: perm.description, category: perm.category }
    })
  }

  // ── Roles ───────────────────────────────────────────────────
  console.log('  Creating roles...')
  const superadminRole = await prisma.role.create({
    data: { name: 'superadmin', description: 'Acceso total al sistema', editable: false }
  })
  const adminRole = await prisma.role.create({
    data: { name: 'admin', description: 'Administracion de productos, impuestos y configuracion', editable: false }
  })
  const sellerRole = await prisma.role.create({
    data: { name: 'seller', description: 'Punto de venta y consultas', editable: false }
  })

  // ── Role Permissions ────────────────────────────────────────
  console.log('  Assigning permissions...')
  const permMap = new Map<string, string>()
  for (const p of await prisma.permission.findMany()) {
    permMap.set(p.handler, p.id)
  }

  for (const handler of SELLER_PERMISSIONS) {
    const pid = permMap.get(handler)
    if (pid) await prisma.rolePermission.create({ data: { roleId: sellerRole.id, permissionId: pid } })
  }
  for (const handler of ADMIN_PERMISSIONS) {
    const pid = permMap.get(handler)
    if (pid) await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: pid } })
  }
  for (const handler of SUPERADMIN_PERMISSIONS) {
    const pid = permMap.get(handler)
    if (pid) await prisma.rolePermission.create({ data: { roleId: superadminRole.id, permissionId: pid } })
  }

  console.log(`  ✅ ${SELLER_PERMISSIONS.length} seller / ${ADMIN_PERMISSIONS.length} admin / ${SUPERADMIN_PERMISSIONS.length} superadmin`)

  // ── Users ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 10)

  await prisma.user.create({
    data: {
      username: 'admin',
      password: passwordHash,
      fullName: 'Administrador Principal',
      roleId: superadminRole.id
    }
  })

  await prisma.user.create({
    data: {
      username: 'vendedor1',
      password: passwordHash,
      fullName: 'María González',
      roleId: sellerRole.id
    }
  })

  await prisma.user.create({
    data: {
      username: 'vendedor2',
      password: passwordHash,
      fullName: 'Carlos Pérez',
      roleId: sellerRole.id
    }
  })

  console.log('  ✅ Users created')

  // ── Taxes ────────────────────────────────────────────────────
  const ivaGeneral = await prisma.tax.create({
    data: { name: 'IVA General 16%', rate: 16.0, description: 'Impuesto al Valor Agregado 16%' }
  })
  const ivaReducido = await prisma.tax.create({
    data: { name: 'IVA Reducido 8%', rate: 8.0, description: 'IVA reducido para rubros seleccionados' }
  })
  const exento = await prisma.tax.create({
    data: { name: 'Exento', rate: 0.0, description: 'Productos exentos de IVA' }
  })

  console.log('  ✅ Taxes created')

  // ── Categories ───────────────────────────────────────────────
  const [alimentos, bebidas, electronicos, hogar, servicios] = await Promise.all([
    prisma.category.create({ data: { name: 'Alimentos', color: '#10b981' } }),
    prisma.category.create({ data: { name: 'Bebidas', color: '#3b82f6' } }),
    prisma.category.create({ data: { name: 'Electrónicos', color: '#8b5cf6' } }),
    prisma.category.create({ data: { name: 'Hogar', color: '#f59e0b' } }),
    prisma.category.create({ data: { name: 'Servicios', color: '#ef4444' } })
  ])

  console.log('  ✅ Categories created')

  // ── Products ─────────────────────────────────────────────────
  // Helper para crear producto con impuestos
  async function createProduct(data: {
    code: string; name: string; priceUsd: number; description?: string; cost?: number;
    stock?: number; type?: ProductType; categoryId: string; taxes: Array<{ id: string }>
  }): Promise<void> {
    const product = await prisma.product.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type ?? ProductType.PRODUCT,
        priceUsd: data.priceUsd,
        price: calcBs(data.priceUsd),
        cost: data.cost ?? undefined,
        stock: data.stock ?? 0,
        categoryId: data.categoryId
      }
    })

    // Asociar impuestos
    for (const tax of data.taxes) {
      await prisma.productTax.create({
        data: { productId: product.id, taxId: tax.id }
      })
    }
  }

  // Alimentos (IVA General)
  await createProduct({
    code: 'HAR001', name: 'Harina PAN 1kg', priceUsd: 0.10, cost: 0.07, stock: 100,
    categoryId: alimentos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'ARR001', name: 'Arroz Blanquito 1kg', priceUsd: 0.07, cost: 0.05, stock: 80,
    categoryId: alimentos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'ACE001', name: 'Aceite Maíz 1L', priceUsd: 0.12, cost: 0.09, stock: 60,
    categoryId: alimentos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'AZU001', name: 'Azúcar 1kg', priceUsd: 0.06, cost: 0.04, stock: 90,
    categoryId: alimentos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'LEC001', name: 'Leche Completa 1L', priceUsd: 0.07, cost: 0.05, stock: 50,
    categoryId: alimentos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'CAF001', name: 'Café Madrigal 250g', priceUsd: 0.13, cost: 0.10, stock: 40,
    categoryId: alimentos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'PAS001', name: 'Pasta La Molisana 500g', priceUsd: 0.06, cost: 0.04, stock: 70,
    categoryId: alimentos.id, taxes: [ivaGeneral]
  })

  // Bebidas (IVA General)
  await createProduct({
    code: 'REF001', name: 'Coca-Cola 1.5L', priceUsd: 0.09, cost: 0.06, stock: 120,
    categoryId: bebidas.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'REF002', name: 'Pepsi 1.5L', priceUsd: 0.08, cost: 0.06, stock: 100,
    categoryId: bebidas.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'AGU001', name: 'Agua Mineral 1.5L', priceUsd: 0.04, cost: 0.02, stock: 200,
    categoryId: bebidas.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'CER001', name: 'Polar Pilsen Lata 355ml', priceUsd: 0.05, cost: 0.03, stock: 150,
    categoryId: bebidas.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'JGO001', name: 'Jugo Natural Naranja 1L', priceUsd: 0.11, cost: 0.08, stock: 30,
    categoryId: bebidas.id, taxes: [ivaGeneral]
  })

  // Electrónicos (IVA General)
  await createProduct({
    code: 'CBL001', name: 'Cable USB-C 2m', priceUsd: 0.17, cost: 0.11, stock: 50,
    categoryId: electronicos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'CRG001', name: 'Cargador Rápido 20W', priceUsd: 0.52, cost: 0.31, stock: 30,
    categoryId: electronicos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'AIR001', name: 'Auriculares Bluetooth', priceUsd: 0.93, cost: 0.58, stock: 20,
    categoryId: electronicos.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'MEM001', name: 'Memoria USB 64GB', priceUsd: 0.38, cost: 0.21, stock: 35,
    categoryId: electronicos.id, taxes: [ivaGeneral]
  })

  // Hogar (IVA General)
  await createProduct({
    code: 'DET001', name: 'Detergente Líquido 1L', priceUsd: 0.15, cost: 0.11, stock: 45,
    categoryId: hogar.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'CLO001', name: 'Cloro 1L', priceUsd: 0.05, cost: 0.03, stock: 60,
    categoryId: hogar.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'PAP001', name: 'Papel Higiénico x4', priceUsd: 0.12, cost: 0.08, stock: 80,
    categoryId: hogar.id, taxes: [ivaGeneral]
  })
  await createProduct({
    code: 'JAB001', name: 'Jabón de Baño x3', priceUsd: 0.09, cost: 0.06, stock: 70,
    categoryId: hogar.id, taxes: [ivaGeneral]
  })

  // Servicios (sin IVA)
  await createProduct({
    code: 'SER001', name: 'Recarga Movil Digital', priceUsd: 10.00, type: ProductType.SERVICE,
    categoryId: servicios.id, taxes: [exento]
  })
  await createProduct({
    code: 'SER002', name: 'Recarga Movil $10', priceUsd: 10.00, cost: 9.50, type: ProductType.SERVICE,
    categoryId: servicios.id, taxes: [exento]
  })

  console.log('  ✅ Products created')

  // ── App Config (default) ─────────────────────────────────────
  await prisma.appConfig.create({
    data: {
      currencySymbol: 'Bs.',
      country: 'VE',
      usdRate: USD_RATE,
      usdRateSource: 'bcv',
      taxRateDefault: 16.0,
      lowStockThreshold: 10,
      receiptFooter: '¡Gracias por su compra!',
      darkMode: false
    }
  })

  console.log('  ✅ AppConfig created')

  // ── Company Config (default) ──────────────────────────────────
  await prisma.companyConfig.upsert({
    where: { id: 'default' },
    update: {
      businessName: 'Mi Negocio C.A.',
      taxId: 'J-12345678-9',
      address: 'Av. Principal, Local 1, Caracas',
      phone: '+58 212 1234567',
      email: 'contacto@minegocio.com',
    },
    create: {
      businessName: 'Mi Negocio C.A.',
      taxId: 'J-12345678-9',
      address: 'Av. Principal, Local 1, Caracas',
      phone: '+58 212 1234567',
      email: 'contacto@minegocio.com',
      logo: ''
    }
  })

  console.log('  ✅ CompanyConfig created')

  // ── Fiscal Config (default) ──────────────────────────────────
  await prisma.fiscalConfig.create({
    data: {
      printerType: 'bixolon',
      printerPort: 'USB',
      printerEnabled: false,
      seniatEnabled: false,
      autoSendSeniat: false
    }
  })

  console.log('  ✅ FiscalConfig created')
  console.log('')
  console.log('🎉 Seed completed!')
  console.log('')
  console.log('Users:')
  console.log('  admin     / admin123  (SUPERADMIN)')
  console.log('  vendedor1 / admin123  (SELLER)')
  console.log('  vendedor2 / admin123  (SELLER)')
  console.log('')
  console.log(`USD Rate: Bs. ${USD_RATE} / $1`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
