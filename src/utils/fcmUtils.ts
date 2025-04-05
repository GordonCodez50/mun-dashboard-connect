
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import firebaseService from '@/services/firebaseService';
import { FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { toast } from 'sonner';

// Get the exported Firebase instances
const { firestore, auth } = firebaseService;

// The public VAPID key for web push
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
    
    const messaging = getMessaging();
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    if (currentToken) {
      console.log('FCM token available');
      
      // Save token to localStorage for easier access
      localStorage.setItem('fcmToken', currentToken);
      
      // If user is logged in, save to their Firestore record
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, currentUser.uid);
          await updateDoc(userDocRef, {
            fcmToken: currentToken,
            lastTokenUpdate: Timestamp.now()
          });
          console.log('FCM token saved to Firestore');
        } catch (firestoreError) {
          console.error('Error saving FCM token to Firestore:', firestoreError);
        }
      }
      
      return currentToken;
    } else {
      console.warn('No FCM token available, notification permission may not be enabled');
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
