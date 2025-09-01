import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  onSnapshot,
  setDoc as firestoreSetDoc,
  FirestoreError
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  update, 
  remove,
  get
} from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';
import { FirebaseError } from 'firebase/app';
import { firebaseConfig, FIREBASE_CONFIG, FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { User, UserRole, UserFormData } from '@/types/auth';
import { toast } from 'sonner';
import { getMessaging, getToken } from 'firebase/messaging';
import { notificationService } from './notificationService';
import { getUserInfoFromEmail } from '@/utils/user-format';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const realtimeDb = getDatabase(app);
const analytics = getAnalytics(app);

// Initialize Firebase Cloud Messaging (FCM)
let messaging: any = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error('Error initializing Firebase messaging:', error);
}

// Authentication service
export const authService = {
  // Get current user
  getCurrentUser: (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        unsubscribe();
        
        if (!firebaseUser) {
          resolve(null);
          return;
        }
        
        try {
          // Check if user exists in Firestore
          const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // User exists in Firestore, return their data
            const userData = userDoc.data() as Omit<User, 'id'>;
            resolve({
              id: firebaseUser.uid,
              ...userData,
              createdAt: (userData.createdAt as unknown as Timestamp).toDate(),
              lastLogin: userData.lastLogin ? (userData.lastLogin as unknown as Timestamp).toDate() : undefined
            });
          } else {
            // User doesn't exist in Firestore yet, create their profile based on email
            if (firebaseUser.email) {
              const { role, council, username } = getUserInfoFromEmail(firebaseUser.email);
              
              // Create user document in Firestore
              const newUserData: any = {
                username: username,
                name: firebaseUser.displayName || username,
                role: role,
                email: firebaseUser.email,
                createdAt: Timestamp.now(),
                lastLogin: Timestamp.now()
              };
              
              // Only add council field if it's defined
              if (council) {
                newUserData.council = council;
              }
              
              await firestoreSetDoc(userDocRef, newUserData);
              
              // Return the new user
              resolve({
                id: firebaseUser.uid,
                ...newUserData,
                createdAt: new Date(),
                lastLogin: new Date()
              });
            } else {
              // No email associated with the account
              resolve(null);
            }
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          resolve(null);
        }
      });
    });
  },
  
  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<User> => {
    if (FIREBASE_CONFIG.demoMode) {
      throw new Error('Demo mode not supported. Please use production mode.');
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get or create user in Firestore
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userData: any;
      
      if (userDoc.exists()) {
        // Update last login time
        await updateDoc(userDocRef, {
          lastLogin: Timestamp.now()
        });
        
        userData = userDoc.data();
      } else {
        // Create new user document based on email
        if (firebaseUser.email) {
          const { role, council, username } = getUserInfoFromEmail(firebaseUser.email);
          
          userData = {
            username: username,
            name: firebaseUser.displayName || username,
            role: role,
            email: firebaseUser.email,
            createdAt: Timestamp.now(),
            lastLogin: Timestamp.now()
          };
          
          // Only add council field if it's defined
          if (council) {
            userData.council = council;
          }
          
          await firestoreSetDoc(userDocRef, userData);
        } else {
          throw new Error('No email associated with this account');
        }
      }
      
      // Return user data
      return {
        id: firebaseUser.uid,
        ...userData,
        createdAt: (userData.createdAt as unknown as Timestamp).toDate(),
        lastLogin: new Date()
      };
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  },
  
  // Sign out
  signOut: async (): Promise<void> => {
    if (FIREBASE_CONFIG.demoMode) {
      return;
    }
    
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  
  // Create a new user (admin function)
  createUser: async (userData: UserFormData): Promise<User> => {
    if (FIREBASE_CONFIG.demoMode) {
      // For demo mode, simulate user creation
      const newUser = {
        id: `user${Date.now()}`,
        ...userData,
        username: userData.email || `${userData.username}@example.com`,
        createdAt: new Date()
      };
      
      return newUser;
    }
    
    try {
      // Create user in Firebase Auth
      const email = userData.email || `${userData.username}@bmunis.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, {
        displayName: userData.name
      });
      
      // Add user data to Firestore
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, firebaseUser.uid);
      await firestoreSetDoc(userDocRef, {
        username: userData.username,
        name: userData.name,
        role: userData.role,
        council: userData.role === 'chair' ? userData.council : null,
        email: email,
        createdAt: Timestamp.now()
      });
      
      // Return the new user
      return {
        id: firebaseUser.uid,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        council: userData.role === 'chair' ? userData.council : undefined,
        email: email,
        createdAt: new Date()
      };
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  },
  
  // Delete a user (admin function)
  deleteUser: async (userId: string): Promise<void> => {
    if (FIREBASE_CONFIG.demoMode) {
      // For demo mode, just return
      return;
    }
    
    try {
      // Delete user data from Firestore
      await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.users, userId));
      
      // Note: Deleting the actual Firebase Auth user requires an Admin SDK
      // This would typically be done through a backend function
      // Here we're just removing the Firestore record
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  
  // Get all users (admin function)
  getUsers: async (): Promise<User[]> => {
    if (FIREBASE_CONFIG.demoMode) {
      // For demo mode, return predefined users
      return [];
    }
    
    try {
      const usersSnapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.users));
      
      return usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username,
          name: data.name,
          role: data.role,
          council: data.council,
          email: data.email,
          room_no: data.room_no,
          floor_no: data.floor_no,
          createdAt: (data.createdAt as Timestamp).toDate(),
          lastLogin: data.lastLogin ? (data.lastLogin as Timestamp).toDate() : undefined
        };
      });
    } catch (error) {
      console.error('Error getting users:', error);
      // Handle permission errors gracefully
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        console.log('Permission denied when fetching users. This is expected for non-admin users.');
        return [];
      }
      throw error;
    }
  }
};

// Helper function to convert Firestore timestamp to Date
const timestampToDate = (timestamp: Timestamp | undefined): Date | undefined => {
  return timestamp ? timestamp.toDate() : undefined;
};

// Helper function to set document with ID
const setDoc = (docRef: any, data: any) => {
  return updateDoc(docRef, data).catch(() => {
    // If update fails (document doesn't exist), create it
    return firestoreSetDoc(docRef, data);
  });
};

// New service for Firebase Cloud Messaging
export const fcmService = {
  getToken: async (vapidKey: string): Promise<string | null> => {
    if (!messaging) {
      console.error('Firebase messaging is not available');
      return null;
    }
    
    try {
      const currentToken = await getToken(messaging, { vapidKey });
      
      if (currentToken) {
        console.log('FCM token obtained');
        
        // Save token in Firestore (for admin to send notifications)
        if (auth.currentUser) {
          const userRef = doc(firestore, FIRESTORE_COLLECTIONS.users, auth.currentUser.uid);
          await updateDoc(userRef, {
            fcmToken: currentToken,
            lastTokenUpdate: Timestamp.now()
          });
        }
        
        return currentToken;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },
  
  // Send notification to specific users or councils
  sendNotification: async (
    options: {
      title: string;
      body: string;
      tokens?: string[];
      council?: string;
      role?: string;
      data?: any;
    }
  ): Promise<boolean> => {
    if (FIREBASE_CONFIG.demoMode) {
      console.log('Demo mode: would send notification', options);
      return true;
    }
    
    try {
      // In a real implementation, this would involve a Cloud Function
      // to send the notification through the Firebase Admin SDK
      
      // For demo purposes, we're simulating it with a direct notification
      if (options.tokens && options.tokens.length > 0) {
        // Simulate successful notification
        toast.success(`Notification sent to ${options.tokens.length} devices`);
        return true;
      } else if (options.council) {
        // Would query for all tokens for the given council
        toast.success(`Notification would be sent to council ${options.council}`);
        return true;
      } else {
        toast.error('No recipients specified for notification');
        return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
      return false;
    }
  }
};

// Realtime Database service (replaces WebSocket)
export const realtimeService = {
  // Listen for new alerts
  onNewAlert: (callback: (alert: any) => void) => {
    const alertsRef = ref(realtimeDb, 'alerts');
    onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array
        const alerts = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as any)
        }));
        callback(alerts);
      } else {
        callback([]);
      }
    });
    
    // Return unsubscribe function
    return () => off(alertsRef);
  },
  
  // Listen for alert status updates
  onAlertStatusUpdates: (callback: (alerts: any) => void) => {
    const alertsRef = ref(realtimeDb, 'alerts');
    onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || {});
    });
    
    // Return unsubscribe function
    return () => off(alertsRef);
  },
  
  // Create a new alert
  createAlert: async (alertData: any) => {
    try {
      // Clean undefined values before sending to Firebase
      const cleanData = JSON.parse(JSON.stringify(alertData, (key, value) => {
        return value === undefined ? null : value;
      }));
      
      const alertsRef = ref(realtimeDb, 'alerts');
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        ...cleanData,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      console.log('Alert created successfully');
      return true;
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
      return false;
    }
  },

  // Create direct message for admin to chair communication
  createDirectMessage: async (messageData: any) => {
    try {
      // Clean undefined values before sending to Firebase
      const cleanData = JSON.parse(JSON.stringify(messageData, (key, value) => {
        return value === undefined ? null : value;
      }));
      
      const alertsRef = ref(realtimeDb, 'alerts');
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        ...cleanData,
        timestamp: Date.now(),
        status: cleanData.status || 'pending'
      });
      
      console.log('Direct message created successfully');
      return true;
    } catch (error) {
      console.error('Error creating direct message:', error);
      toast.error('Failed to send message');
      return false;
    }
  },
  
  // Update alert status
  updateAlertStatus: async (alertId: string, status: string, additionalData: any = {}) => {
    try {
      const alertRef = ref(realtimeDb, `alerts/${alertId}`);
      await update(alertRef, {
        status,
        updatedAt: Date.now(),
        ...additionalData
      });
      
      console.log(`Alert ${alertId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast.error('Failed to update alert status');
      return false;
    }
  },
  
  // Timer sync
  onTimerSync: (timerId: string, callback: (data: any) => void) => {
    const timerRef = ref(realtimeDb, `timers/${timerId}`);
    onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
    
    // Return unsubscribe function
    return () => off(timerRef);
  },
  
  // Update timer
  updateTimer: async (timerId: string, timerData: any) => {
    try {
      const timerRef = ref(realtimeDb, `timers/${timerId}`);
      await set(timerRef, {
        ...timerData,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating timer:', error);
      toast.error('Failed to update timer');
      return false;
    }
  },
  
  // File management for Cloudinary
  saveFileMetadata: async (councilId: string, assetId: string, fileMetadata: any) => {
    try {
      const fileRef = ref(realtimeDb, `files/${councilId}/${assetId}`);
      await set(fileRef, fileMetadata);
      return true;
    } catch (error) {
      console.error('Error saving file metadata:', error);
      return false;
    }
  },

  saveAdminFileMetadata: async (assetId: string, fileMetadata: any) => {
    try {
      const fileRef = ref(realtimeDb, `files/admin/${assetId}`);
      await set(fileRef, fileMetadata);
      return true;
    } catch (error) {
      console.error('Error saving admin file metadata:', error);
      return false;
    }
  },

  getFiles: async (councilId: string) => {
    try {
      const { get } = await import('firebase/database');
      const filesRef = ref(realtimeDb, `files/${councilId}`);
      const snapshot = await get(filesRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error getting files:', error);
      return {};
    }
  },

  getAdminFiles: async () => {
    try {
      const { get } = await import('firebase/database');
      const filesRef = ref(realtimeDb, `files/admin`);
      const snapshot = await get(filesRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error getting admin files:', error);
      return {};
    }
  },

  // R&T Admin file management
  saveRTAdminFileMetadata: async (assetId: string, fileMetadata: any) => {
    try {
      const { set } = await import('firebase/database');
      const fileRef = ref(realtimeDb, `files/admin-rt/${assetId}`);
      await set(fileRef, fileMetadata);
    } catch (error) {
      console.error('Error saving R&T admin file metadata:', error);
      throw error;
    }
  },

  // Chair-to-members file management
  saveChairToMembersFile: async (council: string, assetId: string, fileMetadata: any) => {
    try {
      const { set } = await import('firebase/database');
      const fileRef = ref(realtimeDb, `files/chair-to-members/${council}/${assetId}`);
      await set(fileRef, fileMetadata);
      return true;
    } catch (error) {
      console.error('Error saving chair-to-members file metadata:', error);
      return false;
    }
  },

  getRTAdminFiles: async () => {
    try {
      const { get } = await import('firebase/database');
      const filesRef = ref(realtimeDb, `files/admin-rt`);
      const snapshot = await get(filesRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error getting R&T admin files:', error);
      return {};
    }
  },

  getChairToMembersFiles: async (council: string) => {
    try {
      const { get } = await import('firebase/database');
      const filesRef = ref(realtimeDb, `files/chair-to-members/${council}`);
      const snapshot = await get(filesRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error getting chair-to-members files:', error);
      return {};
    }
  },

  // Initialize alert listeners - empty function as we don't need it in the consolidated service
  initializeAlertListeners: () => {
    console.log('Alert listeners managed by Firebase hooks');
    return () => {};
  },

  // Check if alert listeners are active - empty function as we don't need it
  areAlertListenersActive: () => {
    return true;
  },

  // Reinitialize alert listeners - empty function as we don't need it
  reinitializeAlertListeners: () => {
    console.log('Alert listeners managed by Firebase hooks');
    return () => {};
  },

};

// Firestore service for document storage
export const firestoreService = {
  // Get councils from chair users in users collection
  getCouncilsFromUsers: async () => {
    if (FIREBASE_CONFIG.demoMode) {
      // Return demo councils
      return [
        { id: '1', name: 'ECOSOC' },
        { id: '2', name: 'UNHRC' },
        { id: '3', name: 'UNSC' },
        { id: '4', name: 'SPECPOL' },
        { id: '5', name: 'DISEC' }
      ];
    }
    
    try {
      // Get all users from Firestore
      const usersSnapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.users));
      const uniqueCouncils = new Set<string>();
      
      // Extract unique councils from chair users
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.role === 'chair' && userData.council && userData.council !== 'PRESS') {
          uniqueCouncils.add(userData.council);
        }
      });
      
      // Convert to array and return as council objects
      return Array.from(uniqueCouncils).map(councilName => ({
        id: councilName.toLowerCase(),
        name: councilName
      }));
    } catch (error) {
      console.error('Error getting councils from users:', error);
      // Handle permission errors gracefully
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        console.log('Permission denied when fetching users. This is expected for non-admin users.');
        return [];
      }
      throw error;
    }
  },

  // Get all councils (kept for backwards compatibility)
  getCouncils: async () => {
    if (FIREBASE_CONFIG.demoMode) {
      // Return demo councils
      return [
        { id: '1', name: 'ECOSOC' },
        { id: '2', name: 'UNHRC' },
        { id: '3', name: 'UNSC' },
        { id: '4', name: 'SPECPOL' },
        { id: '5', name: 'DISEC' }
      ];
    }
    
    try {
      // First try to get councils from users collection (preferred method)
      const councilsFromUsers = await firestoreService.getCouncilsFromUsers();
      if (councilsFromUsers && councilsFromUsers.length > 0) {
        return councilsFromUsers;
      }
      
      // Fallback: Get councils from Firestore councils collection
      const councilsSnapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.councils));
      let councils = councilsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If no councils are found, try to extract them from user data
      if (councils.length === 0) {
        const usersSnapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.users));
        const uniqueCouncils = new Set<string>();
        
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          if (userData.role === 'chair' && userData.council && userData.council !== 'PRESS') {
            uniqueCouncils.add(userData.council);
          }
        });
        
        // Create council documents for each unique council
        const councilPromises = Array.from(uniqueCouncils).map(async (councilName) => {
          const docRef = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.councils), {
            name: councilName,
            createdAt: Timestamp.now()
          });
          
          return {
            id: docRef.id,
            name: councilName
          };
        });
        
        councils = await Promise.all(councilPromises);
      }
      
      return councils;
    } catch (error) {
      console.error('Error getting councils:', error);
      // Handle permission errors gracefully
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        console.log('Permission denied when fetching councils. This is expected for non-admin users.');
        return [];
      }
      throw error;
    }
  },
  
  // Get all users
  getUsers: async () => {
    if (FIREBASE_CONFIG.demoMode) {
      // Return demo users
      return [
        { id: '1', email: 'logistics-john@bmunis.com', name: 'John', role: 'logistics' },
        { id: '2', email: 'logistics-sarah@bmunis.com', name: 'Sarah', role: 'logistics' }
      ];
    }
    
    try {
      const usersSnapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.users));
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        console.log('Permission denied when fetching users. This is expected for non-admin users.');
        return [];
      }
      throw error;
    }
  },
  
  // Add a new council
  addCouncil: async (councilData: { name: string }) => {
    if (FIREBASE_CONFIG.demoMode) {
      // Simulate adding a council
      return {
        id: Date.now().toString(),
        ...councilData,
        createdAt: new Date()
      };
    }
    
    try {
      const docRef = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.councils), {
        ...councilData,
        createdAt: Timestamp.now()
      });
      
      return {
        id: docRef.id,
        ...councilData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error adding council:', error);
      throw error;
    }
  },
  
  // Get all documents
  getDocuments: async () => {
    if (FIREBASE_CONFIG.demoMode) {
      // Return demo documents
      return [
        { id: '1', title: 'Rules of Procedure', url: '#', createdAt: new Date() },
        { id: '2', title: 'Working Paper 1', url: '#', createdAt: new Date() },
        { id: '3', title: 'Resolution Draft', url: '#', createdAt: new Date() }
      ];
    }
    
    try {
      const documentsSnapshot = await getDocs(
        query(collection(firestore, FIRESTORE_COLLECTIONS.documents), orderBy('createdAt', 'desc'))
      );
      
      return documentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: timestampToDate(data.createdAt as Timestamp)
        };
      });
    } catch (error) {
      console.error('Error getting documents:', error);
      // Handle permission errors gracefully
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        console.log('Permission denied when fetching documents. This is expected for non-admin users.');
        return [];
      }
      throw error;
    }
  },
  
  // Add a new document
  addDocument: async (documentData: any) => {
    if (FIREBASE_CONFIG.demoMode) {
      // Simulate adding a document
      return {
        id: Date.now().toString(),
        ...documentData,
        createdAt: new Date()
      };
    }
    
    try {
      const docRef = await addDoc(collection(firestore, FIRESTORE_COLLECTIONS.documents), {
        ...documentData,
        createdAt: Timestamp.now()
      });
      
      return {
        id: docRef.id,
        ...documentData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  },
  
  // Delete a document
  deleteDocument: async (documentId: string) => {
    if (FIREBASE_CONFIG.demoMode) {
      // Simulate deleting a document
      return;
    }
    
    try {
      await deleteDoc(doc(firestore, FIRESTORE_COLLECTIONS.documents, documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};

// Demo data initialization disabled for production
export const initializeDemoData = async () => {
  console.log('Demo data initialization disabled for production');
};

// Initialize Firebase
export const initializeFirebase = async () => {
  try {
    // Check if Firebase is already initialized
    if (!app) {
      console.error('Firebase app initialization failed');
      return false;
    }
    
    console.log('Firebase initialized successfully');
    
    // Initialize FCM if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && notificationService.hasPermission()) {
      try {
        const token = await notificationService.requestFcmToken();
        if (token) {
          console.log('FCM initialized successfully');
        }
      } catch (fcmError) {
        console.error('Error initializing FCM:', fcmError);
      }
    }
    
    // Initialize demo data if in demo mode
    if (FIREBASE_CONFIG.demoMode) {
      await initializeDemoData();
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
};

export default {
  app,
  auth,
  firestore,
  realtimeDb,
  analytics,
  messaging,
  authService,
  realtimeService: {} as any, // This will be populated from the appropriate module
  firestoreService: {} as any, // This will be populated from the appropriate module
  fcmService: {} as any,       // This will be populated from the appropriate module
  initializeFirebase
};
