
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { realtimeService } from '@/services/realtimeService';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';

/**
 * Global alert handler component that should be included in the app layout
 * Ensures alerts are received on all pages
 */
export const AlertHandler: React.FC = () => {
  const { user } = useAuth();
  
  // Initialize notification services when component mounts
  useEffect(() => {
    // Initialize realtime alert listeners
    realtimeService.initializeAlertListeners();
    
    // Set up notification role if user is available
    if (user) {
      const notificationRole = user.role === 'admin' ? 'admin' : 
                              (user.council === 'PRESS' ? 'press' : 'chair');
                              
      // Set role in notification service
      notificationService.setUserRole(notificationRole);
      
      // Also communicate with service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_USER_ROLE',
          role: notificationRole
        });
        
        console.log('Set user role in service worker:', notificationRole);
      } else {
        console.warn('No service worker controller available to set user role');
      }
    }
    
    // Check notifications status
    const checkNotifications = async () => {
      // If notifications are supported but permission not granted, show subtle reminder
      if (notificationService.isNotificationSupported() && 
          !notificationService.hasPermission()) {
        toast.info(
          "Enable notifications for alerts", 
          { 
            description: "You'll miss important updates without notifications",
            duration: 5000,
            action: {
              label: "Enable",
              onClick: () => notificationService.requestPermission()
            }
          }
        );
      }
    };
    
    // Check after a delay to not interfere with initial rendering
    const timer = setTimeout(checkNotifications, 5000);
    
    // Register diagnostic listener
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'DIAGNOSTIC_REQUEST') {
        console.log('Diagnostic data:', {
          notificationsSupported: notificationService.isNotificationSupported(),
          notificationsPermission: Notification.permission,
          serviceWorkerActive: !!navigator.serviceWorker.controller,
          fcmSupported: notificationService.isFcmSupported(),
          fcmToken: localStorage.getItem('fcmToken') ? 'Available' : 'Not available',
          userRole: user?.role || 'Not logged in',
          council: user?.council || 'N/A'
        });
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [user]);
  
  // This is a background component - it doesn't render anything
  return null;
};
