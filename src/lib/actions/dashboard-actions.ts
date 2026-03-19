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

    const mortalityData = await tx.productionLog.aggregate({
      _sum: { mortalityCount: true }
    })

    const totalInitialBirds = await tx.batch.aggregate({
      _sum: { initialCount: true }
    })

    const mortalityRate = totalInitialBirds._sum.initialCount 
      ? (Number(mortalityData._sum.mortalityCount || 0) / Number(totalInitialBirds._sum.initialCount)) * 100 
      : 0

    const lowFeedThreshold = 500 // kg
    const lowFeedAlerts = await tx.feedInventory.findMany({
      where: {
        stockLevel: {
          lt: lowFeedThreshold
        }
      }
    })

    const activeBatches = await tx.batch.findMany({
      where: { status: 'active' },
      include: {
        house: true,
        productionLogs: {
          orderBy: { logDate: 'desc' },
          take: 1
        }
      }
    })

    return {
      totalBirds: totalBirds._sum.currentCount || 0,
      mortalityRate: mortalityRate.toFixed(2),
      lowFeedAlertsCount: lowFeedAlerts.length,
      activeBatches: activeBatches.map((batch: any) => ({
        id: `FLK-${batch.id.toString().padStart(3, '0')}`,
        breed: batch.breedType || 'Unknown',
        quantity: batch.currentCount,
        hatchDate: batch.arrivalDate.toISOString(),
        status: batch.status,
        houseNumber: batch.house?.houseNumber || 'N/A'
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

      await tx.feedInventory.update({
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
    return { success: true, log: result }
  } catch (error) {
    console.error('Error logging feeding:', error)
    return { success: false, error: 'Failed to log feeding' }
  }
}

export async function getHouses() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    return await tx.poultryHouse.findMany()
  }).catch((error: any) => {
    console.error('Error fetching houses:', error)
    return []
  })
}

export async function getAllBatches() {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    return await tx.batch.findMany({
      include: {
        house: true,
      },
      orderBy: {
        arrivalDate: 'desc',
      },
    })
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
    const log = await tx.productionLog.create({
      data: {
        batchId: data.batchId,
        eggsCollected: data.eggsCollected,
        damagedEggs: data.damagedEggs,
        birdWeight: data.birdWeight,
        mortalityCount: data.mortalityCount,
        logDate: new Date(),
        userId: userId
      }
    })

    // Update current count in batch if mortality is recorded
    if (data.mortalityCount > 0) {
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
    return { success: true, log }
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

    const house = await tx.poultryHouse.create({
      data: {
        houseNumber: data.houseNumber,
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


