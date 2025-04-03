
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  Timestamp, 
  updateDoc
} from 'firebase/firestore';
import { firestoreSetDoc } from './firestoreHelpers';
import { auth, firestore } from './index';
import { FIREBASE_CONFIG, FIRESTORE_COLLECTIONS, extractUserInfo } from '@/config/firebaseConfig';
import { User, UserRole, UserFormData } from '@/types/auth';
import { toast } from 'sonner';

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
    role: 'press' as UserRole,
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
      
      // Prepare user data for Firestore
      const userDataForFirestore: any = {
        username: userData.username,
        name: userData.name,
        role: userData.role,
        email: email,
        createdAt: Timestamp.now()
      };
      
      // Add council field based on role
      if (userData.role === 'chair') {
        userDataForFirestore.council = userData.council;
      } else if (userData.role === 'press') {
        userDataForFirestore.council = 'PRESS';
      }
      
      // Add user data to Firestore
      const userDocRef = doc(firestore, FIRESTORE_COLLECTIONS.users, firebaseUser.uid);
      await firestoreSetDoc(userDocRef, userDataForFirestore);
      
      // Return the new user
      return {
        id: firebaseUser.uid,
        username: userData.username,
        name: userData.name,
        role: userData.role,
        council: (userData.role === 'chair' || userData.role === 'press') ? userData.council : undefined,
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
