
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, AlertTriangle, Timer, FileText, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

type SidebarLink = {
  icon: React.ElementType;
  label: string;
  path: string;
  role?: 'chair' | 'admin' | 'both';
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Links shared between chair and admin
  const sharedLinks: SidebarLink[] = [
    {
      icon: FileText,
      label: 'Documents',
      path: '/documents',
      role: 'both'
    }
  ];
  
  // Chair-specific links
  const chairLinks: SidebarLink[] = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/chair-dashboard',
      role: 'chair'
    },
    {
      icon: AlertTriangle,
      label: 'Send Alert',
      path: '/send-alert',
      role: 'chair'
    },
    {
      icon: Timer,
      label: 'Timer',
      path: '/timer',
      role: 'chair'
    }
  ];
  
  // Admin-specific links
  const adminLinks: SidebarLink[] = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/admin-panel',
      role: 'admin'
    },
    {
      icon: AlertTriangle,
      label: 'Live Alerts',
      path: '/live-alerts',
      role: 'admin'
    },
    {
      icon: BarChart3,
      label: 'Council Status',
      path: '/council-status',
      role: 'admin'
    },
    {
      icon: Timer,
      label: 'Timer Control',
      path: '/timer-control',
      role: 'admin'
    }
  ];

  // Combine links based on user role
  const links = [
    ...(user?.role === 'chair' ? chairLinks : []),
    ...(user?.role === 'admin' ? adminLinks : []),
    ...sharedLinks.filter(link => link.role === 'both' || link.role === user?.role)
  ];

  return (
    <div className="h-screen w-64 bg-primary flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="text-center">
          <h2 className="text-white text-lg font-semibold mb-1">MUN Conference</h2>
          {user?.role === 'chair' && user?.council && (
            <p className="text-white/70 text-sm">{user.council}</p>
          )}
        </div>
      </div>
      
      {/* User info */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-semibold">
          {user?.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{user?.name}</p>
          <p className="text-white/60 text-sm capitalize">{user?.role}</p>
        </div>
      </div>
      
      {/* Navigation links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="px-3 space-y-1">
          {links.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) => cn(
                  "sidebar-link",
                  isActive && "active"
                )}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout button */}
      <div className="p-4 border-t border-sidebar-border">
        <button 
          onClick={logout}
          className="sidebar-link w-full justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
