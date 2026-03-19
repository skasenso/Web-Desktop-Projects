import React from 'react';
import prisma from '@/lib/db'
import { auth } from '@/auth';
import { SettingsContent } from './SettingsContent';

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const farm = await prisma.farm.findFirst({
    where: { userId: session.user.id }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      <SettingsContent farm={farm} />
    </div>
  );
}
