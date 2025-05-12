
import React, { PropsWithChildren } from 'react';
import Sidebar from './Sidebar';
import NotificationInitializer from '../NotificationInitializer';

interface ChairLayoutProps {
  activeItem?: string;
  children: React.ReactNode;
}

/**
 * Layout component for chair panel pages
 * Includes the sidebar and ensures notifications are initialized
 */
const ChairLayout: React.FC<ChairLayoutProps> = ({ 
  activeItem, 
  children 
}) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Initialize notifications on all chair pages */}
      <NotificationInitializer />
      
      {/* Sidebar navigation */}
      <Sidebar activeItem={activeItem} />
      
      {/* Main content */}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
};

export default ChairLayout;
