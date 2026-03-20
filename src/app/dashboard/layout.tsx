import React from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';
import { SidebarWrapper } from '@/components/layout/SidebarWrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!dbUser) {
    redirect('/login');
  }

  const farm = await prisma.farm.findFirst({
    where: { 
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } }
      ]
    }
  });

  if (!farm && dbUser.role === 'OWNER') {
    redirect('/onboarding');
  }

  if (!farm && dbUser.role !== 'OWNER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/20 backdrop-blur-xl text-white p-8">
        <div className="glass-morphism p-12 rounded-3xl text-center max-w-md">
           <h2 className="text-2xl font-black mb-4 uppercase tracking-widest text-emerald-400">Access Restricted</h2>
           <p className="opacity-70 leading-relaxed font-medium">You are not currently linked to any farm. Please contact your administrator to receive an invitation.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarWrapper role={dbUser.role}>
      {children}
    </SidebarWrapper>
  );
}
