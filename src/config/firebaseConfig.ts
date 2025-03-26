
// Firebase configuration for the MUN Conference Dashboard

// Firebase configuration object
// These are the actual Firebase project configuration values
export const firebaseConfig = {
  apiKey: "AIzaSyACQXMIDb2-98Ttqtrde7PEtJfIBGqaxXY",
  authDomain: "isbmun-dashboard.firebaseapp.com",
  databaseURL: "https://isbmun-dashboard-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "isbmun-dashboard",
  storageBucket: "isbmun-dashboard.firebasestorage.app",
  messagingSenderId: "705687529606",
  appId: "1:705687529606:web:bab945809e06c12c1a0907",
  measurementId: "G-4R8RYDJGRZ"
};

// Feature flags and configuration
export const FIREBASE_CONFIG = {
  // If true, use demo mode with predefined data
  // You can set this to false once you've set up your Firebase project
  demoMode: import.meta.env.VITE_FIREBASE_DEMO_MODE === 'true' || false,
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
