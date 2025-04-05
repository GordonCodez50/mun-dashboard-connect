
/**
 * Helper utility for handling notification permissions with better error handling
 */

import { toast } from "sonner";

// Check if the browser is running on Android
export const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
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
    
    // Special handling for Android Chrome which may silently deny
    if (isAndroid()) {
      console.log('Android device detected, checking current permission...');
      
      // If already denied, we need to guide the user to settings
      if (Notification.permission === 'denied') {
        return {
          success: false,
          status: 'denied',
          error: 'Permission previously denied. Please enable notifications manually in browser settings.'
        };
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
  if (isAndroid()) {
    return "To enable notifications: tap the three dots (⋮) in Chrome → Settings → Site Settings → Notifications → find this site and allow notifications.";
  }
  return "Please check your browser settings to enable notifications for this site.";
};
