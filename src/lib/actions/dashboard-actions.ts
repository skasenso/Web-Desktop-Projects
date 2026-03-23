'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// We'll replace MOCK_USER_ID with real IDs from the session
async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}


export async function getDashboardStats() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const totalBirds = await tx.batch.aggregate({
      where: { status: 'active' },
      _sum: { currentCount: true }
    })

    const eggsData = await tx.eggProduction.aggregate({
      _sum: { eggsCollected: true }
    })

    const mortalityData = await tx.mortality.aggregate({
      _sum: { count: true }
    })

    const totalInitialBirds = await tx.batch.aggregate({
      _sum: { initialCount: true }
    })

    const mortalityRate = totalInitialBirds._sum.initialCount 
      ? (Number(mortalityData._sum.count || 0) / Number(totalInitialBirds._sum.initialCount)) * 100 
      : 0

    const lowFeedThreshold = 500 // kg
    const lowFeedAlerts = await tx.inventory.findMany({
      where: {
        category: 'feed',
        stockLevel: {
          lt: lowFeedThreshold
        }
      }
    })

    const activeBatches = await tx.batch.findMany({
      where: { status: 'active' },
      include: {
        house: true,
        eggProduction: {
          orderBy: { logDate: 'desc' },
          take: 1
        }
      }
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const todayMortality = await tx.mortality.aggregate({
      where: { logDate: { gte: today } },
      _sum: { count: true }
    })

    const todayEggs = await tx.eggProduction.aggregate({
      where: { logDate: { gte: today } },
      _sum: { eggsCollected: true }
    })

    // Fetch raw data for last 7 days for trends
    const recentEggs = await tx.eggProduction.findMany({
      where: { logDate: { gte: sevenDaysAgo } },
      orderBy: { logDate: 'asc' }
    })
    
    const recentFeed = await tx.feedingLog.findMany({
      where: { logDate: { gte: sevenDaysAgo } },
      orderBy: { logDate: 'asc' }
    })

    const recentSales = await tx.sale.findMany({
      where: { saleDate: { gte: sevenDaysAgo } },
      orderBy: { saleDate: 'asc' }
    })

    const recentMortality = await tx.mortality.findMany({
      where: { logDate: { gte: sevenDaysAgo } },
      orderBy: { logDate: 'asc' }
    })

    // Helper to format Date to YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Generate last 7 days labels
    const trendDates = Array.from({length: 7}).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return formatDate(d)
    })

    const eggTrendData = trendDates.map(date => {
      const dayTotal = recentEggs.filter((e: any) => formatDate(e.logDate) === date).reduce((sum: number, e: any) => sum + e.eggsCollected, 0)
      return { date, count: dayTotal }
    })

    const feedTrendData = trendDates.map(date => {
      const dayTotal = recentFeed.filter((f: any) => formatDate(f.logDate) === date).reduce((sum: number, f: any) => sum + Number(f.amountConsumed), 0)
      return { date, count: dayTotal }
    })

    const revenueTrendData = trendDates.map(date => {
      const dayTotal = recentSales.filter((s: any) => formatDate(s.saleDate) === date).reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0)
      return { date, count: dayTotal }
    })

    const mortalityTrendData = trendDates.map(date => {
      const dayTotal = recentMortality.filter((m: any) => formatDate(m.logDate) === date).reduce((sum: number, m: any) => sum + m.count, 0)
      return { date, count: dayTotal }
    })

    return {
      totalBirds: totalBirds._sum.currentCount || 0,
      mortalityRate: mortalityRate.toFixed(2),
      overallDead: mortalityData._sum.count || 0,
      todayDead: todayMortality._sum.count || 0,
      totalEggs: eggsData._sum.eggsCollected || 0,
      todayEggs: todayEggs._sum.eggsCollected || 0,
      lowFeedAlertsCount: lowFeedAlerts.length,
      lowFeedItems: lowFeedAlerts.map((i: any) => ({ name: i.itemName, stockLevel: Number(i.stockLevel), category: i.category })),
      eggTrendData,
      feedTrendData,
      revenueTrendData,
      mortalityTrendData,
      activeBatches: activeBatches.map((batch: any) => ({
        id: `FLK-${batch.id.toString().padStart(3, '0')}`,
        numericId: batch.id,
        breed: batch.breedType || 'Unknown',
        quantity: batch.currentCount,
        hatchDate: batch.arrivalDate.toISOString(),
        status: batch.status,
        houseNumber: batch.house?.name || 'N/A'
      }))
    }
  }).catch((error: any) => {
    console.error('Error fetching dashboard stats:', error)
    throw new Error('Failed to fetch dashboard stats')
  })
}


export async function createBatch(data: {
  houseId: number
  breedType: string
  initialCount: number
  arrivalDate: string
}) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const batch = await tx.batch.create({
      data: {
        houseId: data.houseId,
        breedType: data.breedType,
        initialCount: data.initialCount,
        currentCount: data.initialCount,
        arrivalDate: new Date(data.arrivalDate),
        status: 'active',
        userId: userId
      }
    })
    revalidatePath('/dashboard')
    return { success: true, batch }
  }).catch((error: any) => {
    console.error('Error creating batch:', error)
    return { success: false, error: 'Failed to create batch' }
  })
}


export async function logFeeding(data: {
  batchId: number
  feedTypeId: number
  amountConsumed: number
}) {
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const log = await tx.feedingLog.create({
        data: {
          batchId: data.batchId,
          feedTypeId: data.feedTypeId,
          amountConsumed: data.amountConsumed
        }
      })

      await tx.inventory.update({
        where: { id: data.feedTypeId },
        data: {
          stockLevel: {
            decrement: data.amountConsumed
          }
        }
      })

      return log
    })
    revalidatePath('/dashboard')
    return { success: true, log: { ...result, amountConsumed: Number(result.amountConsumed) } }
  } catch (error) {
    console.error('Error logging feeding:', error)
    return { success: false, error: 'Failed to log feeding' }
  }
}

export async function getHouses() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    return await tx.house.findMany()
  }).catch((error: any) => {
    console.error('Error fetching houses:', error)
    return []
  })
}

export async function getAllBatches() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const batches = await tx.batch.findMany({
      include: {
        house: true,
      },
      orderBy: {
        arrivalDate: 'desc',
      },
    })
    return batches.map((batch: any) => ({
      ...batch,
      house: batch.house ? {
        ...batch.house,
        currentTemperature: batch.house.currentTemperature ? Number(batch.house.currentTemperature) : null,
        currentHumidity: batch.house.currentHumidity ? Number(batch.house.currentHumidity) : null,
      } : null
    }))
  }).catch((error: any) => {
    console.error('Error fetching all batches:', error)
    return []
  })
}


export async function updateBatchStatus(id: number, status: string) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const batch = await tx.batch.update({
      where: { id },
      data: { status },
    })
    revalidatePath('/dashboard/flocks')
    revalidatePath('/dashboard')
    return { success: true, batch }
  }).catch((error: any) => {
    console.error('Error updating batch status:', error)
    return { success: false, error: 'Failed to update batch status' }
  })
}

export async function logProduction(data: {
  batchId: number
  eggsCollected: number
  damagedEggs: number
  birdWeight?: number
  mortalityCount: number
}) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    // Log eggs if collected
    if (data.eggsCollected > 0 || data.damagedEggs > 0) {
      await tx.eggProduction.create({
        data: {
          batchId: data.batchId,
          eggsCollected: data.eggsCollected,
          damagedEggs: data.damagedEggs,
          logDate: new Date(),
          userId: userId
        }
      })
    }

    // Log mortality if occurred
    if (data.mortalityCount > 0) {
      await tx.mortality.create({
        data: {
          batchId: data.batchId,
          count: data.mortalityCount,
          logDate: new Date(),
          userId: userId
        }
      })

      // Update current count in batch
      await tx.batch.update({
        where: { id: data.batchId },
        data: {
          currentCount: {
            decrement: data.mortalityCount
          }
        }
      })
    }

    revalidatePath('/dashboard/eggs')
    revalidatePath('/dashboard')
    return { success: true }
  }).catch((error: any) => {
    console.error('Error logging production:', error)
    return { success: false, error: 'Failed to log production' }
  })
}

export async function updateFarmInfo(data: { name: string, location?: string, capacity: number }) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const farm = await tx.farm.findFirst({ where: { userId } })
    if (!farm) throw new Error('Farm not found')
    
    const updatedFarm = await tx.farm.update({
      where: { id: farm.id },
      data: {
        name: data.name,
        location: data.location,
        capacity: data.capacity
      }
    })
    revalidatePath('/dashboard/settings')
    return { success: true, farm: updatedFarm }
  }).catch((error: any) => {
    console.error('Error updating farm info:', error)
    return { success: false, error: 'Failed to update farm info' }
  })
}

export async function createHouse(data: { houseNumber: string, capacity: number }) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const farm = await tx.farm.findFirst({ where: { userId } })
    if (!farm) throw new Error('Farm not found')

    const house = await tx.house.create({
      data: {
        name: data.houseNumber,
        capacity: data.capacity,
        farmId: farm.id,
        userId: userId
      }
    })
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    return { success: true, house }
  }).catch((error: any) => {
    console.error('Error creating house:', error)
    return { success: false, error: 'Failed to create house' }
  })
}

export async function onboardFarmer(data: { name: string, location: string, capacity: number }) {
  const userId = await getUserId()
  try {
    const farm = await prisma.farm.create({
      data: {
        name: data.name,
        location: data.location,
        capacity: data.capacity,
        userId: userId
      }
    })
    revalidatePath('/dashboard')
    return { success: true, farm }
  } catch (error) {
    console.error('Error onboarding farmer:', error)
    return { success: false, error: 'Failed to onboard farmer' }
  }
}

export async function checkOnboardingStatus() {
  const session = await auth()
  if (!session?.user?.id) return { isOnboarded: false, error: 'Unauthorized' }
  
  const farm = await prisma.farm.findFirst({
    where: { userId: session.user.id }
  })
  
  return { isOnboarded: !!farm }
}


export async function getAllEggProduction() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    return await tx.eggProduction.findMany({
      include: {
        batch: true,
      },
      orderBy: {
        logDate: 'desc',
      },
      take: 50,
    })
  }).catch((error: any) => {
    console.error('Error fetching egg production:', error)
    return []
  })
}

export async function getAllFeedingLogs() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const logs = await tx.feedingLog.findMany({
      include: {
        batch: true,
        inventory: true,
      },
      orderBy: {
        logDate: 'desc',
      },
      take: 50,
    })
    return logs.map((log: any) => ({
      ...log,
      amountConsumed: Number(log.amountConsumed),
      inventory: log.inventory ? {
         ...log.inventory,
         stockLevel: Number(log.inventory.stockLevel)
      } : null
    }))
  }).catch((error: any) => {
    console.error('Error fetching feeding logs:', error)
    return []
  })
}

export async function getAllInventory() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const items = await tx.inventory.findMany({
      orderBy: {
        itemName: 'asc',
      },
    })
    return items.map((item: any) => ({
      ...item,
      stockLevel: Number(item.stockLevel)
    }))
  }).catch((error: any) => {
    console.error('Error fetching inventory:', error)
    return []
  })
}

export async function getAllSales() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const sales = await tx.sale.findMany({
      include: {
        items: true,
      },
      orderBy: {
        saleDate: 'desc',
      },
      take: 50,
    })
    return sales.map((sale: any) => ({
      ...sale,
      totalAmount: Number(sale.totalAmount),
      items: sale.items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }))
  }).catch((error: any) => {
    console.error('Error fetching sales:', error)
    return []
  })
}

export async function getAllMortalityLogs() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    return await tx.mortality.findMany({
      include: {
        batch: true,
      },
      orderBy: {
        logDate: 'desc',
      },
      take: 50,
    })
  }).catch((error: any) => {
    console.error('Error fetching mortality logs:', error)
    return []
  })
}

export async function getBatchDetails(id: number) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const batch = await tx.batch.findUnique({
      where: { id },
      include: {
        house: true,
        feedingLogs: {
          include: { inventory: true },
          orderBy: { logDate: 'desc' }
        },
        mortalityRecords: {
          orderBy: { logDate: 'desc' }
        },
        eggProduction: {
          orderBy: { logDate: 'desc' }
        },
        weightRecords: {
          orderBy: { logDate: 'desc' }
        }
      }
    })

    if (!batch) return null

    // Serialize Decimals for Client Components
    return {
      ...batch,
      house: batch.house ? {
        ...batch.house,
        currentTemperature: batch.house.currentTemperature ? Number(batch.house.currentTemperature) : null,
        currentHumidity: batch.house.currentHumidity ? Number(batch.house.currentHumidity) : null,
      } : null,
      feedingLogs: batch.feedingLogs.map((log: any) => ({
        ...log,
        amountConsumed: Number(log.amountConsumed),
        inventory: log.inventory ? {
          ...log.inventory,
          stockLevel: Number(log.inventory.stockLevel)
        } : null
      })),
      weightRecords: batch.weightRecords.map((rec: any) => ({
        ...rec,
        averageWeight: Number(rec.averageWeight)
      }))
    }
  }).catch((error: any) => {
    console.error('Error fetching batch details:', error)
    return null
  })
}

export async function logWeight(data: {
  batchId: number
  averageWeight: number
  logDate: string
}) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const record = await tx.weightRecord.create({
      data: {
        batchId: data.batchId,
        averageWeight: data.averageWeight,
        logDate: new Date(data.logDate),
        userId: userId
      }
    })
    revalidatePath(`/dashboard/flocks/${data.batchId}`)
    return { success: true, record }
  }).catch((error: any) => {
    console.error('Error logging weight:', error)
    return { success: false, error: 'Failed to log weight' }
  })
}

export async function getInventoryDetails(id: number) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const item = await tx.inventory.findUnique({
      where: { id },
      include: {
        feedingLogs: {
          include: { batch: true },
          orderBy: { logDate: 'desc' }
        }
      }
    })

    if (!item) return null

    return {
      ...item,
      stockLevel: Number(item.stockLevel),
      feedingLogs: item.feedingLogs.map((log: any) => ({
        ...log,
        amountConsumed: Number(log.amountConsumed)
      }))
    }
  }).catch((error: any) => {
    console.error('Error fetching inventory details:', error)
    return null
  })
}

export async function getSaleDetails(id: number) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const sale = await tx.sale.findUnique({
      where: { id },
      include: {
        items: true
      }
    })

    if (!sale) return null

    return {
      ...sale,
      totalAmount: Number(sale.totalAmount),
      items: sale.items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }
  }).catch((error: any) => {
    console.error('Error fetching sale details:', error)
    return null
  })
}

export async function getGlobalFlockStats() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const batches = await tx.batch.findMany({
      include: {
        mortalityRecords: true,
        feedingLogs: true,
        eggProduction: true,
      }
    })

    return batches.map((batch: any) => {
      const totalMortality = batch.mortalityRecords.reduce((acc: number, log: any) => acc + log.count, 0)
      const feedConsumed = batch.feedingLogs.reduce((acc: number, log: any) => acc + Number(log.amountConsumed), 0)
      const eggsCollected = batch.eggProduction.reduce((acc: number, log: any) => acc + log.eggsCollected, 0)

      return {
        ...batch,
        totalMortality,
        feedConsumed,
        eggsCollected,
        currentQuantity: batch.initialCount - totalMortality
      }
    })
  }).catch((error: any) => {
    console.error('Error fetching global flock stats:', error)
    return []
  })
}

export async function getGlobalEggStats() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const logs = await tx.eggProduction.findMany({
      include: { batch: true },
      orderBy: { logDate: 'desc' }
    })
    return logs
  }).catch(() => [])
}

export async function getGlobalSalesStats() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const sales = await tx.sale.findMany({
      include: { items: true },
      orderBy: { saleDate: 'desc' }
    })
    return sales.map((sale: any) => ({
      ...sale,
      totalAmount: Number(sale.totalAmount),
      items: sale.items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }))
  }).catch(() => [])
}

export async function getGlobalFeedStats() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const inventory = await tx.inventory.findMany({
      include: { feedingLogs: { include: { batch: true } } }
    })
    return inventory.map((item: any) => ({
      ...item,
      stockLevel: Number(item.stockLevel),
      feedingLogs: item.feedingLogs.map((log: any) => ({
        ...log,
        amountConsumed: Number(log.amountConsumed)
      }))
    }))
  }).catch(() => [])
}
