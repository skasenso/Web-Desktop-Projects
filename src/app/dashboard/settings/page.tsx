import React from 'react';
import prisma from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Home, Settings as SettingsIcon, Bell, Shield } from 'lucide-react';

const MOCK_USER_ID = 'user_placeholder';


export default async function SettingsPage() {
  const farm = await (prisma as any).$withUser(MOCK_USER_ID, async (tx: any) => {
    return await tx.farm.findFirst();
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <button className="w-full text-left px-4 py-2 rounded-md bg-green-50 text-green-900 font-medium flex items-center">
            <Home className="w-4 h-4 mr-2" /> Farm Info
          </button>
          <button className="w-full text-left px-4 py-2 rounded-md text-gray-600 hover:bg-gray-50 flex items-center">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </button>
          <button className="w-full text-left px-4 py-2 rounded-md text-gray-600 hover:bg-gray-50 flex items-center">
            <Shield className="w-4 h-4 mr-2" /> Security
          </button>
          <button className="w-full text-left px-4 py-2 rounded-md text-gray-600 hover:bg-gray-50 flex items-center">
            <SettingsIcon className="w-4 h-4 mr-2" /> App Preferences
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                    <input 
                      type="text" 
                      defaultValue={farm?.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input 
                      type="text" 
                      defaultValue={farm?.location || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity</label>
                  <input 
                    type="number" 
                    defaultValue={farm?.capacity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500" 
                  />
                </div>
                <div className="pt-4">
                  <button type="button" className="bg-green-800 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>House Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Manage your poultry houses and their sensor configurations.</p>
              <button className="text-amber-600 border border-amber-600 px-4 py-2 rounded-md text-sm hover:bg-amber-50 transition-colors">
                Add New House
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
