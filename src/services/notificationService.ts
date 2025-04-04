
/**
 * Service for handling browser notifications and Firebase Cloud Messaging
 */

import { initializeApp, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from '@/config/firebaseConfig';
import { toast } from 'sonner';
import { isAndroid, isChrome } from '@/utils/notificationPermission';

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

// Store FCM token in localStorage
const saveFcmToken = (token: string) => {
  localStorage.setItem('fcmToken', token);
  console.log('FCM token saved to localStorage');
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

// Request notification permissions and FCM token
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
    // Use special handling for Android Chrome
    if (isAndroid() && isChrome()) {
      console.log('Using specialized Android Chrome permission flow');
    }
    
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
    
    console.log('Calling getToken with vapidKey:', VAPID_KEY);
    
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY 
    });
    
    if (currentToken) {
      console.log('FCM token obtained:', currentToken);
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
                console.log('FCM token obtained after registration:', retryToken);
                saveFcmToken(retryToken);
                setupFcmListener();
                return retryToken;
              }
            } catch (swError) {
              console.error('Error registering service worker:', swError);
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

// Set up FCM foreground message listener
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
        timestamp: Date.now()
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
};

// Check current permission status
const hasPermission = (): boolean => {
  if (!isNotificationSupported()) {
    return false;
  }
  return Notification.permission === 'granted';
};

// Show a notification
const showNotification = (title: string, options?: ExtendedNotificationOptions): boolean => {
  if (!isNotificationSupported() || !hasPermission()) {
    return false;
  }
  
  try {
    // Create and display the notification
    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    } as NotificationOptions);
    
    // Add click handler to focus the window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Show timer notification
const showTimerNotification = (timerName: string): boolean => {
  return showNotification(`${timerName} has ended!`, {
    body: 'Your timer has completed.',
    icon: '/logo.png',
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  } as ExtendedNotificationOptions);
};

// Show alert notification
const showAlertNotification = (alertType: string, council: string, message: string, urgent: boolean = false): boolean => {
  return showNotification(
    `${urgent ? '🚨 URGENT: ' : ''}${alertType} from ${council}`,
    {
      body: message,
      icon: '/logo.png',
      vibrate: urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
      tag: 'alert-notification', // Group similar notifications
      requireInteraction: urgent, // Urgent alerts stay until clicked
      timestamp: Date.now(),
    } as ExtendedNotificationOptions
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
  
  return showNotification(
    `${emoji} New reply from ${fromName}`,
    {
      body: replyMessage,
      icon: '/logo.png',
      tag: `reply-${alertId}`,
      timestamp: Date.now(),
      vibrate: [100, 50, 100],
      requireInteraction: false,
    } as ExtendedNotificationOptions
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
    return false;
  }
  
  // If we got a token, show a test notification
  showNotification('FCM Test Successful', {
    body: 'Firebase Cloud Messaging is working correctly.',
    timestamp: Date.now(),
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
