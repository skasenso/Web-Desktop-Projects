import React from 'react';
import { getAllBatches, logProduction } from '@/lib/actions/dashboard-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default async function EggsPage() {
  const batches = await getAllBatches();
  const layerBatches = batches.filter(b => b.breedType === 'Layer');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Egg Production</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Production Log</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Select a layer batch to record production.</p>
              {layerBatches.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No active layer batches found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {layerBatches.map(batch => (
                    <div key={batch.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-green-900">FLK-{batch.id.toString().padStart(3, '0')}</span>
                        <p className="text-xs text-gray-500">{batch.house?.houseNumber} • {batch.currentCount.toLocaleString()} birds</p>
                      </div>
                      <button className="bg-green-800 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors">
                        Log Production
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Production Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Today's Total</span>
                  <span className="font-bold text-gray-800">-- eggs</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">This Week</span>
                  <span className="font-bold text-gray-800">-- eggs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Average Yield</span>
                  <span className="font-bold text-amber-600">-- %</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
