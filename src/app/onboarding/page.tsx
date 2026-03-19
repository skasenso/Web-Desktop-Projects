'use client';

import React, { useState } from 'react';
import { onboardFarmer } from '@/lib/actions/dashboard-actions';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Layout, MapPin, BarChart3, ArrowRight, Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const capacity = parseInt(formData.get('capacity') as string);

    try {
      const result = await onboardFarmer({ name, location, capacity });
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Failed to onboard. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-green-900">Welcome to Poultry PMS</h1>
          <p className="mt-2 text-sm text-gray-600">
            Let's get your farm set up to start tracking your operations.
          </p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Farm Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Layout className="w-4 h-4 mr-2 text-green-700" />
                    Farm Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Green Valley Farm"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-green-700" />
                    Location
                  </label>
                  <input
                    name="location"
                    type="text"
                    required
                    placeholder="e.g. Kumasi, Ghana"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-green-700" />
                    Total Capacity (Birds)
                  </label>
                  <input
                    name="capacity"
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-gray-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-green-800 hover:bg-green-700 text-white rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Start Managing Farm</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
