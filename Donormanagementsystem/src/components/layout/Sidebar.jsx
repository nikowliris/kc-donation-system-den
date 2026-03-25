import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  Megaphone,
  BarChart3,
  LogOut,
  Mail,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import logoCollapsed from '../../assets/1.png';
import logoExpanded from '../../assets/2.png';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Donors', href: '/donors', icon: Users },
  { name: 'Projects', href: '/campaigns', icon: Megaphone },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Communications', href: '/communications', icon: Mail },
];

export function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-200',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          'flex items-center border-b border-gray-200 transition-all duration-200',
          collapsed ? 'h-16 justify-center px-2' : 'h-24 px-6'
        )}
      >
        <img
          src={collapsed ? logoCollapsed : logoExpanded}
          alt="Knowledge Channel Foundation"
          className={cn(
            'object-contain transition-all duration-200',
            collapsed ? 'h-10 w-10' : 'h-20 w-auto'
          )}
        />
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md border-l-2 transition-colors',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-transparent'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-4 w-4',
                      !collapsed && 'mr-2',
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                    )}
                    aria-hidden="true"
                  />
                  {!collapsed && <span>{item.name}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sign out */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className={cn('h-5 w-5 text-gray-400', !collapsed && 'mr-3')} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}