
/**
 * Cross-platform notification utilities that work across different browsers and devices
 */

import { toast } from 'sonner';

// Platform detection utilities
export const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

export const isChrome = (): boolean => {
  // More precise Chrome detection including Edge which is now Chromium-based
  return /chrome|chromium|crios|edg/i.test(navigator.userAgent.toLowerCase()) &&
         !/firefox|fxios|safari/i.test(navigator.userAgent.toLowerCase());
};

export const isEdge = (): boolean => {
  return /edg/i.test(navigator.userAgent.toLowerCase());
};

export const isIOS = (): boolean => {
  return /ipad|iphone|ipod/i.test(navigator.userAgent.toLowerCase());
};

export const isSafari = (): boolean => {
  return /safari/i.test(navigator.userAgent.toLowerCase()) && 
         !/chrome|crios|edg/i.test(navigator.userAgent.toLowerCase());
};

export const isFirefox = (): boolean => {
  return /firefox|fxios/i.test(navigator.userAgent.toLowerCase());
};

export const isPwa = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Check if web push is supported specifically for this browser
export const isWebPushSupported = (): boolean => {
  return 'PushManager' in window;
};

// New function: Check if iOS 16.4+ with web push support in PWA mode
export const isIOS164PlusWithWebPush = (): boolean => {
  if (!isIOS()) return false;
  
  // First check if running as PWA
  if (!isPwa()) return false;
  
  // Try to detect iOS version (this is imprecise but helps)
  // iOS 16.4+ includes "Version/16.4" or higher in the UA string
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/i);
  
  if (match && match[1]) {
    const majorVersion = parseInt(match[1], 10);
    const minorVersion = match[2] ? parseInt(match[2], 10) : 0;
    
    // iOS 16.4 or later
    if (majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4)) {
      return 'PushManager' in window;
    }
  }
  
  return false;
};

// Check if running on macOS
export const isMacOS = (): boolean => {
  return /macintosh|mac os x/i.test(navigator.userAgent) && !isIOS();
};

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Safari-specific notification permission request
const requestSafariPermission = async (): Promise<{
  success: boolean;
  status: NotificationPermission | 'unsupported' | 'error';
  error?: string;
}> => {
  try {
    if (isSafari() && isMacOS()) {
      console.log('Safari on macOS detected, using Safari-specific approach');
      
      // For Safari, notification permission request is simpler but we need to handle
      // the Safari-specific behavior
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Test that permissions actually work by creating a silent notification
        try {
          const testNotification = new Notification('Permission Test', {
            silent: true,
            body: 'Testing notification permissions'
          });
          
          // Close the test notification immediately
          setTimeout(() => testNotification.close(), 100);
          
          return { success: true, status: 'granted' };
        } catch (notifError) {
          console.error('Safari notification creation error:', notifError);
          return {
            success: false,
            status: 'error',
            error: 'Failed to create notification in Safari'
          };
        }
      } else {
        return { success: false, status: permission };
      }
    } else if (isIOS() && isPwa() && isIOS164PlusWithWebPush()) {
      console.log('iOS 16.4+ PWA with web push detected');
      
      const permission = await Notification.requestPermission();
      return {
        success: permission === 'granted',
        status: permission
      };
    } else if (isIOS()) {
      console.log('iOS detected but notifications are limited in browser mode');
      
      // For iOS Safari, we can't really request notification permission
      // but we'll try anyway and use our fallback mechanisms
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // On iOS browser (non-PWA), this might succeed but actual notifications won't work
        // So we'll need to rely on our fallback mechanisms
        return { 
          success: true, 
          status: 'granted',
          error: 'iOS Safari only supports web push in PWA mode on iOS 16.4+'
        };
      }
      
      return { success: false, status: permission };
    }
    
    // For all other browsers, use the standard approach
    return { success: false, status: 'unsupported' };
  } catch (error) {
    console.error('Error in Safari permission request:', error);
    return { 
      success: false, 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
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
    
    // Safari-specific handling
    if (isSafari() || (isIOS() && isPwa())) {
      return await requestSafariPermission();
    }
    
    // Special handling for Android Chrome which may silently deny
    if (isAndroid() && isChrome()) {
      console.log('Android Chrome detected, using optimized permission request flow');
      
      // For Chrome on Android, ensure service worker is registered before requesting permission
      if (isServiceWorkerSupported()) {
        try {
          // Check if we have an existing service worker registration
          const registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length === 0) {
            // Register the service worker if not already registered
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service worker registered for notification permission');
          }
        } catch (error) {
          console.warn('Service worker registration issue:', error);
          // Continue without service worker as a fallback
        }
      }
    }
    
    // Request permission
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Permission request result:', permission);
    
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
  } else if (isChrome() || isEdge()) {
    return "Click the lock icon (or similar) in your address bar, then select 'Notifications' and change to 'Allow'.";
  } else if (isSafari() && isMacOS()) {
    return "Click Safari → Preferences → Websites → Notifications → find this site and allow notifications.";
  } else if (isIOS() && isSafari() && !isPwa()) {
    return "iOS Safari requires adding this app to your home screen. Tap the share icon and select 'Add to Home Screen'.";
  } else if (isIOS() && isPwa() && !isIOS164PlusWithWebPush()) {
    return "Your iOS version may not support web push notifications. For best experience, update to iOS 16.4 or later.";
  } else if (isIOS()) {
    return "iOS has limited notification support in browsers. Please add to home screen for better notifications.";
  } else if (isFirefox()) {
    return "Click the lock icon in the address bar, then select 'Notifications' and change the permission to 'Allow'.";
  } else {
    return "Please check your browser settings to enable notifications for this site.";
  }
};

// Get instructions for installing as PWA
export const getPwaInstructions = (): string => {
  if (isIOS() && isSafari()) {
    return "Tap the share icon (box with arrow) at the bottom of Safari, then 'Add to Home Screen'.";
  } else if (isAndroid() && isChrome()) {
    return "Tap the three dots (⋮) menu, then 'Install app' or 'Add to Home screen'.";
  } else if (isChrome()) {
    return "Click the install icon in the address bar or three dots (⋮) menu → 'Install'.";
  } else if (isEdge()) {
    return "Click the three dots (...) menu → 'Apps' → 'Install this site as an app'.";
  } else if (isSafari() && isMacOS()) {
    return "Safari on macOS doesn't support installing websites as PWAs directly, but you can create a web app from the File menu.";
  } else {
    return "Use Chrome or Safari for the option to install this application to your home screen.";
  }
};

// Check if platform can show notifications on lock screen
export const canShowLockScreenNotifications = (): boolean => {
  // Android can show notifications on lock screen
  if (isAndroid()) return true;
  
  // iOS can show notifications on lock screen if added to home screen and on iOS 16.4+
  if (isIOS() && isPwa() && isIOS164PlusWithWebPush()) return true;
  
  // macOS Safari can show notifications on lock screen
  if (isSafari() && isMacOS()) return true;
  
  // Most desktop browsers can show system notifications
  if (!isAndroid() && !isIOS()) return true;
  
  return false;
};

// Creates a visual guide for installing as PWA
export const createPwaInstallationGuide = () => {
  if (isPwa()) return null; // Already installed
  
  const instructions = getPwaInstructions();
  
  // Determine the appropriate image based on platform
  let imagePath = '';
  if (isIOS() && isSafari()) {
    imagePath = '/safari-ios-pwa-guide.png';
  } else if (isChrome() || isEdge()) {
    imagePath = '/chrome-pwa-guide.png';
  }
  
  return {
    instructions,
    imagePath
  };
};

// Cross-platform notification creation with special handling for Safari
export const createNotification = (title: string, options: NotificationOptions & { 
  data?: any;
  timestamp?: number;
}): boolean => {
  try {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
      return false;
    }
    
    // Handle platform-specific adjustments
    if (isSafari() || isIOS()) {
      options = {
        ...options,
        // Safari doesn't support some options that Chrome does
        requireInteraction: false, // Not supported in Safari
      };
      
      // Safari is more strict with icon paths
      if (!options.icon || options.icon === '/logo.png') {
        const baseUrl = window.location.origin;
        options.icon = `${baseUrl}/logo.png`;
      }
      
      // Remove badge for Safari as it often doesn't work well
      options.badge = undefined;
      
      // Safari doesn't support data property, so we need to store this info
      // for when the notification is clicked
      if (options.data) {
        // Store notification data in localStorage for Safari
        const notificationData = {
          id: `notification-${Date.now()}`,
          title,
          options,
          timestamp: Date.now()
        };
        
        try {
          // Store in localStorage for retrieval on click
          localStorage.setItem(
            `notification-data-${notificationData.id}`, 
            JSON.stringify(notificationData)
          );
          
          // Also store the latest notification for polling mechanism
          localStorage.setItem('latest-notification', JSON.stringify(notificationData));
        } catch (storageError) {
          console.error('Error storing notification data:', storageError);
        }
      }
    } else if (isChrome() || isEdge()) {
      // Chrome-specific optimizations
      options = {
        ...options,
        // Chrome supports actions better
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      };
      
      // Ensure we have proper icon paths for Chrome (it's more strict)
      if (!options.icon || options.icon === '/logo.png') {
        const baseUrl = window.location.origin;
        options.icon = `${baseUrl}/logo.png`;
      }
      
      if (!options.badge) {
        const baseUrl = window.location.origin;
        options.badge = `${baseUrl}/logo.png`;
      }
    }
    
    // Create and show notification
    const notification = new Notification(title, options);
    
    // Add click handler to notification
    notification.onclick = (event) => {
      event.preventDefault(); // Prevent default behavior
      
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
    
    // For Safari on iOS, fall back to toast notification
    if ((isSafari() || isIOS()) && typeof toast === 'function') {
      toast(title, { 
        description: options.body,
        duration: 10000, // Show longer for visibility
      });
    }
    
    return false;
  }
};

// Play notification sound with special handling for iOS
export const playNotificationSound = () => {
  try {
    // Safari on iOS only allows audio to be played after user interaction
    // We'll log this limitation but still try to play the sound
    if (isIOS()) {
      console.log('Note: iOS Safari requires user interaction before playing sounds');
    }
    
    const audio = new Audio('/notification.mp3');
    
    // For iOS we need to play inline
    if (isIOS() || isSafari()) {
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.volume = 0.7; // Lower volume for iOS
    }
    
    // For Chrome, need to handle autoplay restrictions
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Could not play notification sound (autoplay restrictions):', err);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error playing sound:', error);
    return false;
  }
};

// Test notification feature with platform-specific testing
export const testNotification = async (): Promise<boolean> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    toast.error("Notification permission not granted");
    return false;
  }
  
  // Add timestamp to avoid notifications being grouped
  const timestamp = Date.now();
  
  let notificationTitle = 'Test Notification';
  let notificationBody = 'This is a test notification. If you can see this, notifications are working!';
  
  // Add browser-specific information to the test
  if (isSafari() && isMacOS()) {
    notificationBody += ' (Safari macOS)';
  } else if (isIOS() && isPwa() && isIOS164PlusWithWebPush()) {
    notificationBody += ' (iOS 16.4+ PWA)';
  } else if (isIOS() && isPwa()) {
    notificationBody += ' (iOS PWA)';
  } else if (isIOS()) {
    notificationBody += ' (iOS browser - limited support)';
  } else if (isChrome()) {
    notificationBody += ' (Chrome)';
  } else if (isEdge()) {
    notificationBody += ' (Edge)';
  } else if (isFirefox()) {
    notificationBody += ' (Firefox)';
  }
  
  return createNotification(notificationTitle, {
    body: notificationBody,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `test-${timestamp}`, // Prevent browsers from grouping notifications
    timestamp: timestamp,
    requireInteraction: false,
    data: {
      type: 'test',
      url: window.location.origin,
      timestamp: timestamp
    }
  });
};

// Function to implement polling for iOS Safari (fallback mechanism)
export const initializeNotificationPolling = (checkInterval = 10000) => {
  if (!isIOS() || isPwa()) return null; // Only needed for iOS Safari in browser mode
  
  let intervalId: number | null = null;
  
  const checkForNewNotifications = () => {
    try {
      const latestNotificationStr = localStorage.getItem('latest-notification');
      if (!latestNotificationStr) return;
      
      const latestNotification = JSON.parse(latestNotificationStr);
      const lastShownTimestamp = parseInt(localStorage.getItem('last-shown-notification-timestamp') || '0', 10);
      
      // If we have a new notification that hasn't been shown
      if (latestNotification.timestamp > lastShownTimestamp) {
        // Update the last shown timestamp
        localStorage.setItem('last-shown-notification-timestamp', latestNotification.timestamp);
        
        // Show a toast notification instead
        toast(latestNotification.title, {
          description: latestNotification.options.body,
          duration: 10000, // Show longer for visibility
          action: {
            label: "View",
            onClick: () => {
              if (latestNotification.options.data?.url) {
                window.location.href = latestNotification.options.data.url;
              }
            }
          }
        });
        
        // Also try to play a sound
        playNotificationSound();
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  };
  
  // Start polling
  intervalId = window.setInterval(checkForNewNotifications, checkInterval);
  
  // Also check immediately
  checkForNewNotifications();
  
  // Return a function to stop polling
  return () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
    }
  };
};
