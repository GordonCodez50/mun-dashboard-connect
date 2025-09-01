
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';
import { realtimeService } from '@/services/firebaseService';
import PWAPrompt from './PWAPrompt';
import { isIOS, isSafari, isPwa } from '@/utils/crossPlatformNotifications';

/**
 * Component to initialize notifications on all pages
 * This ensures that notifications will work on any page the user is on
 */
export function NotificationInitializer() {
  const { user } = useAuth();
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  
  // Initialize notification service and alert listeners when component mounts
  useEffect(() => {
    // Set user role for notifications
    if (user) {
      try {
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
      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Silently fail - don't break the app
      }
    }
    
    return () => {
      // No cleanup needed, listeners persist across pages
    };
  }, [user]);

  // Check if we should show PWA prompt for iOS users
  useEffect(() => {
    const checkPWAPrompt = () => {
      try {
        // Only show for iOS Safari users who haven't installed as PWA
        if (isIOS() && isSafari() && !isPwa()) {
          // Check if user has permission but no lock screen notifications
          if (Notification.permission === 'granted') {
            // Show PWA prompt specifically for notifications
            setTimeout(() => setShowPWAPrompt(true), 3000); // Delay to not overwhelm
          } else if (Notification.permission === 'default') {
            // Show general PWA prompt for better experience
            setTimeout(() => setShowPWAPrompt(true), 5000); // Longer delay for general prompt
          }
        }
      } catch (error) {
        console.error('Error checking PWA prompt conditions:', error);
        // Don't show prompt if there's an error
      }
    };

    if (user) {
      checkPWAPrompt();
    }
  }, [user]);
  
  // This component renders PWA prompt when needed, otherwise nothing
  return (
    <>
      {showPWAPrompt && (
        <PWAPrompt 
          onClose={() => setShowPWAPrompt(false)}
          showForNotifications={Notification.permission === 'granted'}
        />
      )}
    </>
  );
}

export default NotificationInitializer;
