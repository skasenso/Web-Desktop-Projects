'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function updateHouse(id: number, data: {
  name?: string
  capacity?: number
}) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const house = await tx.house.update({
      where: { id },
      data
    })
    revalidatePath('/dashboard/climate')
    revalidatePath('/dashboard/settings')
    return { 
      success: true, 
      house: { 
        ...house, 
        currentTemperature: house.currentTemperature ? Number(house.currentTemperature) : null,
        currentHumidity: house.currentHumidity ? Number(house.currentHumidity) : null
      } 
    }
  }).catch((error: any) => {
    console.error('Error updating house:', error)
    return { success: false, error: 'Failed to update house' }
  })
}

export async function deleteHouse(id: number) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    await tx.house.delete({
      where: { id }
    })
    revalidatePath('/dashboard/climate')
    revalidatePath('/dashboard/settings')
    return { success: true }
  }).catch((error: any) => {
    console.error('Error deleting house:', error)
    return { success: false, error: 'Failed to delete house' }
  })
}
