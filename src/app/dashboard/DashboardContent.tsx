"use client";

import React from 'react';
import { HealthBadge } from '@/components/ui/HealthBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { RegisterBatchForm } from '@/components/forms/RegisterBatchForm';
import { usePoultryStats } from '@/hooks/usePoultryStats';
import { motion } from 'framer-motion';
import { Bird, Skull, Wheat, TrendingUp, Activity, Plus, Package, Eye } from 'lucide-react';
import Link from 'next/link';

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
      numericId: number;
    }>;
  };
  houses: Array<{
    id: number;
    name: string;
  }>;
}

const FloatingIcon = ({ icon: Icon, className = "" }: { icon: any, className?: string }) => (
  <motion.div
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    className={className}
  >
    <Icon className="w-full h-full text-emerald-400 opacity-20" />
  </motion.div>
);

export function DashboardContent({ stats, houses }: DashboardContentProps) {
  const { getAgeInDays } = usePoultryStats();

  const getGrowthProgress = (hatchDate: string, breed: string) => {
    const daysDiff = getAgeInDays(hatchDate);
    const target = breed === 'Broiler' ? 42 : 700;
    const percent = Math.min(100, Math.max(0, (daysDiff / target) * 100));
    return { days: daysDiff, percent, target };
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 relative">
      
      {/* Floating Decorative Icons */}
      <FloatingIcon icon={Bird} className="absolute -top-10 -left-10 w-32 h-32 pointer-events-none" />
      <FloatingIcon icon={Package} className="absolute top-1/2 -right-20 w-48 h-48 pointer-events-none opacity-5" />

      {/* Bento Grid Header */}
      <header className="flex items-end justify-between mb-2 px-2">
         <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Farm <span className="text-emerald-400 italic">Overview</span></h1>
            <p className="text-white/70 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
               <Activity className="w-3 h-3" /> Live Operations Tracking
            </p>
         </div>
         <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-[#064e3b] bg-emerald-500/20 backdrop-blur-md" />
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-[#064e3b] bg-emerald-500 font-black text-[10px] flex items-center justify-center text-white">+8</div>
         </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 items-start">
        
        {/* Total Birds Hero Card - Anchor on the left */}
        <Card interactive={true} className="md:col-span-2 lg:col-span-2 row-span-2 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <CardHeader>
            <CardTitle>Total Population</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-[500px]">
            <div className="mt-8">
               <span className="text-8xl font-black text-white tracking-tighter">{stats.totalBirds.toLocaleString()}</span>
               <div className="text-emerald-400 font-black text-2xl mt-2 italic">Healthy Birds</div>
            </div>
            <div className="flex items-center gap-3 text-emerald-400 px-4 py-2 bg-emerald-500/10 rounded-2xl w-fit mt-8 border border-emerald-500/20">
               <TrendingUp className="w-5 h-5" />
               <span className="text-xs font-black uppercase tracking-widest">+12% growth rate</span>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10">
               <Bird className="w-80 h-80" />
            </div>
          </CardContent>
        </Card>

        {/* Top Row: Mortality & Feed */}
        <Card interactive={true} className="md:col-span-2 lg:col-span-2 bg-red-500/5 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-red-400">Mortality Rate</CardTitle>
            <Skull className="w-5 h-5 text-red-400/50" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white tracking-tighter">{stats.mortalityRate}%</p>
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-3 italic">Threshold: &lt;5.0%</p>
          </CardContent>
        </Card>

        <Card interactive={true} className="md:col-span-2 lg:col-span-2 bg-amber-500/5 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-amber-400">Feed Inventory</CardTitle>
            <Wheat className="w-5 h-5 text-amber-400/50" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-white tracking-tighter">{stats.lowFeedAlertsCount} Low Stock</p>
            <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-3">Inventory Alerts</p>
          </CardContent>
        </Card>

        {/* Second Row: Active Batches & Register Batch */}
        <div className="md:col-span-2 lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-white/70 font-black uppercase text-[10px] tracking-widest italic">Active Batches</h3>
              <div className="h-px flex-1 bg-white/5 mx-4" />
           </div>
           <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
             {stats.activeBatches.map((batch) => {
               const progress = getGrowthProgress(batch.hatchDate, batch.breed);
               return (
                 <div key={batch.id} className="p-5 rounded-3xl bg-white/5 border border-white/10 group/batch relative overflow-hidden hover:bg-white/[0.08] transition-all duration-300">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-black text-[10px] uppercase tracking-tighter bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">{batch.id}</span>
                            <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest">Hatched {new Date(batch.hatchDate).toLocaleDateString()}</span>
                         </div>
                         <h4 className="text-white font-black text-lg tracking-tight">{batch.breed}</h4>
                         <div className="flex items-center gap-4 mt-2">
                            <div className="flex flex-col">
                               <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Quantity</span>
                               <span className="text-white font-bold text-sm tracking-tight">{batch.quantity.toLocaleString()} Birds</span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="flex flex-col">
                               <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">House</span>
                               <span className="text-white font-bold text-sm tracking-tight">#{batch.houseNumber}</span>
                            </div>
                         </div>
                      </div>
                       <div className="flex items-center gap-3">
                         <Link 
                           href={`/dashboard/flocks/${batch.numericId}`}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all opacity-0 group-hover/batch:opacity-100"
                           title="Indept Management"
                         >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Indept</span>
                         </Link>
                         <HealthBadge status="Healthy" />
                       </div>
                   </div>
                   <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                         <span className="text-white/70 italic">Day {progress.days} / {progress.target}</span>
                         <span className="text-emerald-400 font-black">{Math.round(progress.percent)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${progress.percent}%` }}
                           transition={{ duration: 1.5, ease: "easeOut" }}
                           className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                         />
                      </div>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        <Card className="md:col-span-2 lg:col-span-2 border-dashed border-emerald-500/20 bg-emerald-500/5 group/new">
           <CardHeader className="pb-2">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover/new:rotate-12 transition-transform duration-500">
                    <Plus className="w-5 h-5 text-emerald-400" />
                 </div>
                 <div>
                    <h3 className="text-white font-black text-base tracking-tight">Register Batch</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest italic">Add to inventory</p>
                 </div>
              </div>
           </CardHeader>
           <CardContent className="pb-6">
              <RegisterBatchForm houses={houses} />
           </CardContent>
        </Card>

      </div>
    </div>
  );
}
