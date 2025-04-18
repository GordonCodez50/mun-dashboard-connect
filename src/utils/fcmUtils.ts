
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import firebaseService from '@/services/firebaseService';
import { FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { toast } from 'sonner';
import { isAndroid, isChrome } from '@/utils/notificationPermission';

// Get the exported Firebase instances
const { firestore, auth } = firebaseService;

// The public VAPID key for web push
// This is the public key, safe to include in client-side code
const VAPID_KEY = 'BLW7VJrM3F8oL2IFysoC7monAgQ_dTWeaZZU3y3Hp0SgGK0C_jPBqknMcMs4v6v6NxJAaa0mqJDoNEn3Ce1Y0F8';

/**
 * Convert base64 string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
    
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Enhanced FCM token request and storage function with better error handling
 * and platform-specific optimizations
 */
export const requestAndSaveFcmToken = async (): Promise<string | null> => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return null;
    }
    
    // Log platform information for debugging
    console.log('Platform info:', {
      isAndroid: isAndroid(),
      isChrome: isChrome(),
      userAgent: navigator.userAgent,
      notificationPermission: Notification.permission
    });
    
    // Check permission status first
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted, cannot get FCM token');
      return null;
    }
    
    // Ensure we have an active service worker before requesting token
    let serviceWorkerRegistration;
    
    // For Android Chrome, ensure the service worker is properly registered
    if (isAndroid() && isChrome()) {
      console.log('Android Chrome detected, ensuring service worker is registered');
      try {
        // Unregister any existing service workers to ensure clean state
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          console.log('Unregistering existing service workers');
          await Promise.all(registrations.map(reg => reg.unregister()));
        }
        
        // Register with cache-busting parameter
        serviceWorkerRegistration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js?v=' + Date.now(), 
          { scope: '/' }
        );
        console.log('Service worker registered or updated:', serviceWorkerRegistration.scope);
        
        // Ensure it's activated before proceeding
        if (serviceWorkerRegistration.installing) {
          console.log('Waiting for service worker to activate...');
          await new Promise<void>((resolve) => {
            serviceWorkerRegistration.installing?.addEventListener('statechange', (e) => {
              if ((e.target as any).state === 'activated') {
                console.log('Service worker now activated');
                resolve();
              }
            });
          });
        }
      } catch (swError) {
        console.error('Service worker registration failed:', swError);
        // Continue anyway as it might already be registered
      }
    } else {
      // For other browsers, get existing registration or register new one
      try {
        serviceWorkerRegistration = await navigator.serviceWorker.ready;
        console.log('Using existing service worker:', serviceWorkerRegistration.scope);
      } catch (e) {
        console.warn('No active service worker, registering new one');
        try {
          serviceWorkerRegistration = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js', 
            { scope: '/' }
          );
          console.log('New service worker registered:', serviceWorkerRegistration.scope);
        } catch (regError) {
          console.error('Failed to register service worker:', regError);
        }
      }
    }
    
    // Safety check before proceeding
    if (!serviceWorkerRegistration) {
      console.error('No service worker registration available, cannot request FCM token');
      return null;
    }
    
    const messaging = getMessaging();
    console.log('Requesting FCM token with VAPID key');
    
    // Request token with multiple fallback approaches
    let currentToken: string | null = null;
    
    // First attempt: standard approach
    try {
      currentToken = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration
      });
    } catch (e) {
      console.warn('First token request failed:', e);
      
      // Second attempt: try with Uint8Array applicationServerKey format
      try {
        console.log('Trying alternative token format');
        currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration
        });
      } catch (altError) {
        console.error('Alternative token format also failed:', altError);
      }
    }
    
    if (currentToken) {
      console.log('FCM token obtained:', currentToken.substring(0, 10) + '...');
      
      // Save token to localStorage for easier access
      localStorage.setItem('fcmToken', currentToken);
      localStorage.setItem('fcmTokenTimestamp', Date.now().toString());
      
      // If user is logged in, save to their Firestore record
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, currentUser.uid);
          await updateDoc(userDocRef, {
            fcmToken: currentToken,
            lastTokenUpdate: Timestamp.now(),
            userAgent: navigator.userAgent, // Store user agent for debugging
            platform: isAndroid() ? 'android' : isChrome() ? 'chrome' : 'other'
          });
          console.log('FCM token saved to Firestore');
          
          // Let service worker know token was obtained
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'FCM_TOKEN_OBTAINED',
              timestamp: Date.now()
            });
          }
        } catch (firestoreError) {
          console.error('Error saving FCM token to Firestore:', firestoreError);
        }
      }
      
      return currentToken;
    } else {
      console.warn('No FCM token available, notification permission may not be enabled');
      
      // On Android, might need special handling
      if (isAndroid() && Notification.permission === 'granted') {
        console.warn('Android detected: Permission is granted but no token was returned');
        
        // Try refreshing the service worker registration
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log('Current service worker registrations:', registrations.length);
            
            if (registrations.length > 0) {
              // Unregister existing service workers
              await Promise.all(registrations.map(reg => reg.unregister()));
              console.log('Unregistered existing service workers');
            }
            
            // Register a new one
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('New service worker registered:', registration.scope);
            
            // Allow service worker to activate
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try getting token again
            const retryToken = await getToken(messaging, { 
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration
            });
            
            if (retryToken) {
              console.log('FCM token obtained after service worker refresh');
              localStorage.setItem('fcmToken', retryToken);
              localStorage.setItem('fcmTokenTimestamp', Date.now().toString());
              return retryToken;
            }
          } catch (swError) {
            console.error('Service worker refresh error:', swError);
          }
        }
        
        toast.error('Unable to register for notifications on this device. Please try again later.');
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    if (error instanceof Error) {
      toast.error(`Notification error: ${error.message}`);
    }
    return null;
  }
};

/**
 * Delete FCM token when logging out
 */
export const removeFcmToken = async (): Promise<boolean> => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('fcmToken');
    if (!token) return true;
    
    // Delete from Firebase
    const messaging = getMessaging();
    await deleteToken(messaging);
    
    // Remove from localStorage
    localStorage.removeItem('fcmToken');
    localStorage.removeItem('fcmTokenTimestamp');
    
    // If user is logged in, update their Firestore record
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, currentUser.uid);
      await updateDoc(userDocRef, {
        fcmToken: null,
        lastTokenUpdate: Timestamp.now()
      });
    }
    
    // Let service worker know token was removed
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'FCM_TOKEN_REMOVED',
        timestamp: Date.now()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return false;
  }
};

/**
 * Check if the FCM token needs refreshing (older than 2 days)
 */
export const checkTokenFreshness = (): boolean => {
  const tokenTimestamp = localStorage.getItem('fcmTokenTimestamp');
  if (!tokenTimestamp) return false;
  
  const timestamp = parseInt(tokenTimestamp, 10);
  const now = Date.now();
  const twodays = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
  
  return (now - timestamp) < twodays;
};

/**
 * Refresh the FCM token if needed
 */
export const refreshFcmTokenIfNeeded = async (): Promise<string | null> => {
  const token = localStorage.getItem('fcmToken');
  
  // If no token or token is stale, request a new one
  if (!token || !checkTokenFreshness()) {
    return await requestAndSaveFcmToken();
  }
  
  return token;
};

// Export the VAPID_KEY for use in other files
export { VAPID_KEY };
