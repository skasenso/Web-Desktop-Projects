import { auth } from '@/auth'

export async function getAuthContext() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  
  const userId = session.user.id
  const activeFarmId = session.user.activeFarmId

  if (!activeFarmId) {
    // In some cases (like initial onboarding), there might not be an active farm yet.
    // But for most data operations, it's required.
    return { userId, activeFarmId: null }
  }

  return { userId, activeFarmId }
}
