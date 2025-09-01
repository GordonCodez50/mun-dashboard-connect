import React, { useState } from 'react';
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
  UserCheck,
  X,
  ChevronLeft,
  Building
} from 'lucide-react';
import { externalNavButton } from '@/config/navigationConfig';

interface SidebarProps {
  activeItem?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isLogistics = user?.role === 'logistics';
  const isPress = user?.role === 'chair' && user?.council === 'PRESS';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverDisabled, setIsHoverDisabled] = useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const hoverDisableTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isActive = (path: string) => {
    // If activeItem is provided, use it to determine active state
    if (activeItem) {
      return path === activeItem;
    }
    // Otherwise fall back to location-based check
    return location.pathname === path;
  };

  const shouldShowContent = !isCollapsed || isHovered;

  const handleMouseEnter = () => {
    // Don't open if hover is disabled (recently closed)
    if (isHoverDisabled) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        // Only close if user hasn't hovered back
        setIsHovered(false);
      }, 3000); // 3 second delay
    }
  };

  const handleCloseClick = () => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Disable hover for 1 second to prevent immediate reopening
    setIsHoverDisabled(true);
    hoverDisableTimeoutRef.current = setTimeout(() => {
      setIsHoverDisabled(false);
    }, 1000);
    
    setIsCollapsed(true);
    setIsHovered(false);
  };

  // Clean up timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hoverDisableTimeoutRef.current) {
        clearTimeout(hoverDisableTimeoutRef.current);
      }
    };
  }, []);
  
  // Set CSS variable for dynamic margin
  React.useEffect(() => {
    const sidebarWidth = isCollapsed && !isHovered ? '64px' : '256px';
    // Set desktop sidebar width
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
    // Set mobile sidebar width (0 for mobile since sidebar is hidden)
    document.documentElement.style.setProperty('--sidebar-width-mobile', '0px');
  }, [isCollapsed, isHovered]);

  return (
    <aside 
      className={cn(
        "hidden md:flex h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col z-10 shadow-sm fixed top-0 left-0 transition-all duration-300",
        isCollapsed && !isHovered ? "w-16" : "w-64"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="h-full flex flex-col py-5">
        {/* Header with close button */}
        <div className={cn("px-6 mb-6", isCollapsed && !isHovered && "px-2")}>
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center", shouldShowContent ? "justify-center" : "justify-center w-full")}>
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-12 h-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300"
                title={isCollapsed ? "Expand Sidebar" : undefined}
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
                onClick={handleCloseClick}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Collapse Sidebar"
              >
                <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
          {shouldShowContent && (
            <>
              <h2 className="text-xl font-bold text-primary dark:text-white text-center mt-3">BMUNIS Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1 truncate">
                {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'logistics' ? 'Logistics Panel' : user?.council}
              </p>
            </>
          )}
        </div>

        <nav className={cn("flex-1 space-y-0.5", isCollapsed && !isHovered ? "px-1" : "px-3")}>
          {/* Admin Routes */}
          {isAdmin && (
            <>
              <Link
                to="/admin-panel"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/admin-panel")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Dashboard" : undefined}
              >
                <LayoutDashboard size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Dashboard"}
              </Link>
              <Link
                to="/user-management"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/user-management")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "User Management" : undefined}
              >
                <Users size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "User Management"}
              </Link>
              <Link
                to="/admin-attendance"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/admin-attendance")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Attendance" : undefined}
              >
                <UserCheck size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Attendance"}
              </Link>
              <Link
                to="/admin/files"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/admin/files")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "File Sharing" : undefined}
              >
                <FileText size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "File Sharing"}
              </Link>
            </>
          )}

          {/* Logistics Routes */}
          {isLogistics && (
            <>
              <Link
                to="/logistics-dashboard"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/logistics-dashboard")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Dashboard" : undefined}
              >
                <LayoutDashboard size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Dashboard"}
              </Link>
              <Link
                to="/logistics-councils"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/logistics-councils")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Councils" : undefined}
              >
                <Building size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Councils"}
              </Link>
              <Link
                to="/logistics-participants"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/logistics-participants")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Participants" : undefined}
              >
                <Users size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Participants"}
              </Link>
            </>
          )}

          {/* Chair Routes */}
          {!isAdmin && !isLogistics && !isPress && (
            <>
              <Link
                to="/chair-dashboard"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/chair-dashboard")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Dashboard" : undefined}
              >
                <LayoutDashboard size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Dashboard"}
              </Link>
              <Link
                to="/timer"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/timer")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Timer" : undefined}
              >
                <Timer size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Timer"}
              </Link>
              <Link
                to="/chair-attendance"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/chair-attendance")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Attendance" : undefined}
              >
                <UserCheck size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Attendance"}
              </Link>
              <Link
                to="/chair/files"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/chair/files")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "File Sharing" : undefined}
              >
                <FileText size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "File Sharing"}
              </Link>
              {/* External resources button - configurable */}
              <a
                href={externalNavButton.url}
                target={externalNavButton.openInNewTab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5"
                )}
                data-tour="resources-link"
                title={!shouldShowContent ? externalNavButton.text : undefined}
              >
                <ExternalLink size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && externalNavButton.text}
              </a>
            </>
          )}

          {/* Press Routes */}
          {isPress && (
            <>
              <Link
                to="/press-dashboard"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/press-dashboard")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Dashboard" : undefined}
              >
                <LayoutDashboard size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Dashboard"}
              </Link>
              <Link
                to="/press-councils"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/press-councils")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Councils" : undefined}
              >
                <Building size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Councils"}
              </Link>
              <Link
                to="/press-attendance"
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-200",
                  shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
                  isActive("/press-attendance")
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                )}
                title={!shouldShowContent ? "Attendance" : undefined}
              >
                <UserCheck size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
                {shouldShowContent && "Attendance"}
              </Link>
            </>
          )}
        </nav>

        {/* Sidebar footer with subtle separator */}
        <div className={cn("mt-4 pt-4 border-t border-gray-100 dark:border-gray-700", isCollapsed && !isHovered ? "px-1" : "px-3")}>
          {/* Settings button - added for all users */}
          <Link
            to="/settings"
            className={cn(
              "flex items-center rounded-lg text-sm transition-all duration-200 mb-1",
              shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5",
              isActive("/settings")
                ? "bg-primary/10 text-primary font-medium shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
            )}
            title={!shouldShowContent ? "Settings" : undefined}
          >
            <SettingsIcon size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
            {shouldShowContent && "Settings"}
          </Link>
          <button
            onClick={logout}
            className={cn(
              "flex items-center w-full rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200",
              shouldShowContent ? "gap-3 px-4 py-2.5" : "justify-center px-2 py-2.5"
            )}
            title={!shouldShowContent ? "Logout" : undefined}
          >
            <LogOut size={18} strokeWidth={2} className="opacity-90 flex-shrink-0" />
            {shouldShowContent && "Logout"}
          </button>
        </div>
      </div>
    </aside>
  );
};
