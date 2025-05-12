
import { useEffect } from 'react';
import { realtimeService } from '@/services/realtimeService';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';

interface ChairPagesWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for chair pages to ensure notifications work across all pages
 */
const ChairPagesWrapper = ({ children }: ChairPagesWrapperProps) => {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize notification listeners on mount
    const cleanup = realtimeService.initializeAlertListeners();
    
    // Set user role for proper notification routing
    if (user) {
      const role = user.council === 'PRESS' ? 'press' : 'chair';
      notificationService.setUserRole(role);
    }
    
    return () => {
      // Cleanup function will be returned by initializeAlertListeners if needed
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [user]);

  return <>{children}</>;
};

export default ChairPagesWrapper;
