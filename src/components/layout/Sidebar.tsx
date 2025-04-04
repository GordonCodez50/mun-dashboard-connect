
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import { externalNavButton } from '@/config/navigationConfig';
import { useIsMobile } from '@/hooks/use-mobile';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isPress = user?.role === 'chair' && user?.council === 'PRESS';
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Handle navigation for mobile devices
  const handleNavigation = (path: string) => {
    if (isMobile) {
      // For mobile: navigate to the path and force a slight delay
      // This ensures the navigation happens after the click event is fully processed
      setTimeout(() => {
        navigate(path);
      }, 10);
    }
  };

  const renderNavLinks = () => {
    // Admin Routes
    if (isAdmin) {
      return (
        <>
          <Link
            to="/admin-panel"
            onClick={() => handleNavigation("/admin-panel")}
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
            onClick={() => handleNavigation("/user-management")}
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
      );
    }

    // Chair Routes
    if (!isAdmin && !isPress) {
      return (
        <>
          <Link
            to="/chair-dashboard"
            onClick={() => handleNavigation("/chair-dashboard")}
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
            onClick={() => handleNavigation("/timer")}
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
      );
    }

    // Press Routes
    if (isPress) {
      return (
        <Link
          to="/press-dashboard"
          onClick={() => handleNavigation("/press-dashboard")}
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
      );
    }

    return null;
  };

  // For mobile sidebar, we need the content to show properly when the sidebar is opened
  const sidebarContent = (
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
        {renderNavLinks()}
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
  );

  // Desktop view
  if (!isMobile) {
    return (
      <aside className="hidden md:flex md:w-64 h-screen bg-white border-r border-gray-200 flex-col z-10">
        {sidebarContent}
      </aside>
    );
  }

  // Mobile version - this will be shown in SheetContent on mobile
  return (
    <aside className="w-full bg-white h-full">
      {sidebarContent}
    </aside>
  );
};
