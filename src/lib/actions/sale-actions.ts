'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function createSale(data: {
  customerName?: string
  totalAmount: number
  items: { description: string; quantity: number; unitPrice: number; totalPrice: number }[]
}) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const sale = await tx.sale.create({
      data: {
        customerName: data.customerName,
        totalAmount: data.totalAmount,
        userId: userId,
        items: {
          create: data.items
        }
      }
    })
    revalidatePath('/dashboard/sales')
    return { success: true, sale: { ...sale, totalAmount: Number(sale.totalAmount) } }
  }).catch((error: any) => {
    console.error('Error creating sale:', error)
    return { success: false, error: 'Failed to create sale' }
  })
}

export async function deleteSale(id: number) {
  const userId = await getUserId()
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    // Delete sale items first if not handled by cascade
    await tx.saleItem.deleteMany({
      where: { saleId: id }
    })
    await tx.sale.delete({
      where: { id }
    })
    revalidatePath('/dashboard/sales')
    return { success: true }
  }).catch((error: any) => {
    console.error('Error deleting sale:', error)
    return { success: false, error: 'Failed to delete sale' }
  })
}
