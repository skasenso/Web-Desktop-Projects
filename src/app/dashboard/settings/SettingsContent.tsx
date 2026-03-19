'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Home, Settings as SettingsIcon, Bell, Shield, Plus, Loader2 } from 'lucide-react';
import { updateFarmInfo, createHouse } from '@/lib/actions/dashboard-actions';

interface SettingsContentProps {
  farm: any;
}

export function SettingsContent({ farm }: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState('farm');
  const [isUpdatingFarm, setIsUpdatingFarm] = useState(false);
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [showHouseModal, setShowHouseModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateFarm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingFarm(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const capacity = parseInt(formData.get('capacity') as string);

    try {
      const result = await updateFarmInfo({ name, location, capacity });
      if (result.success) {
        setMessage({ type: 'success', text: 'Farm information updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update farm info.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsUpdatingFarm(false);
    }
  };

  const handleAddHouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingHouse(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const houseNumber = formData.get('houseNumber') as string;
    const capacity = parseInt(formData.get('capacity') as string);

    try {
      const result = await createHouse({ houseNumber, capacity });
      if (result.success) {
        setMessage({ type: 'success', text: `House ${houseNumber} added successfully!` });
        setShowHouseModal(false);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add house.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsAddingHouse(false);
    }
  };

  const tabs = [
    { id: 'farm', label: 'Farm Info', icon: Home },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'App Preferences', icon: SettingsIcon },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-2 rounded-md flex items-center transition-colors ${
              activeTab === tab.id
                ? 'bg-green-50 text-green-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="md:col-span-3 space-y-6">
        {message && (
          <div className={`p-4 rounded-md text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {activeTab === 'farm' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Farm Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateFarm} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                      <input 
                        name="name"
                        type="text" 
                        defaultValue={farm?.name}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input 
                        name="location"
                        type="text" 
                        defaultValue={farm?.location || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity</label>
                    <input 
                      name="capacity"
                      type="number" 
                      defaultValue={farm?.capacity}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                    />
                  </div>
                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isUpdatingFarm}
                      className="bg-green-800 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isUpdatingFarm && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                <button 
                  onClick={() => setShowHouseModal(true)}
                  className="text-amber-600 border border-amber-600 px-4 py-2 rounded-md text-sm hover:bg-amber-50 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add New House
                </button>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab !== 'farm' && (
          <Card>
            <CardHeader>
              <CardTitle>{tabs.find(t => t.id === activeTab)?.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Settings for {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} are coming soon.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {showHouseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Poultry House</h3>
              <form onSubmit={handleAddHouse} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House Number / Name</label>
                  <input 
                    name="houseNumber"
                    type="text" 
                    placeholder="e.g. House 01"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Birds)</label>
                  <input 
                    name="capacity"
                    type="number" 
                    placeholder="e.g. 1000"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowHouseModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isAddingHouse}
                    className="bg-green-800 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isAddingHouse && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create House
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
