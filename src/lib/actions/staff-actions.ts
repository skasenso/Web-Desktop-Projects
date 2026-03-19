'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { Role } from '@prisma/client'

async function getUserId() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

export async function inviteWorker(data: { email: string, role: Role }) {
  const userId = await getUserId()
  
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    // Ensure the current user is an OWNER or MANAGER
    const currentUser = await tx.user.findUnique({
      where: { id: userId }
    })

    if (currentUser.role === 'WORKER') {
      throw new Error('Only Owners or Managers can invite staff')
    }

    const farm = await tx.farm.findFirst({
      where: { userId: userId }
    })

    if (!farm) throw new Error('Farm not found')

    const existingInvite = await tx.invitation.findUnique({
      where: {
        email_farmId: {
          email: data.email,
          farmId: farm.id
        }
      }
    })

    if (existingInvite) {
      if (existingInvite.status === 'ACCEPTED') {
        throw new Error('This user is already a member of the farm')
      }
      // Update role if already pending
      const invitation = await tx.invitation.update({
        where: { id: existingInvite.id },
        data: { role: data.role }
      })
      revalidatePath('/dashboard/team')
      return { success: true, invitation }
    }

    const invitation = await tx.invitation.create({
      data: {
        email: data.email,
        farmId: farm.id,
        role: data.role,
        status: 'PENDING'
      }
    })

    revalidatePath('/dashboard/team')
    return { success: true, invitation }
  }).catch((error: any) => {
    console.error('Error inviting worker:', error)
    return { success: false, error: error.message }
  })
}

export async function acceptInvitation() {
  const session = await auth()
  if (!session?.user?.email || !session?.user?.id) return { success: false, error: 'Unauthorized' }
  
  const userEmail = session.user.email
  const userId = session.user.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find pending invitation
      const invitation = await tx.invitation.findFirst({
        where: { 
          email: userEmail,
          status: 'PENDING'
        }
      })

      if (!invitation) return null

      // Create farm membership
      const membership = await tx.farmMember.create({
        data: {
          farmId: invitation.farmId,
          userId: userId,
          role: invitation.role
        }
      })

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })

      // Update user role if it's the first time they are joining a farm as staff
      await tx.user.update({
        where: { id: userId },
        data: { role: invitation.role }
      })

      return membership
    })

    if (result) {
      revalidatePath('/dashboard')
      return { success: true, membership: result }
    }
    
    return { success: false, error: 'No pending invitation found' }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return { success: false, error: 'Failed to accept invitation' }
  }
}

export async function getFarmMembers() {
  const userId = await getUserId()
  
  return await (prisma as any).$withUser(userId, async (tx: any) => {
    const farm = await tx.farm.findFirst({
      where: { userId: userId }
    })

    if (!farm) return []

    const members = await tx.farmMember.findMany({
      where: { farmId: farm.id },
      include: {
        user: true
      }
    })

    const invitations = await tx.invitation.findMany({
      where: { 
        farmId: farm.id,
        status: 'PENDING'
      }
    })

    return { members, invitations }
  })
}
