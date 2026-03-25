import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from './auth.config';
import prisma from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true
    }),
    Credentials({
      name: 'Phone Number',
      credentials: {
        phoneNumber: { label: "Phone Number", type: "tel" }
      },
      async authorize(credentials) {
        if (!credentials?.phoneNumber) return null;
        
        const phoneNumber = credentials.phoneNumber as string;

        // 1. Look up existing user directly mapped from db
        let user = await prisma.user.findFirst({
          where: { phoneNumber }
        });

        if (user) {
          // Fetch active farm
          const membership = await prisma.farmMember.findFirst({
            where: { userId: user.id }
          });
          
          return {
            ...user,
            activeFarmId: membership?.farmId
          } as any; 
        }

        // 2. Check invitations if user not found natively
        const invitation = await prisma.invitation.findFirst({
          where: { phoneNumber, status: 'PENDING' }
        });

        if (invitation) {
           // Create the user dynamically
           user = await prisma.user.create({
             data: {
               phoneNumber,
               role: invitation.role,
             }
           });

           // Link to farm directly 
           await prisma.farmMember.create({
             data: {
               farmId: invitation.farmId,
               userId: user.id,
               role: invitation.role
             }
           });

           // Update invitation status
           await prisma.invitation.update({
             where: { id: invitation.id },
             data: { status: 'ACCEPTED' }
           });

           return {
             ...user,
             activeFarmId: invitation.farmId
           } as any;
        }

        // Failed Auth Context
        return null;
      }
    }),
  ],
});
