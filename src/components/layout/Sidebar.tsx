
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  LogOut,
  Settings,
  Users,
  Timer,
  LayoutDashboard,
  FileText,
  AlertCircle,
  ExternalLink,
  Share
} from 'lucide-react';
import { externalNavButton } from '@/config/navigationConfig';

export const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isPress = user?.role === 'chair' && user?.council === 'PRESS';

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex md:w-64 h-screen bg-white border-r border-gray-200 flex-col z-10">
      <div className="h-full flex flex-col py-6">
        <div className="px-6 mb-8">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <img 
                src="/logo.png" 
                alt="ISBMUN Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
          <h2 className="text-xl font-bold text-primary text-center mt-3">ISBMUN Dashboard</h2>
          <p className="text-sm text-gray-500 text-center mt-1 truncate">
            {user?.role === 'admin' ? 'Admin Panel' : user?.council}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {/* Admin Routes */}
          {isAdmin && (
            <>
              <Link
                to="/admin-panel"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive("/admin-panel")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <Link
                to="/user-management"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive("/user-management")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Users size={18} />
                User Management
              </Link>
            </>
          )}

          {/* Chair Routes */}
          {!isAdmin && !isPress && (
            <>
              <Link
                to="/chair-dashboard"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive("/chair-dashboard")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <Link
                to="/timer"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive("/timer")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Timer size={18} />
                Timer
              </Link>
              <Link
                to="/file-share"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive("/file-share")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Share size={18} />
                File Share
              </Link>
              {/* External resources button - configurable */}
              <a
                href={externalNavButton.url}
                target={externalNavButton.openInNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-gray-600 hover:bg-gray-100"
              >
                <ExternalLink size={18} />
                {externalNavButton.text}
              </a>
            </>
          )}

          {/* Press Routes */}
          {isPress && (
            <Link
              to="/press-dashboard"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive("/press-dashboard")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <LayoutDashboard size={18} />
              Press Dashboard
            </Link>
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 mt-6">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
