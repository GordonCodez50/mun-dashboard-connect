import React from 'react';
import { Sidebar } from './Sidebar';
import { NotificationInitializer } from '@/components/NotificationInitializer';
import { PressMobileNav } from './PressMobileNav';

interface PressLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
}

export const PressLayout: React.FC<PressLayoutProps> = ({ 
  children, 
  activeItem 
}) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Initialize notifications on all press pages */}
      <NotificationInitializer />
      
      {/* Mobile Navigation - glass effect */}
      <PressMobileNav />
      
      {/* Sidebar navigation - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar activeItem={activeItem} />
      </div>
      
      {/* Main content with responsive design */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 xl:p-8 pt-4 lg:pt-3 sm:pt-4 md:pt-6 xl:pt-8 transition-all duration-300" 
            style={{ marginLeft: window.innerWidth >= 1024 ? 'var(--sidebar-width, 256px)' : '0' }}>
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};