import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Platform } from '../utils/platform';

interface SidebarItem {
  path: string;
  label: string;
  icon: string;
}

const sidebarItems: SidebarItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/parking', label: 'Parking Management', icon: '🅿️' },
  { path: '/pricing', label: 'Pricing Management', icon: '💰' },
  { path: '/customers', label: 'Customer Management', icon: '👥' },
  { path: '/reports', label: 'Reports', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  if (Platform.isNative()) {
    // Mobile uses tab navigation instead of sidebar
    return null;
  }

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-sm border-r border-secondary-200 overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};