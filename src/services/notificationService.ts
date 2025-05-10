
/**
 * Service for handling browser notifications and Firebase Cloud Messaging
 * Provides cross-platform support for all devices and browsers
 */

import { initializeApp, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from '@/config/firebaseConfig';
import { toast } from 'sonner';
import { 
  isAndroid, 
  isChrome, 
  isIOS,
  isSafari,
  isMacOS,
  isPwa,
  isIOS164PlusWithWebPush,
  isServiceWorkerSupported,
  isNotificationSupported as checkNotificationSupport,
  isWebPushSupported,
  createNotification,
  playNotificationSound,
  initializeNotificationPolling
} from '@/utils/crossPlatformNotifications';

import {
  storeNotificationForLater,
  initializeSafariNotificationWorkaround,
  hasSafariLimitations
} from '@/utils/safariNotifications';

// The public VAPID key for web push
const VAPID_KEY = 'BLW7VJrM3F8oL2IFysoC7monAgQ_dTWeaZZU3y3Hp0SgGK0C_jPBqknMcMs4v6v6NxJAaa0mqJDoNEn3Ce1Y0F8';

// User role for notifications (will be set from auth context)
let currentUserRole: 'admin' | 'chair' | 'press' | null = null;

// Store last notification to prevent duplicates
let lastNotificationId: string | null = null;
let lastNotificationTimestamp = 0;

// Cleanup functions for polling and visibility listeners
let cleanupPolling: (() => void) | null = null;
let cleanupSafariWorkaround: (() => void) | null = null;

// Initialize Firebase app if not already initialized
let firebaseApp;
try {
  firebaseApp = getApp();
} catch (e) {
  firebaseApp = initializeApp(firebaseConfig);
}

// Initialize Firebase Messaging
let messaging: any = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && isWebPushSupported()) {
    messaging = getMessaging(firebaseApp);
    console.log('Firebase messaging initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Firebase messaging:', error);
}

// Store FCM token in localStorage
const saveFcmToken = (token: string) => {
  localStorage.setItem('fcmToken', token);
  console.log('FCM token saved to localStorage');
};

// Get stored FCM token
const getFcmToken = (): string | null => {
  return localStorage.getItem('fcmToken');
};

// Set user role for better notification routing
const setUserRole = (role: 'admin' | 'chair' | 'press') => {
  console.log('Setting user role for notifications:', role);
  currentUserRole = role;
  
  // Save role to localStorage for persistence across page loads
  localStorage.setItem('notificationUserRole', role);
  
  // Also try to inform the service worker about the role
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_USER_ROLE',
      role: role
    });
  }
};

// Check if notifications are supported in this browser
const isNotificationSupported = (): boolean => {
  return checkNotificationSupport();
};

// Check if FCM is supported in this browser
const isFcmSupported = (): boolean => {
  // Special case for iOS: FCM works in PWA mode on iOS 16.4+
  if (isIOS()) {
    return isPwa() && isIOS164PlusWithWebPush() && isServiceWorkerSupported() && messaging !== null;
  }
  
  // For Safari on macOS, FCM may work but with limitations
  if (isSafari() && isMacOS()) {
    return isWebPushSupported() && isServiceWorkerSupported() && messaging !== null;
  }
  
  // For all other browsers, check for service worker and messaging
  return isServiceWorkerSupported() && messaging !== null && isWebPushSupported();
};

// Request notification permissions and FCM token
const requestPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    console.log(`Permission request result: ${permission}`);
    
    if (granted) {
      console.log('Permission granted, checking if FCM is supported');
      
      // For browsers that support FCM, request token
      if (isFcmSupported()) {
        console.log('FCM supported, requesting token');
        await requestFcmToken();
      } else {
        console.log('FCM not supported on this browser/platform, using fallback mechanisms');
        
        // Initialize fallback mechanisms for browsers without FCM support
        if (hasSafariLimitations()) {
          if (cleanupSafariWorkaround) cleanupSafariWorkaround();
          cleanupSafariWorkaround = initializeSafariNotificationWorkaround();
          
          // For iOS Safari (browser), also set up polling
          if (isIOS() && !isPwa()) {
            if (cleanupPolling) cleanupPolling();
            cleanupPolling = initializeNotificationPolling(15000); // Check every 15 seconds
          }
        }
      }
    }
    
    return granted;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Register Safari for web push (macOS only)
const registerSafariPush = async (): Promise<boolean> => {
  if (!isSafari() || !isMacOS()) {
    console.log('This function is only for Safari on macOS');
    return false;
  }
  
  try {
    // For Safari on macOS, the service worker approach is different
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/safari-push-worker.js');
        console.log('Safari push worker registered:', registration);
        return true;
      } catch (error) {
        console.error('Error registering Safari push worker:', error);
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error registering Safari push:', error);
    return false;
  }
};

// Request Firebase Cloud Messaging token with improved error handling
const requestFcmToken = async (): Promise<string | null> => {
  if (!isFcmSupported()) {
    console.warn('Firebase Cloud Messaging not supported in this browser');
    
    // For iOS PWA on 16.4+, we might have web push but FCM might not be properly detected
    // So we'll try a special approach for this case
    if (isIOS() && isPwa() && isIOS164PlusWithWebPush()) {
      console.log('iOS 16.4+ PWA detected, attempting special FCM registration');
      try {
        // Register service worker specifically for iOS PWA
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          console.log('Service worker registered for iOS PWA');
          
          // Try initializing messaging again
          const iosPwaMessaging = getMessaging(firebaseApp);
          const swRegistration = await navigator.serviceWorker.ready;
          
          const token = await getToken(iosPwaMessaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration
          });
          
          if (token) {
            console.log('FCM token obtained for iOS PWA');
            saveFcmToken(token);
            setupFcmListener();
            return token;
          }
        }
      } catch (iosError) {
        console.error('Error in iOS PWA FCM setup:', iosError);
      }
    }
    
    // For Safari on macOS, try Safari-specific approach
    if (isSafari() && isMacOS()) {
      await registerSafariPush();
    }
    
    return null;
  }
  
  try {
    console.log('Requesting FCM token...');
    
    // First make sure service worker is registered
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        console.log('No service worker registrations found, attempting to register');
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service worker registered');
        } catch (swError) {
          console.error('Error registering service worker:', swError);
        }
      } else {
        console.log('Service worker registrations found:', registrations.length);
      }
    }
    
    // Get the service worker registration
    const swRegistration = await navigator.serviceWorker.ready;
    
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });
    
    if (currentToken) {
      console.log('FCM token obtained:', currentToken.substring(0, 10) + '...');
      saveFcmToken(currentToken);
      setupFcmListener();
      return currentToken;
    } else {
      console.warn('No FCM token available, may need permission or service worker registration');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Set up FCM foreground message listener
const setupFcmListener = () => {
  if (!isFcmSupported()) return;
  
  try {
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      if (payload.notification) {
        const title = payload.notification.title || 'New Notification';
        const options = {
          body: payload.notification.body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          requireInteraction: payload.data?.requireInteraction === 'true',
          timestamp: Date.now(),
          data: {
            ...payload.data,
            userRole: currentUserRole || localStorage.getItem('notificationUserRole') || 'chair',
            url: getNotificationUrl(payload.data?.type || 'alert'),
            type: payload.data?.type || 'alert'
          }
        };
        
        // Show foreground notification
        showNotification(title, options);
        
        // Also show toast for better UX
        toast(title, {
          description: options.body,
          duration: 5000,
        });
      }
    });
    
    console.log('FCM foreground message listener set up');
  } catch (error) {
    console.error('Error setting up FCM listener:', error);
  }
};

// Get appropriate URL based on notification type and user role
const getNotificationUrl = (type: string): string => {
  // Try to get role from localStorage if not set in memory
  if (!currentUserRole) {
    currentUserRole = localStorage.getItem('notificationUserRole') as 'admin' | 'chair' | 'press' || null;
  }
  
  // Default URL based on user role
  const baseUrl = currentUserRole === 'admin' ? '/admin-panel' : 
                 currentUserRole === 'press' ? '/press-dashboard' : 
                 '/chair-dashboard';
                 
  // For specific notification types, we might want to route differently
  switch (type) {
    case 'timer':
      return '/timer';
    case 'attendance':
      return currentUserRole === 'admin' ? '/admin-attendance' : '/chair-attendance';
    default:
      return baseUrl;
  }
};

// Check current permission status
const hasPermission = (): boolean => {
  if (!isNotificationSupported()) {
    return false;
  }
  return Notification.permission === 'granted';
};

// Show a notification using our cross-platform utility
const showNotification = (title: string, options?: any): boolean => {
  if (!isNotificationSupported() || !hasPermission()) {
    return false;
  }
  
  // Ensure data contains userRole and appropriate URL
  if (!options) options = {};
  if (!options.data) options.data = {};
  
  // Check for duplicate notifications (prevent spam)
  const now = Date.now();
  const notificationId = `${title}-${options.body}`;
  if (lastNotificationId === notificationId && (now - lastNotificationTimestamp) < 2000) {
    console.log('Preventing duplicate notification:', notificationId);
    return false;
  }
  
  // Update last notification tracking
  lastNotificationId = notificationId;
  lastNotificationTimestamp = now;
  
  // For Safari on iOS without PWA or on older iOS versions, use fallback mechanism
  if (hasSafariLimitations()) {
    // Store notification data for retrieval when app is opened
    storeNotificationForLater(
      title,
      options.body || '',
      options.data?.url || getNotificationUrl(options.data?.type || 'alert')
    );
    
    // If the app is in the foreground, show a toast notification
    if (document.visibilityState === 'visible') {
      toast(title, {
        description: options.body,
        duration: 8000, // Show longer for visibility
        action: options.data?.url ? {
          label: "View",
          onClick: () => {
            if (options.data?.url) {
              window.location.href = options.data.url;
            }
          }
        } : undefined
      });
      
      // Try to play a notification sound
      playNotificationSound();
    }
    
    return true;
  }
  
  // For all other browsers, use the standard notification API
  return createNotification(title, options);
};

// Show timer notification
const showTimerNotification = (timerName: string): boolean => {
  return showNotification(`${timerName} has ended!`, {
    body: 'Your timer has completed.',
    icon: '/logo.png',
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    data: {
      type: 'timer',
      url: '/timer'
    }
  });
};

// Show alert notification
const showAlertNotification = (
  alertType: string, 
  council: string, 
  message: string, 
  urgent: boolean = false
): boolean => {
  return showNotification(
    `${urgent ? '🚨 URGENT: ' : ''}${alertType} from ${council}`,
    {
      body: message,
      icon: '/logo.png',
      vibrate: urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
      tag: 'alert-notification',
      requireInteraction: urgent,
      timestamp: Date.now(),
      data: {
        type: 'alert',
        alertType,
        council,
        urgent
      }
    }
  );
};

// Show reply notification
const showReplyNotification = (
  fromName: string, 
  replyMessage: string, 
  alertId: string,
  userType: 'admin' | 'chair' | 'press' = 'admin'
): boolean => {
  const emoji = userType === 'admin' ? '👨‍💼' : 
                userType === 'chair' ? '🪑' : '📰';
  
  const targetRoute = userType === 'admin' ? '/admin-panel' : 
                      userType === 'press' ? '/press-dashboard' : 
                      '/chair-dashboard';
  
  return showNotification(
    `${emoji} New reply from ${fromName}`,
    {
      body: replyMessage,
      icon: '/logo.png',
      tag: `reply-${alertId}`,
      timestamp: Date.now(),
      vibrate: [100, 50, 100],
      data: {
        type: 'reply',
        alertId,
        fromName,
        url: targetRoute
      }
    }
  );
};

// Function to initialize Firebase messaging
const initializeMessaging = async (): Promise<boolean> => {
  // First check if we need to initialize fallback mechanisms for Safari/iOS
  if (hasSafariLimitations()) {
    console.log('Browser has Safari/iOS limitations, initializing fallbacks');
    
    // Initialize Safari notification workaround
    if (cleanupSafariWorkaround) cleanupSafariWorkaround();
    cleanupSafariWorkaround = initializeSafariNotificationWorkaround();
    
    // For iOS Safari (browser), also set up polling
    if (isIOS() && !isPwa()) {
      if (cleanupPolling) cleanupPolling();
      cleanupPolling = initializeNotificationPolling(15000); // Check every 15 seconds
    }
    
    return true;
  }
  
  // For browsers that support FCM, continue with normal initialization
  if (!isServiceWorkerSupported() || !isWebPushSupported()) {
    console.warn('Service workers or Web Push not supported in this browser, FCM will not work');
    return false;
  }
  
  try {
    console.log('Initializing Firebase messaging');
    
    // Register appropriate service worker based on platform
    if ('serviceWorker' in navigator) {
      // Use specific approach for Safari on macOS
      if (isSafari() && isMacOS()) {
        return await registerSafariPush();
      }
      
      // For all other browsers, use standard approach
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        console.log('Firebase messaging service worker not found, registering...');
        
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Firebase messaging service worker registered');
        } catch (swError) {
          console.error('Error registering service worker:', swError);
          return false;
        }
      } else {
        console.log('Service worker registrations found:', registrations.length);
      }
    }
    
    // Check if we already have a token
    const existingToken = getFcmToken();
    if (existingToken) {
      console.log('Using existing FCM token');
      setupFcmListener();
      return true;
    } else if (hasPermission()) {
      console.log('We have notification permission, requesting FCM token');
      // If we have permission but no token, request it
      const token = await requestFcmToken();
      return !!token;
    } else {
      console.log('No notification permission yet, skipping FCM token request');
      return false;
    }
  } catch (error) {
    console.error('Error initializing Firebase messaging:', error);
    return false;
  }
};

// Test if FCM is working by showing a test notification
const testFcm = async (): Promise<boolean> => {
  if (!isFcmSupported()) {
    console.warn('FCM not supported in this browser');
    
    // For iOS and Safari, test the fallback mechanism
    if (hasSafariLimitations()) {
      showNotification('Test Notification (Fallback)', {
        body: 'This is testing the fallback notification mechanism for iOS/Safari.',
        timestamp: Date.now(),
        data: {
          type: 'test',
          url: getNotificationUrl('test')
        }
      });
      
      return true; // We're using the fallback, so it's "working" as expected
    }
    
    return false;
  }
  
  // Test if we can get a token
  const token = await requestFcmToken();
  if (!token) {
    console.warn('Could not obtain FCM token');
    return false;
  }
  
  // If we got a token, show a test notification
  showNotification('FCM Test Successful', {
    body: 'Firebase Cloud Messaging is working correctly.',
    timestamp: Date.now(),
    data: {
      type: 'test',
      url: getNotificationUrl('test')
    }
  });
  
  return true;
};

// Get information about browser notification capabilities
const getNotificationCapabilities = () => {
  return {
    browserSupport: {
      isIOS: isIOS(),
      isSafari: isSafari(),
      isChrome: isChrome(),
      isAndroid: isAndroid(),
      isMacOS: isMacOS(),
      isPwa: isPwa()
    },
    notificationsSupported: isNotificationSupported(),
    webPushSupported: isWebPushSupported(),
    serviceWorkerSupported: isServiceWorkerSupported(),
    fcmSupported: isFcmSupported(),
    permission: hasPermission() ? 'granted' : Notification.permission,
    hasFallbackMechanism: hasSafariLimitations(),
    ios164WithWebPush: isIOS164PlusWithWebPush()
  };
};

// Restore user role from localStorage if available
const restoreUserRole = () => {
  const savedRole = localStorage.getItem('notificationUserRole') as 'admin' | 'chair' | 'press' | null;
  if (savedRole) {
    currentUserRole = savedRole;
    console.log('Restored user role from localStorage:', savedRole);
  }
};

// Clean up notification listeners and polling
const cleanup = () => {
  if (cleanupPolling) {
    cleanupPolling();
    cleanupPolling = null;
  }
  
  if (cleanupSafariWorkaround) {
    cleanupSafariWorkaround();
    cleanupSafariWorkaround = null;
  }
};

// Call this when the service is first loaded
restoreUserRole();

// Initialize Safari/iOS fallbacks if needed
if (typeof document !== 'undefined' && hasSafariLimitations() && hasPermission()) {
  cleanupSafariWorkaround = initializeSafariNotificationWorkaround();
  
  // For iOS Safari browser mode, also set up polling
  if (isIOS() && !isPwa()) {
    cleanupPolling = initializeNotificationPolling(15000);
  }
}

export const notificationService = {
  isNotificationSupported,
  isFcmSupported,
  requestPermission,
  hasPermission,
  showNotification,
  showTimerNotification,
  showAlertNotification,
  showReplyNotification,
  initializeMessaging,
  requestFcmToken,
  getFcmToken,
  testFcm,
  setUserRole,
  restoreUserRole,
  getNotificationCapabilities,
  cleanup,
  hasSafariLimitations
};
