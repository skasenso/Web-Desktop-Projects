import React from 'react';
import { getHouses } from '@/lib/actions/dashboard-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Thermometer, Droplets, Wind } from 'lucide-react';

export default async function ClimatePage() {
  const houses = await getHouses();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Climate Control</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map(house => (
          <Card key={house.id}>
            <CardHeader className="bg-green-50/50">
              <CardTitle className="flex justify-between items-center">
                <span>House {house.houseNumber}</span>
                <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">Connected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-lg flex flex-col items-center">
                  <Thermometer className="w-6 h-6 text-amber-600 mb-2" />
                  <span className="text-xs text-amber-800 font-medium">Temperature</span>
                  <span className="text-xl font-bold text-gray-800">{Number(house.currentTemperature || 0).toFixed(1)}°C</span>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg flex flex-col items-center">
                  <Droplets className="w-6 h-6 text-blue-600 mb-2" />
                  <span className="text-xs text-blue-800 font-medium">Humidity</span>
                  <span className="text-xl font-bold text-gray-800">{Number(house.currentHumidity || 0).toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Ventilation Status</span>
                  <span className="font-medium text-green-600">Optimal</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Ammonia Level</span>
                  <span className="font-medium text-gray-800">12 ppm</span>
                </div>
              </div>

              <button className="w-full mt-6 bg-green-800 text-white py-2 rounded-md text-sm hover:bg-green-700 transition-colors">
                View Detailed Logs
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
