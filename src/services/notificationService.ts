
/**
 * Service for handling browser notifications and Firebase Cloud Messaging
 */

import { initializeApp, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from '@/config/firebaseConfig';
import { toast } from 'sonner';

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
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    if (granted && isFcmSupported()) {
      await requestFcmToken();
    }
    
    return granted;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Request Firebase Cloud Messaging token
const requestFcmToken = async (): Promise<string | null> => {
  if (!isFcmSupported()) {
    console.warn('Firebase Cloud Messaging not supported in this browser');
    return null;
  }
  
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY 
    });
    
    if (currentToken) {
      console.log('FCM token obtained:', currentToken);
      saveFcmToken(currentToken);
      setupFcmListener();
      return currentToken;
    } else {
      console.warn('No FCM token available, requesting permission...');
      // This can happen if the user hasn't granted notification permission
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

// Function to initialize Firebase messaging
const initializeMessaging = async () => {
  if (!messaging && 'serviceWorker' in navigator) {
    try {
      const app = getApp();
      messaging = getMessaging(app);
      
      // Check if we already have a token
      const existingToken = getFcmToken();
      if (existingToken) {
        setupFcmListener();
      } else if (hasPermission()) {
        // If we have permission but no token, request it
        await requestFcmToken();
      }
    } catch (error) {
      console.error('Error initializing Firebase messaging:', error);
    }
  }
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
  getFcmToken
};
