import React, { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';
import NotificationInitializer from '../NotificationInitializer';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  activeItem?: string;
  children: React.ReactNode;
}

/**
 * Layout component for admin panel pages
 * Includes the sidebar and ensures notifications are initialized
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  activeItem, 
  children 
}) => {
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Initialize notifications on all admin pages */}
      <NotificationInitializer />
      
      {/* Sidebar navigation - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar activeItem={activeItem} />
      </div>
      
      {/* Main content with proper sidebar margin */}
      <main className="flex-1 transition-all duration-300"
            style={{ marginLeft: !isMobile ? 'var(--sidebar-width, 256px)' : '0' }}>
        <div className="md:hidden">
          <Sidebar activeItem={activeItem} />
        </div>
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;