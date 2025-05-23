
/**
 * Helper utility for handling notification permissions with better error handling
 */

import { toast } from "sonner";

// Check if the browser is running on Android
export const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

// Check if running on Chrome
export const isChrome = (): boolean => {
  return /chrome|crios/i.test(navigator.userAgent.toLowerCase());
};

// Check if notifications are supported in this browser
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Check for permission status
export const getNotificationPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Request notification permission with detailed error handling
export const requestNotificationPermission = async (): Promise<{
  success: boolean;
  status: NotificationPermission | 'unsupported' | 'error';
  error?: string;
}> => {
  try {
    if (!isNotificationSupported()) {
      console.warn('Notifications are not supported in this browser');
      return { 
        success: false, 
        status: 'unsupported', 
        error: 'Notifications are not supported in your browser.' 
      };
    }
    
    console.log('Requesting notification permission...');
    console.log('Current permission status:', Notification.permission);
    
    // Special handling for Android Chrome which may silently deny
    if (isAndroid() && isChrome()) {
      console.log('Android Chrome detected, checking current permission...');
      
      // If already denied, we need to guide the user to settings
      if (Notification.permission === 'denied') {
        console.log('Permission previously denied on Android Chrome');
        return {
          success: false,
          status: 'denied',
          error: 'Permission previously denied. Please enable notifications manually in browser settings.'
        };
      }
    }
    
    // Force showing the permission dialog by creating a temporary service worker
    // This is a workaround specifically for Android Chrome
    if (isAndroid() && isChrome() && Notification.permission === 'default') {
      try {
        console.log('Using service worker approach to trigger permission dialog on Android');
        
        // Try to register a temporary service worker to force the permission dialog
        if ('serviceWorker' in navigator) {
          const tempRegistration = await navigator.serviceWorker.register('/temp-notification-sw.js', {
            scope: '/'
          });
          console.log('Temporary service worker registered:', tempRegistration);
        }
      } catch (swError) {
        console.warn('Error with service worker approach:', swError);
        // Continue with standard approach even if this fails
      }
    }
    
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    console.log(`Permission request result: ${permission}`);
    
    return {
      success: granted,
      status: permission
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { 
      success: false, 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error requesting permission'
    };
  }
};

// Provide guidance based on platform for enabling notifications
export const getNotificationSettingsInstructions = (): string => {
  if (isAndroid() && isChrome()) {
    return "To enable notifications: tap the three dots (⋮) in Chrome → Settings → Site Settings → Notifications → find this site and allow notifications.";
  } else if (isAndroid()) {
    return "Please check your browser settings to enable notifications for this site.";
  }
  return "Please check your browser settings to enable notifications for this site.";
};

// Test notification permission by showing a test notification
export const testNotification = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    return false;
  }
  
  try {
    const notification = new Notification('Test Notification', {
      body: 'This is a test notification',
      icon: '/logo.png'
    });
    
    setTimeout(() => {
      notification.close();
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('Error creating test notification:', error);
    return false;
  }
};
