'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Plus } from 'lucide-react';
import { getUser, removeAuthToken } from '@/lib/auth';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    router.push('/login');
  };

  if (pathname === '/login') return null;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Investment Tracker</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              href="/investments"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                pathname === '/investments'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Plus size={20} />
              <span className="font-medium">Manage Investments</span>
            </Link>

            {/* User Section */}
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
              {user && (
                <div className="flex items-center space-x-2">
                  {user.photo_url && (
                    <img
                      src={user.photo_url}
                      alt={user.first_name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.first_name || user.username || 'User'}
                  </span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

