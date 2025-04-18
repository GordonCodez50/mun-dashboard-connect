
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import firebaseService from '@/services/firebaseService';
import { FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { toast } from 'sonner';
import { isAndroid, isChrome } from '@/utils/notificationPermission';

// Get the exported Firebase instances
const { firestore, auth } = firebaseService;

// The public VAPID key for web push
// IMPORTANT: This should be your actual VAPID key from Firebase console
const VAPID_KEY = '6QrfVAqgqA3d9rrUbrXfiT6t3XlUxFAKl4mFs5itDIQ';

/**
 * Request and save FCM token to Firestore
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
    
    // For Android Chrome, ensure the service worker is registered before requesting token
    if (isAndroid() && isChrome()) {
      console.log('Android Chrome detected, ensuring service worker is registered');
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service worker registered or updated:', registration.scope);
      } catch (swError) {
        console.error('Service worker registration failed:', swError);
        // Continue anyway as it might already be registered
      }
    }
    
    const messaging = getMessaging();
    console.log('Requesting FCM token with VAPID key:', VAPID_KEY.substring(0, 10) + '...');
    
    // Request token with explicit VAPID key
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    });
    
    if (currentToken) {
      console.log('FCM token available:', currentToken.substring(0, 10) + '...');
      
      // Save token to localStorage for easier access
      localStorage.setItem('fcmToken', currentToken);
      
      // If user is logged in, save to their Firestore record
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, currentUser.uid);
          await updateDoc(userDocRef, {
            fcmToken: currentToken,
            lastTokenUpdate: Timestamp.now(),
            userAgent: navigator.userAgent // Store user agent for debugging
          });
          console.log('FCM token saved to Firestore');
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
            
            // Try getting token again
            const retryToken = await getToken(messaging, { 
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration
            });
            if (retryToken) {
              console.log('FCM token obtained after service worker refresh');
              localStorage.setItem('fcmToken', retryToken);
              return retryToken;
            }
          } catch (swError) {
            console.error('Service worker refresh error:', swError);
          }
        }
        
        toast.error('Unable to register for notifications on this device');
      }
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    if (error instanceof Error) {
      toast.error(`FCM error: ${error.message}`);
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
    
    // If user is logged in, update their Firestore record
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, currentUser.uid);
      await updateDoc(userDocRef, {
        fcmToken: null,
        lastTokenUpdate: Timestamp.now()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return false;
  }
};
