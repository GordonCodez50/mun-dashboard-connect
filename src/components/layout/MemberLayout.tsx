import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Settings as SettingsIcon, LogOut, ChevronLeft } from 'lucide-react';
import NotificationInitializer from '../NotificationInitializer';
import MemberMobileNav from './MemberMobileNav';

interface MemberLayoutProps {
  activeItem?: string;
  children: React.ReactNode;
}

const MemberLayout: React.FC<MemberLayoutProps> = ({ activeItem, children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const isActive = (path: string) => {
    if (activeItem) {
      return path === activeItem;
    }
    return location.pathname === path;
  };

  const shouldShowContent = !isCollapsed || isHovered;
  const isHCC = user?.role === 'member-hcc';
  const isFCC = user?.role === 'member-fcc';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <NotificationInitializer />
      
      {/* Mobile Navigation */}
      <MemberMobileNav />
      
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col z-10 shadow-sm fixed top-0 left-0 transition-all duration-300",
          isCollapsed && !isHovered ? "w-16" : "w-64"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="h-full flex flex-col py-5">
          {/* Header */}
          <div className={cn("px-6 mb-6", isCollapsed && !isHovered && "px-2")}>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center", shouldShowContent ? "justify-center" : "justify-center w-full")}>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <img 
                    src="/logo.png" 
                    alt="BMUNIS Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </button>
              </div>
              {shouldShowContent && (
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
            {shouldShowContent && (
              <>
                <h2 className={cn(
                  "text-xl font-bold text-center mt-3",
                  isHCC ? "text-blue-600 dark:text-blue-400" : 
                  isFCC ? "text-green-600 dark:text-green-400" : 
                  "text-primary dark:text-white"
                )}>
                  {user?.council} Member
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 truncate">
                  {user?.username}
                </p>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-0.5", isCollapsed && !isHovered ? "px-1" : "px-3")}>
            <Link
              to="/member-dashboard"
              className={cn(
                "flex items-center rounded-lg text-sm transition-all duration-200",
                shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                isActive("/member-dashboard")
                  ? "bg-primary/10 text-primary font-medium shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              )}
            >
              <LayoutDashboard size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
              {shouldShowContent && "Dashboard"}
            </Link>
          </nav>

          {/* Footer */}
          <div className={cn("mt-4 pt-4 border-t border-gray-100 dark:border-gray-700", isCollapsed && !isHovered ? "px-1" : "px-3")}>
            <Link
              to="/settings"
              className={cn(
                "flex items-center rounded-lg text-sm transition-all duration-200 mb-1",
                shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                isActive("/settings")
                  ? "bg-primary/10 text-primary font-medium shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              )}
            >
              <SettingsIcon size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
              {shouldShowContent && "Settings"}
            </Link>
            <button
              onClick={logout}
              className={cn(
                "w-full flex items-center rounded-lg text-sm transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5"
              )}
            >
              <LogOut size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
              {shouldShowContent && "Logout"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 xl:p-8 pt-4 lg:pt-3 sm:pt-4 md:pt-6 xl:pt-8 transition-all duration-300" 
            style={{ marginLeft: window.innerWidth >= 1024 ? (isCollapsed && !isHovered ? '64px' : '256px') : '0' }}>
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MemberLayout;