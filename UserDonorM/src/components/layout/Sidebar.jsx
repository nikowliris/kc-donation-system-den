import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, HeartHandshake, Megaphone, BarChart3, LogOut, Mail, User, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/image-removebg-preview.png';
import { useData } from '../../context/DataContext';

const adminNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Donors', href: '/donors', icon: Users },
  { name: 'Donations', href: '/donations', icon: HeartHandshake },
  { name: 'Projects', href: '/campaigns', icon: Megaphone },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Communications', href: '/communications', icon: Mail },
];

const userNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Donors', href: '/donors', icon: Users },
  { name: 'Donations', href: '/donations', icon: HeartHandshake },
  { name: 'Projects', href: '/campaigns', icon: Megaphone },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Communications', href: '/communications', icon: Mail },
  { name: 'My Messages', href: '/my-messages', icon: MessageSquare },
];

export function Sidebar() {
  const { user, isAuthenticated, logout } = useData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const navigation = isAdmin ? adminNavigation : userNavigation;

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-24 border-b border-gray-200 px-6">
        <img
          src={logo}
          alt="Knowledge Channel Foundation"
          className="h-20 w-auto object-contain"
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
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors border-l-2 border-l-transparent',
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-l-primary-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {isAuthenticated ? (
          <>
            {/* User info */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 mb-1">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() ?? <User className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-blue-600 rounded-md bg-blue-50 hover:bg-blue-100"
          >
            <User className="mr-3 h-5 w-5 text-blue-500" />
            Login / Sign Up
          </button>
        )}
      </div>
    </div>
  );
}