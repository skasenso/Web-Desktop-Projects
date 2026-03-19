import React, { Suspense } from 'react';
import { getDashboardStats } from '@/lib/actions/dashboard-actions';
import { DashboardContent } from './DashboardContent';
import prisma from '@/lib/db';

const MOCK_USER_ID = 'user_placeholder';
export default async function DashboardPage() {
  try {
    const stats = await getDashboardStats();
    
    // Use $withUser for direct queries to satisfy RLS
    const housesRaw = await (prisma as any).$withUser(MOCK_USER_ID, async (tx: any) => {
      return await tx.poultryHouse.findMany();
    });
    
    // Serialize Decimal objects to numbers for Client Components
    const houses = housesRaw.map((house: any) => ({
      ...house,
      currentTemperature: house.currentTemperature ? Number(house.currentTemperature) : null,
      currentHumidity: house.currentHumidity ? Number(house.currentHumidity) : null,
    }));
    
    return (
      <DashboardContent stats={stats} houses={houses as any} />
    );
  } catch (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-xl font-bold text-red-800 mb-2">Database Connection Error</h2>
        <p className="text-red-600">
          The dashboard is currently unavailable as it cannot connect to the database. 
          Please ensure PostgreSQL is running at localhost:5432.
        </p>
      </div>
    );
  }
}
