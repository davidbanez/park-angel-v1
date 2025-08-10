import React, { useState, useRef, useEffect } from 'react';
import {
  Bars3Icon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  CogIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';
import { NotificationCenter } from './NotificationCenter';
import { DashboardServiceImpl } from '../services/dashboardService';
import { supabase } from '../../../shared/src/lib/supabase';

const dashboardService = new DashboardServiceImpl(supabase as any);

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className='bg-white shadow-sm border-b border-gray-200'>
      <div className='flex items-center justify-between h-16 px-6'>
        <div className='flex items-center'>
          <button
            onClick={onMenuClick}
            className='lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100'
          >
            <Bars3Icon className='h-6 w-6' />
          </button>

          <h1 className='ml-4 lg:ml-0 text-2xl font-semibold text-gray-900'>
            Admin Dashboard
          </h1>
        </div>

        <div className='flex items-center space-x-4'>
          {/* Notifications */}
          <NotificationCenter dashboardService={dashboardService} />

          {/* User menu */}
          <div className='relative' ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className='flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg'
            >
              <UserCircleIcon className='h-8 w-8' />
              <div className='hidden md:block text-left'>
                <div className='text-sm font-medium'>
                  {user?.name || user?.email || 'Admin User'}
                </div>
                <div className='text-xs text-gray-500 capitalize'>
                  {user?.role || 'Admin'}
                </div>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50'>
                <div className='px-4 py-3 border-b border-gray-100'>
                  <div className='text-sm font-medium text-gray-900'>
                    {user?.name || 'Admin User'}
                  </div>
                  <div className='text-sm text-gray-500'>{user?.email}</div>
                  <div className='text-xs text-gray-400 mt-1 capitalize'>
                    {user?.role} • {user?.userType}
                  </div>
                </div>

                <div className='py-1'>
                  <button className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                    <UserIcon className='h-4 w-4 mr-3' />
                    Profile Settings
                  </button>

                  <button className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                    <ShieldCheckIcon className='h-4 w-4 mr-3' />
                    Security Settings
                  </button>

                  <button className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                    <CogIcon className='h-4 w-4 mr-3' />
                    Preferences
                  </button>
                </div>

                <div className='border-t border-gray-100 py-1'>
                  <button
                    onClick={handleLogout}
                    className='flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50'
                  >
                    <ArrowRightOnRectangleIcon className='h-4 w-4 mr-3' />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
