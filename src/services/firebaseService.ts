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
  onSnapshot 
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  update, 
  remove 
} from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';
import { firebaseConfig, FIREBASE_CONFIG, FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { User, UserRole, UserFormData } from '@/types/auth';
import { toast } from 'sonner';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const realtimeDb = getDatabase(app);
const analytics = getAnalytics(app);

// Demo data for simulation mode
const DEMO_USERS = [
  {
    id: 'chair1',
    username: 'chair@example.com',
    name: 'John Smith',
    role: 'chair' as UserRole,
    council: 'Security Council',
    email: 'chair@example.com',
    createdAt: new Date(2023, 0, 1)
  },
  {
    id: 'admin1',
    username: 'admin@example.com',
    name: 'Admin User',
    role: 'admin' as UserRole,
    email: 'admin@example.com',
    createdAt: new Date(2023, 0, 1)
  }
];

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
          const userDoc = await getDoc(doc(firestore, FIRESTORE_COLLECTIONS.users, firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            resolve({
              id: firebaseUser.uid,
              ...userData,
              createdAt: (userData.createdAt as unknown as Timestamp).toDate(),
              lastLogin: userData.lastLogin ? (userData.lastLogin as unknown as Timestamp).toDate() : undefined
            });
          } else {
            // User exists in Auth but not in Firestore
            // This should not happen in normal operation
            resolve(null);
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
      // For demo mode, simulate sign in with predefined users
      const demoUser = DEMO_USERS.find(u => u.username === email && password === 'password');
      if (!demoUser) {
        throw new Error('Invalid email or password');
      }
      
      return {
        ...demoUser,
        lastLogin: new Date()
      };
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update last login time in Firestore
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, firebaseUser.uid);
      await updateDoc(userDocRef, {
        lastLogin: Timestamp.now()
      });
      
      // Get full user data from Firestore
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      
      const userData = userDoc.data() as Omit<User, 'id'>;
      
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
      const email = userData.email || `${userData.username}@example.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, userData.password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, {
        displayName: userData.name
      });
      
      // Add user data to Firestore
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, firebaseUser.uid);
      await setDoc(userDocRef, {
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
      return DEMO_USERS;
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
          createdAt: (data.createdAt as Timestamp).toDate(),
          lastLogin: data.lastLogin ? (data.lastLogin as Timestamp).toDate() : undefined
        };
      });
    } catch (error) {
      console.error('Error getting users:', error);
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
    return setFirestoreDoc(docRef, data);
  });
};

// Helper function to create a document
const setFirestoreDoc = (docRef: any, data: any) => {
  return updateDoc(docRef, {
    ...data,
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

// Realtime Database service (replaces WebSocket)
export const realtimeService = {
  // Listen for council status updates
  onCouncilStatusUpdate: (councilId: string, callback: (status: any) => void) => {
    const statusRef = ref(realtimeDb, `councilStatus/${councilId}`);
    onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
    
    // Return unsubscribe function
    return () => off(statusRef);
  },
  
  // Update council status
  updateCouncilStatus: async (councilId: string, status: string) => {
    try {
      const statusRef = ref(realtimeDb, `councilStatus/${councilId}`);
      await set(statusRef, {
        status,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating council status:', error);
      toast.error('Failed to update council status');
      return false;
    }
  },
  
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
      }
    });
    
    // Return unsubscribe function
    return () => off(alertsRef);
  },
  
  // Create a new alert
  createAlert: async (alertData: any) => {
    try {
      const alertsRef = ref(realtimeDb, 'alerts');
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        ...alertData,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      return true;
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
      return false;
    }
  },
  
  // Update alert status
  updateAlertStatus: async (alertId: string, status: string) => {
    try {
      const alertRef = ref(realtimeDb, `alerts/${alertId}`);
      await update(alertRef, {
        status,
        updatedAt: Date.now()
      });
      
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
  }
};

// Firestore service for document storage
export const firestoreService = {
  // Get all councils
  getCouncils: async () => {
    if (FIREBASE_CONFIG.demoMode) {
      // Return demo councils
      return [
        { id: '1', name: 'Security Council', status: 'in-session' },
        { id: '2', name: 'General Assembly', status: 'on-break' },
        { id: '3', name: 'Human Rights Council', status: 'in-session' },
        { id: '4', name: 'Economic and Social Council', status: 'technical-issue' },
        { id: '5', name: 'Environmental Committee', status: 'in-session' }
      ];
    }
    
    try {
      const councilsSnapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.councils));
      
      return councilsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting councils:', error);
      throw error;
    }
  },
  
  // Add a new council
  addCouncil: async (councilData: { name: string; status: string }) => {
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
      
      // Initialize the council status in Realtime Database
      const statusRef = ref(realtimeDb, `councilStatus/${docRef.id}`);
      await set(statusRef, {
        status: councilData.status,
        timestamp: Date.now()
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

// Initialize data for demo mode
export const initializeDemoData = async () => {
  if (FIREBASE_CONFIG.demoMode) {
    console.log('Initializing demo data...');
    
    // Set up demo council statuses
    const statuses: ('in-session' | 'on-break' | 'technical-issue')[] = ['in-session', 'on-break', 'technical-issue'];
    
    for (let i = 1; i <= 5; i++) {
      const statusRef = ref(realtimeDb, `councilStatus/${i}`);
      await set(statusRef, {
        status: statuses[Math.floor(Math.random() * statuses.length)],
        timestamp: Date.now()
      });
    }
    
    // Set up demo alerts
    const alertTypes = ['IT Support', 'Mic Issue', 'Security', 'Break'];
    const councils = ['Security Council', 'Human Rights Council', 'Economic and Social Council', 'General Assembly', 'Environmental Committee'];
    const chairNames = ['John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Wilson', 'Alex Thompson'];
    
    const alertsRef = ref(realtimeDb, 'alerts');
    
    for (let i = 0; i < 3; i++) {
      const randomCouncil = Math.floor(Math.random() * councils.length);
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        council: councils[randomCouncil],
        chairName: chairNames[randomCouncil],
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: 'Demo alert message',
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        status: Math.random() > 0.5 ? 'pending' : 'resolved',
        priority: Math.random() > 0.7 ? 'urgent' : 'normal'
      });
    }
    
    console.log('Demo data initialized');
  }
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
  authService,
  realtimeService,
  firestoreService,
  initializeFirebase
};
