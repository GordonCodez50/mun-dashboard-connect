
// Firebase configuration for the MUN Conference Dashboard

// Firebase configuration object
// These are the actual Firebase project configuration values
const firebaseConfig = {
  apiKey: "AIzaSyAmlEDVo8OJhGV-3Sr-jIwcY3UdD5kQBMU",
  authDomain: "isbmun-dashboard-prod-red.firebaseapp.com",
  databaseURL: "https://isbmun-dashboard-prod-red-default-rtdb.asia-southeastl.firebasedatabase.app",
  projectId: "isbmun-dashboard-prod-red",
  storageBucket: "isbmun-dashboard-prod-red.firebasestorage.app",
  messagingSenderId: "879089256467",
  appId: "1:879089256467:web:2f9e323c8c83805c6917e6",
  measurementId: "G-BBWT3VCT08"
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

// Email formats for role determination
export const EMAIL_PATTERNS = {
  CHAIR_PREFIX: 'chair-',
  ADMIN_PREFIX: 'admin',
  PRESS_PREFIX: 'press',
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
    return {
      role: 'admin' as const,
      council: undefined,
      username: 'Admin' // Default admin username
    };
  } else if (email.startsWith(EMAIL_PATTERNS.PRESS_PREFIX)) {
    return {
      role: 'chair' as const, // Press users have same access as chair
      council: 'PRESS',
      username: 'Press' // Default press username
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
        
        // Allow chair users to update their own council's status
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
        // Allow admins to read and write all data
        ".read": "auth != null",
        
        "councilStatus": {
          // Allow chairs to update only their own council status
          "$councilId": {
            ".write": "auth != null && 
                      (root.child('users').child(auth.uid).child('role').val() == 'admin' || 
                      root.child('users').child(auth.uid).child('council').val() == data.child('name').val())"
          }
        },
        
        "alerts": {
          // Anyone can create alerts
          ".write": "auth != null",
          
          "$alertId": {
            // Admins can update any alert, chairs can only update their own
            ".write": "auth != null && 
                      (root.child('users').child(auth.uid).child('role').val() == 'admin' || 
                      data.child('council').val() == root.child('users').child(auth.uid).child('council').val())"
          }
        },
        
        "timers": {
          // Allow access to timers for authorized users
          "$timerId": {
            ".write": "auth != null && 
                      (root.child('users').child(auth.uid).child('role').val() == 'admin' || 
                      data.child('council').val() == root.child('users').child(auth.uid).child('council').val() || 
                      !data.exists())"
          }
        }
      }
    }
  `
};
