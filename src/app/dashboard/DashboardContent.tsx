"use client";

import React from 'react';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { RegisterBatchForm } from '@/components/forms/RegisterBatchForm';
import { usePoultryStats } from '@/hooks/usePoultryStats';

interface DashboardContentProps {
  stats: {
    totalBirds: number;
    mortalityRate: string;
    lowFeedAlertsCount: number;
    activeBatches: Array<{
      id: string;
      breed: string;
      quantity: number;
      hatchDate: string;
      status: string;
      houseNumber: string;
    }>;
  };
  houses: Array<{
    id: number;
    houseNumber: string;
  }>;
}

export function DashboardContent({ stats, houses }: DashboardContentProps) {
  const { getAgeInDays } = usePoultryStats();

  const getGrowthProgress = (hatchDate: string, breed: string) => {
    const daysDiff = getAgeInDays(hatchDate);
  
    if (breed === 'Broiler') {
      const percent = Math.min(100, Math.max(0, (daysDiff / 42) * 100));
      return { days: daysDiff, percent, target: 42 };
    } else {
      const percent = Math.min(100, Math.max(0, (daysDiff / 700) * 100));
      return { days: daysDiff, percent, target: 700 };
    }
  };

  const getHealthStatus = (id: string) => {
    // Basic logic for health status based on mortality or other factors
    // This could be enhanced later with real data
    return 'Healthy';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <span className="text-gray-500 text-sm">Total Birds</span>
            <p className="text-2xl font-bold text-gray-800">{stats.totalBirds.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <span className="text-gray-500 text-sm">Mortality Rate</span>
            <p className="text-2xl font-bold text-red-600">{stats.mortalityRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <span className="text-gray-500 text-sm">Low Feed Alerts</span>
            <p className="text-2xl font-bold text-orange-600">{stats.lowFeedAlertsCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Batch Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.activeBatches.map((batch) => {
          const progress = getGrowthProgress(batch.hatchDate, batch.breed);
          const health = getHealthStatus(batch.id);

          return (
            <Card key={batch.id}>
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-green-900">{batch.id}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{batch.breed} • {batch.quantity.toLocaleString()} birds</p>
                  <p className="text-xs text-gray-400">House: {batch.houseNumber}</p>
                </div>
                <HealthBadge status={health as any} />
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Day {progress.days}</span>
                    <span className="text-gray-600">Target: {progress.target} Days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-700 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress.percent}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                  <div>
                    <span className="block text-gray-400 text-xs">Mortality Rate</span>
                    <span className="block font-semibold text-gray-700">--</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs">Est. FCR</span>
                    <span className="block font-semibold text-gray-700">--</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12">
        <div className="mr-auto inline-block">
          <RegisterBatchForm houses={houses} />
        </div>
      </div>
    </div>
  );
}
