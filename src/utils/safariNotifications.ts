
/**
 * Special utilities for Safari and iOS notifications
 * 
 * iOS and Safari have unique limitations with web push notifications:
 * - iOS Safari (browser): No web push notifications support
 * - iOS PWA (iOS 16.4+): Web push notification support when installed as PWA
 * - macOS Safari: Web push notification support but with limitations
 * 
 * This file contains utilities specifically for handling these special cases.
 */

import { 
  isIOS, 
  isSafari, 
  isPwa, 
  isIOS164PlusWithWebPush,
  isMacOS,
  playNotificationSound
} from './crossPlatformNotifications';
import { toast } from 'sonner';

// Store for locally triggered notifications that need to be shown when app is opened
// This is mainly for iOS Safari where web push notifications aren't supported
interface StoredNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  url?: string;
  shown: boolean;
}

// Check if the browser is supported for full notification capabilities
export const hasSafariLimitations = (): boolean => {
  // iOS Safari (not as PWA or not iOS 16.4+)
  if (isIOS() && !isPwa()) return true;
  if (isIOS() && isPwa() && !isIOS164PlusWithWebPush()) return true;
  
  // Non-limitations:
  // - iOS 16.4+ PWA: full web push support
  // - macOS Safari: supports web push but with some quirks
  // - Non-Safari browsers: follow their own rules
  
  return false;
};

// Store a notification for later display (for iOS Safari)
export const storeNotificationForLater = (
  title: string,
  body: string,
  url?: string
): string => {
  try {
    // Generate a unique ID
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create notification object
    const notification: StoredNotification = {
      id,
      title,
      body,
      timestamp: Date.now(),
      url,
      shown: false
    };
    
    // Get existing stored notifications
    const existingNotificationsStr = localStorage.getItem('stored-notifications');
    const existingNotifications: StoredNotification[] = existingNotificationsStr 
      ? JSON.parse(existingNotificationsStr) 
      : [];
    
    // Add new notification
    const updatedNotifications = [...existingNotifications, notification];
    
    // Store back in localStorage (limit to most recent 20)
    localStorage.setItem(
      'stored-notifications', 
      JSON.stringify(updatedNotifications.slice(-20))
    );
    
    return id;
  } catch (error) {
    console.error('Error storing notification:', error);
    return '';
  }
};

// Check for and display stored notifications
export const checkForStoredNotifications = (): void => {
  try {
    // Only run this function for browsers with limitations
    if (!hasSafariLimitations()) return;
    
    // Get stored notifications
    const storedNotificationsStr = localStorage.getItem('stored-notifications');
    if (!storedNotificationsStr) return;
    
    // Parse notifications
    const storedNotifications: StoredNotification[] = JSON.parse(storedNotificationsStr);
    let hasShownNotification = false;
    
    // Get unshown notifications
    const unshownNotifications = storedNotifications.filter(n => !n.shown);
    
    // Show notifications (but limit to prevent overwhelming the user)
    const notificationsToShow = unshownNotifications.slice(-3); // Show max 3 at a time
    
    notificationsToShow.forEach(notification => {
      // Mark as shown
      notification.shown = true;
      
      // Display toast notification
      toast(notification.title, {
        description: notification.body,
        duration: 8000, // Show for 8 seconds
        action: notification.url ? {
          label: "View",
          onClick: () => {
            if (notification.url) {
              window.location.href = notification.url;
            }
          }
        } : undefined
      });
      
      hasShownNotification = true;
    });
    
    // Play sound once if any notifications were shown
    if (hasShownNotification) {
      playNotificationSound();
    }
    
    // Update storage with shown status
    localStorage.setItem('stored-notifications', JSON.stringify(storedNotifications));
  } catch (error) {
    console.error('Error checking stored notifications:', error);
  }
};

// Register event listener to check for stored notifications on page visibility change
// This helps show notifications that arrived while the app was in the background
export const initializeSafariNotificationWorkaround = (): () => void => {
  // Only initialize for browsers with limitations
  if (!hasSafariLimitations()) return () => {}; // Return empty cleanup function
  
  // Function to check notifications when page becomes visible
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkForStoredNotifications();
    }
  };
  
  // Register event listener
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Check once on initialization
  checkForStoredNotifications();
  
  // Also set up polling for new notifications (less frequent)
  const intervalId = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      checkForStoredNotifications();
    }
  }, 30000); // Check every 30 seconds when visible
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(intervalId);
  };
};

// Create a visual guide for enabling notifications on Safari
export const createSafariNotificationGuide = () => {
  if (isSafari() && isMacOS()) {
    return {
      title: "Enable Safari Notifications",
      steps: [
        "Click Safari in the menu bar",
        "Select Preferences",
        "Click the Websites tab",
        "Select Notifications from the left panel",
        "Find this website in the list",
        "Select Allow from the dropdown menu"
      ],
      image: "/safari-notification-guide.png" // Would need to create this image
    };
  } else if (isIOS() && !isPwa()) {
    return {
      title: "Enable Notifications on iOS",
      steps: [
        "This site works best when added to your Home Screen",
        "Tap the share icon at the bottom of Safari",
        "Select 'Add to Home Screen'",
        "Launch the app from your home screen",
        "Allow notifications when prompted"
      ],
      image: "/ios-pwa-guide.png" // Would need to create this image
    };
  }
  
  return null; // No guide needed for other browsers
};

// Create a function to test if Safari push notifications are working properly
export const testSafariPushNotification = async (): Promise<boolean> => {
  if (!(isSafari() && isMacOS())) {
    console.log('This function is specifically for Safari on macOS');
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }
  
  try {
    // Try to create a notification in Safari
    const notification = new Notification('Safari Notification Test', {
      body: 'Testing Safari notification functionality',
      icon: `${window.location.origin}/logo.png`
    });
    
    // Add click handler
    notification.onclick = () => {
      notification.close();
      window.focus();
    };
    
    // Close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    return true;
  } catch (error) {
    console.error('Error creating Safari test notification:', error);
    return false;
  }
};
