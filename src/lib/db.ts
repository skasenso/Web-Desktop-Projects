import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // In a real app, you'd get this from the session (e.g., Clerk/NextAuth)
          // For now, we'll try to get it from a global or context if possible, 
          // but the most reliable way for RLS is often a transaction with SET.
          // However, here we'll assume the userId is passed in args or managed externally.
          return query(args)
        },
      },
    },
    client: {
      async $withUser(userId: string, callback: (tx: any) => Promise<any>) {
        return await (this as any).$transaction(async (tx: any) => {
          await tx.$executeRawUnsafe(`SET app.current_user_id = '${userId}';`);
          return await callback(tx);
        });
      }
    }
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

