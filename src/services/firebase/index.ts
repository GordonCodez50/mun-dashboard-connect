
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';
import { firebaseConfig } from '@/config/firebaseConfig';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const analytics = getAnalytics(app);

// Re-export all services
export { authService } from './authService';
export { realtimeService } from './realtimeService';
export { firestoreService } from './firestoreService';
export { initializeFirebase } from './initializeFirebase';

// Export as default for backward compatibility
export default {
  app,
  auth,
  firestore,
  realtimeDb,
  analytics,
  authService: authService,
  realtimeService: realtimeService,
  firestoreService: firestoreService,
  initializeFirebase: initializeFirebase
};
