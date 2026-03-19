import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Create a Farm
  const farm = await prisma.farm.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Green Valley Poultry',
      location: '123 Farm Road, Rural County',
      capacity: 50000,
    },
  })

  // 2. Create two Poultry Houses
  const house1 = await prisma.poultryHouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      farmId: farm.id,
      houseNumber: 'H-01',
      capacity: 10000,
      currentTemperature: 28.5,
      currentHumidity: 65,
    },
  })

  const house2 = await prisma.poultryHouse.upsert({
    where: { id: 2 },
    update: {},
    create: {
      farmId: farm.id,
      houseNumber: 'H-02',
      capacity: 15000,
      currentTemperature: 27.8,
      currentHumidity: 62,
    },
  })

  // 3. Create a Broiler Batch
  const batch = await prisma.batch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      houseId: house1.id,
      breedType: 'Broiler',
      initialCount: 5000,
      currentCount: 4950,
      arrivalDate: new Date('2026-03-01'),
      status: 'active',
    },
  })

  // 4. Create Feed Inventory
  await prisma.feedInventory.upsert({
    where: { id: 1 },
    update: {},
    create: {
      feedType: 'Starter Feed',
      stockLevel: 1200.50,
      unit: 'kg',
    },
  })

  await prisma.feedInventory.upsert({
    where: { id: 2 },
    update: {},
    create: {
      feedType: 'Grower Feed',
      stockLevel: 450.00,
      unit: 'kg',
    },
  })

  // 5. Add some logs
  await prisma.productionLog.create({
    data: {
      batchId: batch.id,
      mortalityCount: 10,
      logDate: new Date(),
    }
  })

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
