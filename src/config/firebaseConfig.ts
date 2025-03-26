
// Firebase configuration for the MUN Conference Dashboard

// Firebase configuration object
// Replace these values with your actual Firebase project configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://your-project-rtdb.firebaseio.com",
};

// Feature flags and configuration
export const FIREBASE_CONFIG = {
  // If true, use demo mode with predefined data
  demoMode: import.meta.env.VITE_FIREBASE_DEMO_MODE === 'true' || true,
};

// Data structure for Firestore
export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  councils: 'councils',
  alerts: 'alerts',
  documents: 'documents',
};

// Data paths for Realtime Database
export const RTDB_PATHS = {
  councilStatus: 'councilStatus',
  alerts: 'alerts',
  timers: 'timers',
};
