import { PrismaClient, Role, ProductType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const USD_RATE = 48.50

function calcBs(usd: number, rate: number = USD_RATE): number {
  return Math.round(usd * rate * 100) / 100
}

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
  await prisma.fiscalConfig.deleteMany()
  await prisma.appConfig.deleteMany()

  // ── Users ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 10)

  await prisma.user.create({
    data: {
      username: 'admin',
      password: passwordHash,
      fullName: 'Administrador Principal',
      role: Role.SUPERADMIN
    }
  })

  await prisma.user.create({
    data: {
      username: 'vendedor1',
      password: passwordHash,
      fullName: 'María González',
      role: Role.SELLER
    }
  })

  await prisma.user.create({
    data: {
      username: 'vendedor2',
      password: passwordHash,
      fullName: 'Carlos Pérez',
      role: Role.SELLER
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
  await prisma.companyConfig.create({
    data: {
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
