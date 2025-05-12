
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';
import { realtimeService } from '@/services/realtimeService';

/**
 * Component to initialize notifications on all pages
 * This ensures that notifications will work on any page the user is on
 */
export function NotificationInitializer() {
  const { user } = useAuth();
  
  // Initialize notification service and alert listeners when component mounts
  useEffect(() => {
    // Set user role for notifications
    if (user) {
      const role = user.role === 'admin' ? 'admin' : 
                  (user.council === 'PRESS' ? 'press' : 'chair');
      notificationService.setUserRole(role);
      
      // Initialize global alert listeners if they're not already active
      if (!realtimeService.areAlertListenersActive()) {
        console.log('Initializing alert listeners on page:', window.location.pathname);
        realtimeService.initializeAlertListeners();
      }
      
      // Also inform service worker about user role (for notification routing)
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_USER_ROLE',
          role
        });
      }
    }
    
    return () => {
      // No cleanup needed, listeners persist across pages
    };
  }, [user]);
  
  // This component doesn't render anything visible
  return null;
}

export default NotificationInitializer;
