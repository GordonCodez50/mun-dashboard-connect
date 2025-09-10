import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { toast } from "sonner";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

interface LogisticsSidebarProps {
  activeItem?: string;
}

export const LogisticsSidebar: React.FC<LogisticsSidebarProps> = ({ activeItem }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Only show for logistics users
  const isLogistics = user && user.role === 'logistics';
  
  if (!isLogistics) return null;

  const sidebarItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      href: '/logistics-dashboard',
      icon: LayoutDashboard,
      description: 'Monitor alerts and logistics operations'
    },
    {
      name: 'Participants',
      href: '/logistics-participants',
      icon: Users,
      description: 'View attendance and participant data'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Configure your preferences'
    },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      style={{ 
        '--sidebar-width': isCollapsed ? '64px' : '256px',
      } as React.CSSProperties}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Logistics</h2>
                <p className="text-xs text-muted-foreground">{user?.name || 'User'}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-muted"
          >
            <ChevronLeft 
              className={`h-4 w-4 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`} 
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
                  isItemActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  isItemActive ? 'text-primary-foreground' : ''
                }`} />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      isItemActive ? 'text-primary-foreground' : ''
                    }`}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className={`text-xs ${
                        isItemActive 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer with logout */}
        <div className="p-4 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 ${
                  isCollapsed ? 'px-3' : ''
                }`}
                title={isCollapsed ? 'Logout' : undefined}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">Logout</span>}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to logout? You will need to sign in again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleLogout}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};