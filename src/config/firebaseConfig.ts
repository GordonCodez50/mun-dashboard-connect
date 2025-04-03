
// Firebase configuration for the MUN Conference Dashboard

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
  alerts: 'alerts',
  timers: 'timers',
};

// Email formats for role determination
export const EMAIL_PATTERNS = {
  CHAIR_PREFIX: 'chair-',
  ADMIN_PREFIX: 'admin-',
  PRESS_PREFIX: 'press-',
  DOMAIN: '@isbmun.com'
};

// Function to extract role and council from email
export const extractUserInfo = (email: string) => {
  email = email.toLowerCase();
  
  if (email.startsWith(EMAIL_PATTERNS.CHAIR_PREFIX)) {
    // Extract council name from chair-COUNCILNAME@isbmun.com
    const councilPart = email.substring(EMAIL_PATTERNS.CHAIR_PREFIX.length);
    const council = councilPart.split('@')[0].toUpperCase();
    return { 
      role: 'chair' as const,
      council,
      username: council // Use council name as username
    };
  } else if (email.startsWith(EMAIL_PATTERNS.ADMIN_PREFIX)) {
    // Extract name from admin-NAME@isbmun.com (if provided)
    const namePart = email.substring(EMAIL_PATTERNS.ADMIN_PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'admin' as const,
      council: undefined,
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Admin' // Capitalize name or use default
    };
  } else if (email.startsWith(EMAIL_PATTERNS.PRESS_PREFIX)) {
    // Extract name from press-NAME@isbmun.com (if provided)
    const namePart = email.substring(EMAIL_PATTERNS.PRESS_PREFIX.length);
    const name = namePart.split('@')[0];
    return {
      role: 'chair' as const, // Press users have same access as chair
      council: 'PRESS',
      username: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Press' // Capitalize name or use default
    };
  } else if (email.startsWith('admin')) {
    // Fallback for old admin format
    return {
      role: 'admin' as const,
      council: undefined,
      username: 'Admin'
    };
  } else if (email.startsWith('press')) {
    // Fallback for old press format
    return {
      role: 'chair' as const,
      council: 'PRESS',
      username: 'Press'
    };
  }
  
  // Default fallback
  return {
    role: 'chair' as const,
    council: undefined,
    username: email.split('@')[0]
  };
};

// Recommended Firebase security rules
export const RECOMMENDED_SECURITY_RULES = {
  // Firestore security rules
  firestore: `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow admins to read and write all documents
        match /{document=**} {
          allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
        }
        
        // Allow chair users to read all documents
        match /{document=**} {
          allow read: if request.auth != null;
        }
        
        // Allow all authenticated users to read and write their own user document
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        
        // Allow chair users to update their own council's information
        match /councils/{councilId} {
          allow update: if request.auth != null && 
                          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.council == resource.data.name;
        }
        
        // Allow chair users to create alerts
        match /alerts/{alertId} {
          allow create: if request.auth != null && 
                         request.resource.data.council == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.council;
        }
        
        // Allow users to read documents
        match /documents/{documentId} {
          allow read: if request.auth != null;
        }
      }
    }
  `,
  
  // Realtime Database security rules
  realtimeDb: `
    {
      "rules": {
        // Allow all authenticated users to read data
        ".read": "auth != null",
        
        "alerts": {
          // Allow authenticated users to read and create alerts
          ".read": "auth != null",
          ".write": "auth != null",
          
          "$alertId": {
            // Anyone can read alerts
            ".read": true,
            
            // Authenticated users can update alerts
            ".write": "auth != null"
          }
        },
        
        "timers": {
          // Allow access to timers for authenticated users
          ".read": "auth != null",
          ".write": "auth != null",
          
          "$timerId": {
            ".read": "auth != null",
            ".write": "auth != null"
          }
        }
      }
    }
  `
};
