import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ClimateWidget } from '@/components/ui/ClimateWidget';
import { mockClimateLogs } from '@/lib/mock-data';
import { auth } from '@/auth';
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Check if the user has a farm. If not, they must onboard.
  // We use the Prisma client directly here for a quick check.
  const farm = await prisma.farm.findFirst({
    where: { userId: session.user.id }
  });

  if (!farm) {
    redirect('/onboarding');
  }

  const userName = session.user.name || 'Farmer';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-semibold text-gray-800">Poultry Farm Management</h1>
            <div className="hidden md:block">
              <ClimateWidget currentClimate={mockClimateLogs[0]} />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 font-medium">{userName}</span>
            <div className="w-8 h-8 rounded-full bg-green-800 flex justify-center items-center text-white font-bold text-sm">
              {initial}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
