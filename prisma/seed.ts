import { PrismaClient, Role, ProductType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Seeding database...')

  // ── Clean existing data ──────────────────────────────────────
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

  const superAdmin = await prisma.user.create({
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

  // ── Categories ───────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Alimentos', color: '#10b981' } }),
    prisma.category.create({ data: { name: 'Bebidas', color: '#3b82f6' } }),
    prisma.category.create({ data: { name: 'Electrónicos', color: '#8b5cf6' } }),
    prisma.category.create({ data: { name: 'Hogar', color: '#f59e0b' } }),
    prisma.category.create({ data: { name: 'Servicios', color: '#ef4444' } })
  ])

  const [alimentos, bebidas, electronicos, hogar, servicios] = categories

  console.log('  ✅ Categories created')

  // ── Products ─────────────────────────────────────────────────
  // Alimentos
  await prisma.product.create({
    data: { code: 'HAR001', name: 'Harina PAN 1kg', price: 4.50, cost: 3.20, stock: 100, taxRate: 16.0, categoryId: alimentos.id }
  })
  await prisma.product.create({
    data: { code: 'ARR001', name: 'Arroz Blanquito 1kg', price: 3.00, cost: 2.10, stock: 80, taxRate: 16.0, categoryId: alimentos.id }
  })
  await prisma.product.create({
    data: { code: 'ACE001', name: 'Aceite Maíz 1L', price: 5.50, cost: 4.00, stock: 60, taxRate: 16.0, categoryId: alimentos.id }
  })
  await prisma.product.create({
    data: { code: 'AZU001', name: 'Azúcar 1kg', price: 2.50, cost: 1.80, stock: 90, taxRate: 16.0, categoryId: alimentos.id }
  })
  await prisma.product.create({
    data: { code: 'LEC001', name: 'Leche Completa 1L', price: 3.20, cost: 2.40, stock: 50, taxRate: 16.0, categoryId: alimentos.id }
  })
  await prisma.product.create({
    data: { code: 'CAF001', name: 'Café Madrigal 250g', price: 6.00, cost: 4.50, stock: 40, taxRate: 16.0, categoryId: alimentos.id }
  })
  await prisma.product.create({
    data: { code: 'PAS001', name: 'Pasta La Molisana 500g', price: 2.80, cost: 1.90, stock: 70, taxRate: 16.0, categoryId: alimentos.id }
  })

  // Bebidas
  await prisma.product.create({
    data: { code: 'REF001', name: 'Coca-Cola 1.5L', price: 4.00, cost: 2.80, stock: 120, taxRate: 16.0, categoryId: bebidas.id }
  })
  await prisma.product.create({
    data: { code: 'REF002', name: 'Pepsi 1.5L', price: 3.80, cost: 2.60, stock: 100, taxRate: 16.0, categoryId: bebidas.id }
  })
  await prisma.product.create({
    data: { code: 'AGU001', name: 'Agua Mineral 1.5L', price: 1.50, cost: 1.00, stock: 200, taxRate: 16.0, categoryId: bebidas.id }
  })
  await prisma.product.create({
    data: { code: 'CER001', name: 'Polar Pilsen Lata 355ml', price: 2.20, cost: 1.50, stock: 150, taxRate: 16.0, categoryId: bebidas.id }
  })
  await prisma.product.create({
    data: { code: 'JGO001', name: 'Jugo Natural Naranja 1L', price: 5.00, cost: 3.50, stock: 30, taxRate: 16.0, categoryId: bebidas.id }
  })

  // Electrónicos
  await prisma.product.create({
    data: { code: 'CBL001', name: 'Cable USB-C 2m', price: 8.00, cost: 5.00, stock: 50, taxRate: 16.0, categoryId: electronicos.id }
  })
  await prisma.product.create({
    data: { code: 'CRG001', name: 'Cargador Rápido 20W', price: 25.00, cost: 15.00, stock: 30, taxRate: 16.0, categoryId: electronicos.id }
  })
  await prisma.product.create({
    data: { code: 'AIR001', name: 'Auriculares Bluetooth', price: 45.00, cost: 28.00, stock: 20, taxRate: 16.0, categoryId: electronicos.id }
  })
  await prisma.product.create({
    data: { code: 'MEM001', name: 'Memoria USB 64GB', price: 18.00, cost: 10.00, stock: 35, taxRate: 16.0, categoryId: electronicos.id }
  })

  // Hogar
  await prisma.product.create({
    data: { code: 'DET001', name: 'Detergente Líquido 1L', price: 7.00, cost: 5.00, stock: 45, taxRate: 16.0, categoryId: hogar.id }
  })
  await prisma.product.create({
    data: { code: 'CLO001', name: 'Cloro 1L', price: 2.00, cost: 1.20, stock: 60, taxRate: 16.0, categoryId: hogar.id }
  })
  await prisma.product.create({
    data: { code: 'PAP001', name: 'Papel Higiénico x4', price: 5.50, cost: 3.80, stock: 80, taxRate: 16.0, categoryId: hogar.id }
  })
  await prisma.product.create({
    data: { code: 'JAB001', name: 'Jabón de Baño x3', price: 4.00, cost: 2.50, stock: 70, taxRate: 16.0, categoryId: hogar.id }
  })

  // Servicios (sin inventario)
  await prisma.product.create({
    data: { code: 'SER001', name: 'Recarga Movil Digital', price: 10.00, type: ProductType.SERVICE, taxRate: 0.0, categoryId: servicios.id }
  })
  await prisma.product.create({
    data: { code: 'SER002', name: 'Recarga Movil $10', price: 10.00, cost: 9.50, type: ProductType.SERVICE, priceUsd: 10.00, taxRate: 0.0, categoryId: servicios.id }
  })

  console.log('  ✅ Products created')

  // ── App Config (default) ─────────────────────────────────────
  await prisma.appConfig.create({
    data: {
      currencySymbol: 'Bs.',
      usdRate: 48.50,
      usdRateSource: 'bcv',
      taxRateDefault: 16.0,
      lowStockThreshold: 10,
      receiptFooter: '¡Gracias por su compra!',
      darkMode: false
    }
  })

  console.log('  ✅ AppConfig created')

  // ── Fiscal Config (default) ──────────────────────────────────
  await prisma.fiscalConfig.create({
    data: {
      printerType: 'bixolon',
      printerPort: 'USB',
      printerEnabled: false,
      taxPayerId: 'J-12345678-9',
      businessName: 'Mi Negocio C.A.',
      fiscalAddress: 'Av. Principal, Local 1, Caracas',
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
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
