'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createInventoryItem(data: {
  itemName: string
  stockLevel: number
  unit: string
  category?: string
}) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const item = await tx.inventory.create({
      data: {
        ...data,
        userId: userId
      }
    })
    revalidatePath('/dashboard/feed')
    return { success: true, item: { ...item, stockLevel: Number(item.stockLevel) } }
  }).catch((error: any) => {
    console.error('Error creating inventory item:', error)
    return { success: false, error: 'Failed to create item' }
  })
}

export async function updateInventoryItem(id: number, data: {
  itemName?: string
  stockLevel?: number
  unit?: string
  category?: string
}) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const item = await tx.inventory.update({
      where: { id },
      data
    })
    revalidatePath('/dashboard/feed')
    return { success: true, item: { ...item, stockLevel: Number(item.stockLevel) } }
  }).catch((error: any) => {
    console.error('Error updating inventory item:', error)
    return { success: false, error: 'Failed to update item' }
  })
}

export async function deleteInventoryItem(id: number) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    await tx.inventory.delete({
      where: { id }
    })
    revalidatePath('/dashboard/feed')
    return { success: true }
  }).catch((error: any) => {
    console.error('Error deleting inventory item:', error)
    return { success: false, error: 'Failed to delete item' }
  })
}
