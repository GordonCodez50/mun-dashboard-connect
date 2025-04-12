/**
 * Cross-Platform Notification Utility
 * Provides consistent notification functionality across different devices and browsers
 * Supports: iOS, Android, macOS, Windows, Chrome, Safari, Firefox
 */

// Detect platform/browser information
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const isMacOS = (): boolean => {
  return /Mac/.test(navigator.userAgent) && !isIOS();
};

export const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

export const isWindows = (): boolean => {
  return /Windows/.test(navigator.userAgent);
};

export const isMobile = (): boolean => {
  return isIOS() || isAndroid();
};

export const isChrome = (): boolean => {
  return /chrome|crios/i.test(navigator.userAgent.toLowerCase()) && !/edge|edg/i.test(navigator.userAgent.toLowerCase());
};

export const isSafari = (): boolean => {
  return /safari/i.test(navigator.userAgent) && !/chrome|chromium|crios/i.test(navigator.userAgent.toLowerCase());
};

export const isFirefox = (): boolean => {
  return /firefox/i.test(navigator.userAgent.toLowerCase());
};

// Check if Web Push API is supported
export const isPushApiSupported = (): boolean => {
  return 'PushManager' in window;
};

// Check if notifications are supported in this browser
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Check if Service Workers are supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Normalize browser compatibility issues with notifications
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
  data?: any;
}

// Request notification permissions with platform-specific handling
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
    
    // Special handling for iOS Safari which has limited notification support
    if (isIOS() && isSafari()) {
      console.log('iOS Safari detected - limited notification support');
      // iOS Safari doesn't fully support the Notifications API until iOS 16.4+
      // We'll attempt anyway but inform the user of limitations
      if (Notification.permission === 'denied') {
        return {
          success: false,
          status: 'denied',
          error: 'Notifications are not fully supported in iOS Safari. For best experience, please use Chrome or add to home screen.'
        };
      }
    }
    
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
        if (isServiceWorkerSupported()) {
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

// Get current permission status
export const getNotificationPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Create and display a notification with platform-specific optimizations
export const createNotification = (
  title: string, 
  options: ExtendedNotificationOptions = {}
): boolean => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  
  try {
    // Platform-specific adjustments
    let platformOptions: ExtendedNotificationOptions = { ...options };
    
    // Add vibration for Android
    if (isAndroid()) {
      platformOptions.vibrate = options.vibrate || [200, 100, 200];
    }
    
    // iOS Safari doesn't support vibration or requireInteraction
    if (isIOS() && isSafari()) {
      delete platformOptions.vibrate;
      delete platformOptions.requireInteraction;
    }
    
    // Make sure we always have icon and badge for better visibility
    platformOptions.icon = platformOptions.icon || '/logo.png';
    platformOptions.badge = platformOptions.badge || '/logo.png';
    
    // For mobile devices we want to ensure the notification is noticeable
    if (isMobile()) {
      platformOptions.requireInteraction = options.requireInteraction !== false;
    }
    
    // For desktop browsers
    if (!isMobile()) {
      // Keep notifications a bit longer on desktop
      platformOptions.requireInteraction = options.requireInteraction === true;
    }
    
    // Create notification with adjusted options
    const notification = new Notification(title, platformOptions as NotificationOptions);
    
    // Add click handler
    notification.onclick = (event) => {
      event.preventDefault(); // Prevent the browser from focusing the tab
      window.focus();
      notification.close();
      
      // Handle custom click actions if provided
      if (platformOptions.data?.url) {
        window.location.href = platformOptions.data.url;
      }
      
      // Execute custom callback if provided
      if (platformOptions.data?.onClick && typeof platformOptions.data.onClick === 'function') {
        platformOptions.data.onClick();
      }
    };
    
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// Create a basic test notification
export const testNotification = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    return false;
  }
  
  try {
    return createNotification('Test Notification', {
      body: 'This is a test notification',
      icon: '/logo.png',
      requireInteraction: false
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return false;
  }
};

// Platform-specific guidance for notification settings
export const getNotificationInstructions = (): string => {
  if (isAndroid() && isChrome()) {
    return "To enable notifications: tap the three dots (⋮) in Chrome → Settings → Site Settings → Notifications → find this site and allow notifications.";
  } else if (isAndroid()) {
    return "To enable notifications: open browser settings → Site Settings → Notifications → find this site and allow notifications.";
  } else if (isIOS() && isSafari()) {
    return "For iOS Safari: go to Settings → Safari → Advanced → Website Data → find this site and manage permissions. For best experience, add this app to your home screen.";
  } else if (isIOS()) {
    return "For iOS browsers: add this website to your home screen for the best notification experience.";
  } else if (isMacOS() && isSafari()) {
    return "For Safari on Mac: click Safari → Preferences → Websites → Notifications → find this site and allow notifications.";
  } else if (isWindows() && isChrome()) {
    return "For Chrome on Windows: click the lock icon in address bar → Site Settings → Notifications → Allow.";
  }
  
  return "Please check your browser settings to enable notifications for this site.";
};

// Detect if the app is running in standalone mode (PWA)
export const isPwa = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Show PWA install instructions
export const getPwaInstructions = (): string => {
  if (isIOS() && isSafari()) {
    return "To install this app on your iOS device: tap the share button, then 'Add to Home Screen'.";
  } else if (isAndroid() && isChrome()) {
    return "To install this app on your Android device: tap the menu button, then 'Add to Home Screen'.";
  } else if (isChrome()) {
    return "To install this app: click the install icon in the address bar.";
  }
  
  return "This web app can be installed on your device for a better experience.";
};

// Check if the device has physically installed the PWA
export const checkPwaInstalled = async (): Promise<boolean> => {
  // Check if running in standalone mode
  if (isPwa()) {
    return true;
  }
  
  // BeforeInstallPrompt is only available in supporting browsers (mainly Chrome)
  if ('BeforeInstallPromptEvent' in window) {
    // If we can detect the install prompt, it means it's not installed yet
    return false;
  }
  
  // For iOS we can only detect when it's actually running in standalone mode
  // For other browsers, we have to assume it's not installed if we can't detect it
  return false;
};

export const isWebPushAllowed = (): boolean => {
  return isPushApiSupported() && isServiceWorkerSupported();
};

export const canShowLockScreenNotifications = (): boolean => {
  // Most accurate on Android Chrome and newer iOS versions
  return (isAndroid() || (isIOS() && isPwa())) && Notification.permission === 'granted';
};
