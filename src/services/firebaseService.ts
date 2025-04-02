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
  setDoc as firestoreSetDoc
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
import { firebaseConfig, FIREBASE_CONFIG, FIRESTORE_COLLECTIONS, extractUserInfo } from '@/config/firebaseConfig';
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
    username: 'ECOSOC',
    name: 'ECOSOC Chair',
    role: 'chair' as UserRole,
    council: 'ECOSOC',
    email: 'chair-ecosoc@isbmun.com',
    createdAt: new Date(2023, 0, 1)
  },
  {
    id: 'admin1',
    username: 'Admin',
    name: 'Admin User',
    role: 'admin' as UserRole,
    email: 'admin@isbmun.com',
    createdAt: new Date(2023, 0, 1)
  },
  {
    id: 'press1',
    username: 'Press',
    name: 'Press Team',
    role: 'chair' as UserRole,
    council: 'PRESS',
    email: 'press@isbmun.com',
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
              const { role, council, username } = extractUserInfo(firebaseUser.email);
              
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
      // For demo mode, simulate sign in with predefined users
      const demoUser = DEMO_USERS.find(u => u.email === email && password === 'password');
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
          const { role, council, username } = extractUserInfo(firebaseUser.email);
          
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
      const email = userData.email || `${userData.username}@isbmun.com`;
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
    return firestoreSetDoc(docRef, data);
  });
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
  updateAlertStatus: async (alertId: string, status: string, additionalData: any = {}) => {
    try {
      const alertRef = ref(realtimeDb, `alerts/${alertId}`);
      await update(alertRef, {
        status,
        updatedAt: Date.now(),
        ...additionalData
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
  },
  
  // Add this new method for direct messages
  createDirectMessage: async (messageData: any): Promise<boolean> => {
    try {
      const alertsRef = ref(realtimeDb, 'alerts');
      const newMessageRef = push(alertsRef);
      await set(newMessageRef, {
        ...messageData,
        id: newMessageRef.key,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      console.log('Direct message sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending direct message:', error);
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
        { id: '1', name: 'ECOSOC' },
        { id: '2', name: 'UNHRC' },
        { id: '3', name: 'UNSC' },
        { id: '4', name: 'SPECPOL' },
        { id: '5', name: 'DISEC' }
      ];
    }
    
    try {
      // Get councils from Firestore
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
    
    // Set up demo alerts
    const alertTypes = ['IT Support', 'Mic Issue', 'Security', 'Break'];
    const demoCouncils = ['ECOSOC', 'UNHRC', 'UNSC', 'SPECPOL', 'DISEC'];
    
    const alertsRef = ref(realtimeDb, 'alerts');
    
    for (let i = 0; i < 3; i++) {
      const randomCouncil = Math.floor(Math.random() * demoCouncils.length);
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        council: demoCouncils[randomCouncil],
        chairName: `${demoCouncils[randomCouncil]} Chair`,
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
