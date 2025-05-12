import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  LogOut,
  Settings as SettingsIcon,
  Users,
  Timer,
  LayoutDashboard,
  FileText,
  AlertCircle,
  ExternalLink,
  Mail,
  UserCheck
} from 'lucide-react';
import { externalNavButton } from '@/config/navigationConfig';

interface SidebarProps {
  activeItem?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isPress = user?.role === 'chair' && user?.council === 'PRESS';

  const isActive = (path: string) => {
    // If activeItem is provided, use it to determine active state
    if (activeItem) {
      return path === activeItem;
    }
    // Otherwise fall back to location-based check
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex md:w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col z-10 shadow-sm">
      <div className="h-full flex flex-col py-5">
        <div className="px-6 mb-6">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300">
              <img 
                src="/logo.png" 
                alt="ISBMUN Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
          </div>
          <h2 className="text-xl font-bold text-primary dark:text-white text-center mt-3">ISBMUN Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 truncate">
            {user?.role === 'admin' ? 'Admin Panel' : user?.council}
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {/* Admin Routes */}
          {isAdmin && (
            <>
              <Link
                to="/admin-panel"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive("/admin-panel")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <LayoutDashboard size={18} strokeWidth={2} className="opacity-90" />
                Dashboard
              </Link>
              <Link
                to="/user-management"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive("/user-management")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <Users size={18} strokeWidth={2} className="opacity-90" />
                User Management
              </Link>
              <Link
                to="/admin-attendance"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive("/admin-attendance")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <UserCheck size={18} strokeWidth={2} className="opacity-90" />
                Attendance
              </Link>
            </>
          )}

          {/* Chair Routes */}
          {!isAdmin && !isPress && (
            <>
              <Link
                to="/chair-dashboard"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive("/chair-dashboard")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <LayoutDashboard size={18} strokeWidth={2} className="opacity-90" />
                Dashboard
              </Link>
              <Link
                to="/timer"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive("/timer")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <Timer size={18} strokeWidth={2} className="opacity-90" />
                Timer
              </Link>
              <Link
                to="/chair-attendance"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive("/chair-attendance")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <UserCheck size={18} strokeWidth={2} className="opacity-90" />
                Attendance
              </Link>
              <Link
                to="/file-share"
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive("/file-share")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
              >
                <Mail size={18} strokeWidth={2} className="opacity-90" />
                File Share
              </Link>
              {/* External resources button - configurable */}
              <a
                href={externalNavButton.url}
                target={externalNavButton.openInNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              >
                <ExternalLink size={18} strokeWidth={2} className="opacity-90" />
                {externalNavButton.text}
              </a>
            </>
          )}

          {/* Press Routes */}
          {isPress && (
            <Link
              to="/press-dashboard"
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive("/press-dashboard")
                  ? "bg-primary/10 text-primary font-medium shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              )}
            >
              <LayoutDashboard size={18} strokeWidth={2} className="opacity-90" />
              Press Dashboard
            </Link>
          )}
        </nav>

        {/* Sidebar footer with subtle separator */}
        <div className="px-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Settings button - added for all users */}
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 mb-1",
              isActive("/settings")
                ? "bg-primary/10 text-primary font-medium shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
            )}
          >
            <SettingsIcon size={18} strokeWidth={2} className="opacity-90" />
            Settings
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200"
          >
            <LogOut size={18} strokeWidth={2} className="opacity-90" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
