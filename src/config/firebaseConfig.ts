// Firebase configuration for the MUN Conference Dashboard
import { getUserInfoFromEmail, EMAIL_DOMAIN } from '@/utils/user-format';

// Firebase configuration object
// These are the actual Firebase project configuration values
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAmlEDVo8OJhGV-3Sr-jIwcY3UdD5kQBMU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "isbmun-dashboard-prod-red.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://isbmun-dashboard-prod-red-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "isbmun-dashboard-prod-red",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "isbmun-dashboard-prod-red.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "879089256467",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:879089256467:web:2f9e323c8c83805c6917e6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BBWT3VCT08"
};

// Feature flags and configuration
export const FIREBASE_CONFIG = {
  // Set to false for production to use real Firebase database
  demoMode: import.meta.env.VITE_FIREBASE_DEMO_MODE === 'true' || false,
};

// Data structure for Firestore
export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  councils: 'councils',
  alerts: 'alerts',
  documents: 'documents',
  participants: 'participants',
};

// Data paths for Realtime Database
export const RTDB_PATHS = {
  alerts: 'alerts',
  timers: 'timers',
};

// Email formats for role determination
// Now exported from user-format.ts
export const EMAIL_PATTERNS = {
  CHAIR_PREFIX: 'chair-',
  ADMIN_PREFIX: 'admin-',
  PRESS_PREFIX: 'press-',
  DOMAIN: `@${EMAIL_DOMAIN}`
};

// Function to extract role and council from email
// Now using the function from user-format.ts
export const extractUserInfo = (email: string) => {
  return getUserInfoFromEmail(email);
};

// Recommended Firebase security rules
/*
  These rules enforce the following:
  - Only authenticated users can read/write data
  - Data is structured with specific fields and types
  - Users can only update their own profiles
  - Admins can manage all users and data
*/
