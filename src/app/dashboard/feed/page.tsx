import React from 'react';
import prisma from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Wheat, ShoppingCart, History } from 'lucide-react';

const MOCK_USER_ID = 'user_placeholder';


export default async function FeedPage() {
  const inventory = await (prisma as any).$withUser(MOCK_USER_ID, async (tx: any) => {
    return await tx.feedInventory.findMany();
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Feed & Nutrition</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wheat className="w-5 h-5 mr-2 text-amber-600" />
                Current Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inventory.map((item: any) => (
                  <div key={item.id} className={`p-4 rounded-xl border-l-4 ${
                    Number(item.stockLevel) < 500 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-800">{item.feedType}</span>
                      {Number(item.stockLevel) < 500 && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Low Stock</span>
                      )}
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-gray-900">{Number(item.stockLevel).toLocaleString()}</span>
                      <span className="ml-1 text-sm text-gray-500">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Feeding Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No feeding logs recorded in the last 24 hours.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-green-900 text-white">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <ShoppingCart className="w-10 h-10 text-amber-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">Restock Feed</h3>
                <p className="text-green-200 text-sm mb-6">Need to order more feed? Quick access to your suppliers.</p>
                <button className="w-full bg-amber-500 text-green-900 font-bold py-2 rounded-md hover:bg-amber-400 transition-colors">
                  Create Order
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
