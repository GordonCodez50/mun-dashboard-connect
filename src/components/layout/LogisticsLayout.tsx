import React from 'react';
import { Sidebar } from './Sidebar';
import { AdminMobileNav } from './AdminMobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import NotificationInitializer from '../NotificationInitializer';

interface LogisticsLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
}

/**
 * Layout component for logistics pages with mobile-first design
 * Uses bottom navigation on mobile and sidebar on desktop
 */
export const LogisticsLayout: React.FC<LogisticsLayoutProps> = ({ 
  children, 
  activeItem 
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Initialize notifications on all logistics pages */}
      <NotificationInitializer />
      
      {/* Sidebar navigation */}
      <Sidebar activeItem={activeItem} />
      
      {/* Main content with responsive design */}
      <main className="flex-1 p-4 md:p-6 transition-all duration-300" 
            style={{ marginLeft: isMobile ? '0px' : 'var(--sidebar-width, 256px)' }}>
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      
      {/* Mobile navigation */}
      {isMobile && <AdminMobileNav />}
    </div>
  );
};