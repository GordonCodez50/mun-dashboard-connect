
import React, { PropsWithChildren } from 'react';
import { Sidebar } from './Sidebar';
import NotificationInitializer from '../NotificationInitializer';
import ChairTutorialPopup from '../tutorial/ChairTutorialPopup';

interface ChairLayoutProps {
  activeItem?: string;
  children: React.ReactNode;
}

/**
 * Layout component for chair panel pages
 * Includes the sidebar and ensures notifications are initialized
 * Responsive design: mobile, tablet, laptop, desktop
 */
const ChairLayout: React.FC<ChairLayoutProps> = ({ 
  activeItem, 
  children 
}) => {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Initialize notifications on all chair pages */}
        <NotificationInitializer />
        
        {/* Tutorial popup for first-time Chair users */}
        <ChairTutorialPopup />
        
        {/* Sidebar navigation - hidden on mobile */}
        <Sidebar activeItem={activeItem} data-tour="resources-link" />
        
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

export default ChairLayout;
