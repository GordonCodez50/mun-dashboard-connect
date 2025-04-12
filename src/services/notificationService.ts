
/**
 * Cross-platform notification service with support for all devices and browsers
 */

import { initializeApp, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from '@/config/firebaseConfig';
import { toast } from 'sonner';
import { 
  isAndroid, 
  isIOS,
  isSafari,
  isChrome,
  isNotificationSupported,
  createNotification,
  simulateNotification
} from '@/utils/crossPlatformNotifications';

// The public VAPID key for web push
const VAPID_KEY = '6QrfVAqgqA3d9rrUbrXfiT6t3XlUxFAKl4mFs5itDIQ';

// Extended notification options type to handle additional properties
interface ExtendedNotificationOptions extends NotificationOptions {
  timestamp?: number;
  vibrate?: number[];
  requireInteraction?: boolean;
}

// Initialize Firebase Messaging
let messaging: any = null;

try {
  // Try to get the existing Firebase app or initialize a new one
  const app = getApp();
  messaging = getMessaging(app);
} catch (error) {
  // App hasn't been initialized yet
  console.log('Firebase app not initialized yet for FCM');
}

// Store FCM token in localStorage with device info
const saveFcmToken = (token: string) => {
  localStorage.setItem('fcmToken', token);
  
  // Also save device info for debugging
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isAndroid: isAndroid(),
    isIOS: isIOS(),
    isChrome: isChrome(),
    isSafari: isSafari(),
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('fcmDeviceInfo', JSON.stringify(deviceInfo));
  
  console.log('FCM token saved with device info');
};

// Get stored FCM token
const getFcmToken = (): string | null => {
  return localStorage.getItem('fcmToken');
};

// Check if notifications are supported in this browser
const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Check if FCM is supported in this browser
const isFcmSupported = (): boolean => {
  return 'serviceWorker' in navigator && messaging !== null;
};

// Request notification permissions and FCM token with enhanced platform support
const requestPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported in this browser');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    console.log('Permission already granted, requesting FCM token');
    // Already have permission, try to get FCM token
    if (isFcmSupported()) {
      await requestFcmToken();
    }
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('Notification permission was denied by the user');
    return false;
  }
  
  try {
    // Log platform info for debugging
    console.log('Platform info:', {
      isAndroid: isAndroid(),
      isIOS: isIOS(),
      isChrome: isChrome(),
      isSafari: isSafari()
    });
    
    // Request permission
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    console.log(`Permission request result: ${permission}`);
    
    if (granted && isFcmSupported()) {
      console.log('Permission granted, requesting FCM token');
      await requestFcmToken();
    }
    
    return granted;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Request Firebase Cloud Messaging token with improved error handling
const requestFcmToken = async (): Promise<string | null> => {
  if (!isFcmSupported()) {
    console.warn('Firebase Cloud Messaging not supported in this browser');
    return null;
  }
  
  try {
    console.log('Requesting FCM token...');
    console.log('Current messaging instance:', messaging ? 'exists' : 'null');
    
    // Ensure messaging is initialized
    if (!messaging) {
      try {
        const app = getApp();
        messaging = getMessaging(app);
        console.log('Messaging initialized');
      } catch (error) {
        console.error('Failed to initialize messaging:', error);
        return null;
      }
    }
    
    // Special handling for iOS
    if (isIOS()) {
      // Check if app is in standalone mode (PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      if (!isStandalone) {
        console.warn('iOS requires PWA mode for reliable notifications');
        toast.info("For reliable notifications on iOS, please add this app to your home screen");
      }
    }
    
    console.log('Calling getToken with vapidKey:', VAPID_KEY.substring(0, 10) + '...');
    
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY 
    });
    
    if (currentToken) {
      console.log('FCM token obtained:', currentToken.substring(0, 10) + '...');
      saveFcmToken(currentToken);
      setupFcmListener();
      return currentToken;
    } else {
      console.warn('No FCM token available, may need permission or service worker registration');
      
      // Check if we have appropriate permission but still no token
      if (Notification.permission === 'granted') {
        console.log('Permission is granted but no token received, checking service worker');
        
        // Check service worker registration
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('Service worker registrations:', registrations.length);
          
          if (registrations.length === 0) {
            console.log('No service worker registrations found, attempting to register');
            try {
              const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
              console.log('Service worker registered with scope:', registration.scope);
              
              // Try getting token again after registration
              const retryToken = await getToken(messaging, { vapidKey: VAPID_KEY });
              if (retryToken) {
                console.log('FCM token obtained after registration:', retryToken.substring(0, 10) + '...');
                saveFcmToken(retryToken);
                setupFcmListener();
                return retryToken;
              }
            } catch (swError) {
              console.error('Error registering service worker:', swError);
            }
          } else {
            // Service worker exists, but token retrieval failed
            // Try to message the service worker to see if it's functioning
            const registration = registrations[0];
            try {
              if (registration.active) {
                registration.active.postMessage({
                  type: 'PING',
                  time: Date.now()
                });
                console.log('Ping sent to service worker');
              }
            } catch (msgError) {
              console.error('Error sending message to service worker:', msgError);
            }
          }
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Set up FCM foreground message listener with enhanced handling
const setupFcmListener = () => {
  if (!isFcmSupported()) return;
  
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    if (payload.notification) {
      const title = payload.notification.title || 'New Notification';
      const options: ExtendedNotificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        requireInteraction: payload.data?.requireInteraction === 'true',
        timestamp: Date.now(),
        tag: payload.data?.tag || 'default',
        data: { ...payload.data, url: payload.data?.url || '/' }
      };
      
      // Try to show notification through service worker for better mobile support
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options)
            .catch(error => {
              console.error('Error showing notification via service worker:', error);
              
              // Fall back to standard notification
              showNotification(title, options);
              
              // Always show toast for better visibility on mobile
              toast(title, {
                description: options.body,
                duration: 5000,
              });
            });
        }).catch(err => {
          console.error('Service worker not ready:', err);
          
          // Fall back to standard notification
          showNotification(title, options);
          
          // Show toast as additional fallback
          toast(title, {
            description: options.body,
            duration: 5000,
          });
        });
      } else {
        // No service worker, use standard notification
        showNotification(title, options);
        
        // Also show toast
        toast(title, {
          description: options.body,
          duration: 5000,
        });
      }
    }
  });
  
  // Set up message listener for service worker communication
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Message from service worker:', event.data);
      
      if (event.data.type === 'NOTIFICATION_CLICK') {
        // Handle notification click event
        console.log('Notification clicked:', event.data);
        
        // Dispatch custom event for app to handle
        window.dispatchEvent(new CustomEvent('notificationclick', { 
          detail: event.data 
        }));
      } else if (event.data.type === 'NOTIFICATION_ACTION') {
        // Handle notification action event
        console.log('Notification action:', event.data);
        
        // Dispatch custom event for app to handle
        window.dispatchEvent(new CustomEvent('notificationaction', { 
          detail: event.data 
        }));
      }
    });
  }
};

// Check current permission status
const hasPermission = (): boolean => {
  if (!isNotificationSupported()) {
    return false;
  }
  return Notification.permission === 'granted';
};

// Show a notification with enhanced cross-platform support
const showNotification = (title: string, options?: ExtendedNotificationOptions): boolean => {
  return createNotification(title, options, (title, body) => {
    // Fallback to toast when notification fails
    toast(title, {
      description: body,
      duration: 5000
    });
  });
};

// Show timer notification
const showTimerNotification = (timerName: string): boolean => {
  const options: ExtendedNotificationOptions = {
    body: 'Your timer has completed.',
    icon: '/logo.png',
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    requireInteraction: false,
    tag: 'timer-notification',
    data: { type: 'timer', timerName }
  };
  
  // Enhanced handling for mobile platforms
  if (isAndroid()) {
    options.vibrate = [100, 50, 100, 50, 100];
    options.requireInteraction = true;
  }
  
  if (isIOS()) {
    // iOS has limitations with service workers, try both methods
    simulateNotification(`${timerName} has ended!`, options.body || '', options.icon);
  }
  
  return showNotification(`${timerName} has ended!`, options);
};

// Show alert notification with enhanced cross-platform support
const showAlertNotification = (alertType: string, council: string, message: string, urgent: boolean = false): boolean => {
  const options: ExtendedNotificationOptions = {
    body: message,
    icon: '/logo.png',
    vibrate: urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
    tag: 'alert-notification', // Group similar notifications
    requireInteraction: urgent, // Urgent alerts stay until clicked
    timestamp: Date.now(),
    data: { type: 'alert', alertType, council, urgent }
  };
  
  // Enhanced handling for mobile platforms
  if (isAndroid()) {
    options.vibrate = urgent ? [300, 100, 300, 100, 300] : [100, 50, 100];
    // Android can show actions
    (options as any).actions = [
      { action: 'view', title: 'View Details' }
    ];
  }
  
  if (isIOS()) {
    // iOS has limitations, also use in-app notification
    if (urgent) {
      simulateNotification(
        `🚨 URGENT: ${alertType} from ${council}`, 
        message, 
        options.icon
      );
    }
  }
  
  return showNotification(
    `${urgent ? '🚨 URGENT: ' : ''}${alertType} from ${council}`,
    options
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
  
  const options: ExtendedNotificationOptions = {
    body: replyMessage,
    icon: '/logo.png',
    tag: `reply-${alertId}`,
    timestamp: Date.now(),
    vibrate: [100, 50, 100],
    requireInteraction: false,
    data: { type: 'reply', alertId, fromName, userType }
  };
  
  // Enhanced handling for mobile platforms
  if (isAndroid()) {
    options.vibrate = [100, 30, 100, 30, 100];
    // Android can show actions
    (options as any).actions = [
      { action: 'reply', title: 'Reply' },
      { action: 'view', title: 'View' }
    ];
  }
  
  if (isIOS()) {
    // For iOS, also show in-app notification since notification 
    // support is limited on iOS unless in PWA mode
    simulateNotification(
      `${emoji} New reply from ${fromName}`, 
      replyMessage, 
      options.icon
    );
  }
  
  return showNotification(
    `${emoji} New reply from ${fromName}`,
    options
  );
};

// Function to initialize Firebase messaging with more detailed logging
const initializeMessaging = async () => {
  if (!messaging && 'serviceWorker' in navigator) {
    try {
      console.log('Initializing Firebase messaging');
      const app = getApp();
      messaging = getMessaging(app);
      
      console.log('Checking for existing FCM token');
      // Check if we already have a token
      const existingToken = getFcmToken();
      if (existingToken) {
        console.log('Using existing FCM token');
        setupFcmListener();
      } else if (hasPermission()) {
        console.log('We have notification permission, requesting FCM token');
        // If we have permission but no token, request it
        await requestFcmToken();
      } else {
        console.log('No notification permission yet, skipping FCM token request');
      }
    } catch (error) {
      console.error('Error initializing Firebase messaging:', error);
    }
  } else {
    console.log('Messaging already initialized or service workers not supported');
  }
};

// Test if FCM is working by showing a test notification
const testFcm = async (): Promise<boolean> => {
  if (!isFcmSupported()) {
    console.warn('FCM not supported in this browser');
    return false;
  }
  
  // Test if we can get a token
  const token = await requestFcmToken();
  if (!token) {
    console.warn('Could not obtain FCM token');
    
    // Fall back to basic notification test
    if (hasPermission()) {
      showNotification('Basic Notification Test', {
        body: 'Testing basic notification functionality',
        icon: '/logo.png'
      });
      return true; // At least basic notifications work
    }
    
    return false;
  }
  
  // If we got a token, show a test notification
  showNotification('FCM Test Successful', {
    body: 'Firebase Cloud Messaging is working correctly.',
    timestamp: Date.now(),
    requireInteraction: false,
    vibrate: [100, 50, 100]
  });
  
  return true;
};

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
  testFcm
};
