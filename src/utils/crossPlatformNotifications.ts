
/**
 * Cross-platform notification utilities that work across different browsers and devices
 */

import { toast } from 'sonner';

// Platform detection utilities
export const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

export const isChrome = (): boolean => {
  return /chrome|crios/i.test(navigator.userAgent.toLowerCase());
};

export const isIOS = (): boolean => {
  return /ipad|iphone|ipod/i.test(navigator.userAgent.toLowerCase());
};

export const isSafari = (): boolean => {
  return /safari/i.test(navigator.userAgent.toLowerCase()) && 
         !/chrome|crios/i.test(navigator.userAgent.toLowerCase());
};

export const isPwa = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission with detailed error handling
export const requestNotificationPermission = async (): Promise<{
  success: boolean;
  status: NotificationPermission | 'unsupported' | 'error';
  error?: string;
}> => {
  try {
    if (!isNotificationSupported()) {
      return { 
        success: false, 
        status: 'unsupported', 
        error: 'Notifications are not supported in your browser.' 
      };
    }
    
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      return { success: true, status: 'granted' };
    }
    
    // Special handling for iOS which has limited notification support
    if (isIOS()) {
      console.log('iOS detected, may have limited notification support');
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    return {
      success: permission === 'granted',
      status: permission
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { 
      success: false, 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get instructions for enabling notifications based on platform
export const getNotificationInstructions = (): string => {
  if (isAndroid() && isChrome()) {
    return "To enable notifications: tap the three dots (⋮) in Chrome → Settings → Site Settings → Notifications → find this site and allow.";
  } else if (isIOS() && isSafari()) {
    return "iOS has limited notification support. For best experience, add this site to your home screen.";
  } else if (isIOS()) {
    return "iOS has limited notification support in browsers. Please add to home screen for better notifications.";
  } else if (isChrome()) {
    return "Click the lock icon in your address bar, then select 'Notifications' and change to 'Allow'.";
  } else {
    return "Please check your browser settings to enable notifications for this site.";
  }
};

// Get instructions for installing as PWA
export const getPwaInstructions = (): string => {
  if (isIOS() && isSafari()) {
    return "Tap the share icon (box with arrow) at the bottom of Safari, then 'Add to Home Screen'.";
  } else if (isAndroid() && isChrome()) {
    return "Tap the three dots (⋮) menu, then 'Add to Home screen'.";
  } else if (isChrome()) {
    return "Click the install icon in the address bar or three dots (⋮) menu → 'Install'.";
  } else {
    return "Use Chrome or Safari for the option to install this application to your home screen.";
  }
};

// Check if platform can show notifications on lock screen
export const canShowLockScreenNotifications = (): boolean => {
  // Android can show notifications on lock screen
  if (isAndroid()) return true;
  
  // iOS can show notifications on lock screen if added to home screen
  if (isIOS() && isPwa()) return true;
  
  // Most desktop browsers can show system notifications
  if (!isAndroid() && !isIOS()) return true;
  
  return false;
};

// Cross-platform notification creation
export const createNotification = (title: string, options: NotificationOptions & { 
  data?: any;
  timestamp?: number;
}): boolean => {
  try {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
      return false;
    }
    
    // Create and show notification
    const notification = new Notification(title, options);
    
    // Add click handler to notification
    notification.onclick = () => {
      // Close the notification
      notification.close();
      
      // Focus the window
      window.focus();
      
      // Navigate to specified URL if present in data
      if (options.data && options.data.url) {
        window.location.href = options.data.url;
      }
    };
    
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// Play notification sound
export const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(err => {
      console.warn('Could not play notification sound:', err);
    });
    return true;
  } catch (error) {
    console.error('Error playing sound:', error);
    return false;
  }
};

// Test notification feature
export const testNotification = async (): Promise<boolean> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    toast.error("Notification permission not granted");
    return false;
  }
  
  return createNotification('Test Notification', {
    body: 'This is a test notification. If you can see this, notifications are working!',
    icon: '/logo.png',
    badge: '/logo.png',
    timestamp: Date.now(),
    data: {
      type: 'test',
      url: window.location.origin
    }
  });
};
