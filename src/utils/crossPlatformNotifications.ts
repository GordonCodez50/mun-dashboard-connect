
/**
 * Cross-Platform Notification Utility
 * Provides consistent notification functionality across different devices and browsers
 * Optimized for production use during conferences
 */

// Detect platform/browser information with improved reliability
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
  return isIOS() || isAndroid() || 
    (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);
};

export const isChrome = (): boolean => {
  return /chrome|crios/i.test(navigator.userAgent.toLowerCase()) && 
    !/edge|edg/i.test(navigator.userAgent.toLowerCase());
};

export const isSafari = (): boolean => {
  return /safari/i.test(navigator.userAgent) && 
    !/chrome|chromium|crios/i.test(navigator.userAgent.toLowerCase());
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

// Enhanced notification options interface
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
  data?: any;
  timestamp?: number;
  silent?: boolean;
}

// Request notification permissions with optimized platform-specific handling
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
      
      if (Notification.permission === 'denied') {
        console.log('Permission previously denied on Android Chrome');
        return {
          success: false,
          status: 'denied',
          error: 'Permission previously denied. Please enable notifications manually in browser settings.'
        };
      }
      
      // Force showing the permission dialog by creating a temporary service worker
      if (Notification.permission === 'default') {
        try {
          console.log('Using service worker approach to trigger permission dialog on Android');
          
          if (isServiceWorkerSupported()) {
            const tempRegistration = await navigator.serviceWorker.register('/temp-notification-sw.js', {
              scope: '/'
            });
            console.log('Temporary service worker registered:', tempRegistration);
            
            // Wait for it to activate
            if (tempRegistration.installing) {
              await new Promise<void>((resolve) => {
                tempRegistration.installing?.addEventListener('statechange', (e) => {
                  if ((e.target as any).state === 'activated') {
                    resolve();
                  }
                });
              });
            }
          }
        } catch (swError) {
          console.warn('Error with service worker approach:', swError);
        }
      }
    }
    
    // Request permission with improved reliability
    let permission: NotificationPermission;
    
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      // Some older browsers use the callback pattern
      if (error instanceof TypeError) {
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission((result) => {
            resolve(result);
          });
        });
      } else {
        throw error;
      }
    }
    
    const granted = permission === 'granted';
    console.log(`Permission request result: ${permission}`);
    
    // If granted on mobile, ensure sound and vibration work
    if (granted && isMobile()) {
      try {
        // Create and immediately close a notification to ensure proper activation
        const testNotification = new Notification('Notifications Enabled', {
          body: 'You will now receive important updates.',
          silent: true
        });
        
        // Close it after a moment
        setTimeout(() => {
          testNotification.close();
        }, 500);
      } catch (e) {
        console.warn('Test notification error:', e);
      }
    }
    
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

// Get current permission status with reliable fallbacks
export const getNotificationPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  
  // Check if permission is available
  try {
    return Notification.permission;
  } catch (e) {
    console.warn('Error accessing Notification.permission:', e);
    return 'default'; // Safer fallback
  }
};

// Create and display a notification with robust cross-platform optimizations
export const createNotification = (
  title: string, 
  options: ExtendedNotificationOptions = {}
): boolean => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  
  try {
    // Platform-specific adjustments for maximum compatibility
    let platformOptions: ExtendedNotificationOptions = { ...options };
    
    // Ensure we always have icon and badge for better visibility
    platformOptions.icon = platformOptions.icon || '/logo.png';
    platformOptions.badge = platformOptions.badge || '/logo.png';
    
    // Add timestamp if not present
    if (!platformOptions.timestamp) {
      platformOptions.timestamp = Date.now();
    }
    
    // Add vibration for Android - important for lock screen visibility
    if (isAndroid()) {
      platformOptions.vibrate = options.vibrate || [200, 100, 200];
      // Android needs interaction to be required for lock screen
      if (platformOptions.requireInteraction !== false) {
        platformOptions.requireInteraction = true;
      }
    }
    
    // iOS Safari doesn't support vibration or requireInteraction
    if (isIOS() && isSafari()) {
      delete platformOptions.vibrate;
      delete platformOptions.requireInteraction;
    }
    
    // For mobile devices we want to ensure the notification is noticeable
    if (isMobile() && platformOptions.requireInteraction !== false) {
      platformOptions.requireInteraction = true;
    }
    
    // For desktop browsers
    if (!isMobile()) {
      // Keep notifications a bit longer on desktop
      platformOptions.requireInteraction = options.requireInteraction === true;
    }
    
    // Try to play sound (supported in Chrome)
    try {
      if (!platformOptions.silent) {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.7;
        audio.play().catch(e => console.warn('Could not play notification sound:', e));
      }
    } catch (soundError) {
      console.warn('Error playing notification sound:', soundError);
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

// Create a production-ready test notification
export const testNotification = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    return false;
  }
  
  try {
    // Try to play a sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      await audio.play().catch(e => console.warn('Could not play notification sound:', e));
    } catch (e) {
      console.warn('Sound playback error:', e);
    }
    
    return createNotification('Test Notification', {
      body: 'This is a test notification. If you see this, notifications are working correctly.',
      icon: '/logo.png',
      requireInteraction: false,
      data: {
        isTest: true,
        timestamp: Date.now()
      }
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

// Enhanced check for PWA installation status
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

// Check if Web Push API is allowed
export const isWebPushAllowed = (): boolean => {
  return isPushApiSupported() && isServiceWorkerSupported();
};

// Check if notifications can appear on lock screen
export const canShowLockScreenNotifications = (): boolean => {
  // Most accurate on Android Chrome and newer iOS versions
  return (isAndroid() || (isIOS() && isPwa())) && Notification.permission === 'granted';
};

// Production-focused enhancement: Check if we're on a real device (not emulator)
export const isRealDevice = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return !ua.includes('emulator') && !ua.includes('simulator');
};

// Check if device has a reliable internet connection
export const hasReliableConnection = (): boolean => {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn) {
      if (conn.saveData) {
        return false; // Data saving mode is on, connection might be limited
      }
      if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
        return false; // Connection too slow for reliable notifications
      }
    }
  }
  return true;
};

// Production-ready function to optimize notification settings based on device
export const getOptimalNotificationSettings = () => {
  return {
    requireInteraction: isMobile(), // Only require interaction on mobile
    renotify: isAndroid(), // Android needs this for repeated notifications
    silent: false, // Always play sound if possible
    vibrate: isAndroid() ? [200, 100, 200] : undefined, // Only vibrate on Android
    maxActions: isAndroid() ? 2 : 0, // Android supports notification actions
    tag: 'default', // Group notifications by default
    priority: 'high', // Use high priority for better visibility
  };
};
