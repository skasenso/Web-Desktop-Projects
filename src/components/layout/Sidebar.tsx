import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Bird, Egg, ThermometerSun, Wheat, Settings, Users } from 'lucide-react';

export const Sidebar = ({ role = 'OWNER' }: { role?: string }) => {
  const allNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', roles: ['OWNER', 'MANAGER', 'WORKER'] },
    { name: 'Flock Management', icon: Bird, href: '/dashboard/flocks', roles: ['OWNER', 'MANAGER', 'WORKER'] },
    { name: 'Egg Production', icon: Egg, href: '/dashboard/eggs', roles: ['OWNER', 'MANAGER', 'WORKER'] },
    { name: 'Climate Control', icon: ThermometerSun, href: '/dashboard/climate', roles: ['OWNER', 'MANAGER', 'WORKER'] },
    { name: 'Feed & Nutrition', icon: Wheat, href: '/dashboard/feed', roles: ['OWNER', 'MANAGER', 'WORKER'] },
    { name: 'Team Management', icon: Users, href: '/dashboard/team', roles: ['OWNER', 'MANAGER'] },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['OWNER', 'MANAGER'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <div className="w-64 bg-green-900 min-h-screen text-white flex flex-col">
      <div className="h-16 flex items-center px-6 text-xl font-bold border-b border-green-800">
        <span className="text-amber-500 mr-2">Agri</span>Tech
      </div>
      <nav className="flex-1 py-6 px-3 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center px-3 py-2.5 rounded-md hover:bg-green-800 transition-colors text-sm font-medium"
          >
            <item.icon className="w-5 h-5 mr-3 text-amber-500" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-green-800 text-xs text-green-200">
        Poultry PMS v1.0
      </div>
    </div>
  );
};
