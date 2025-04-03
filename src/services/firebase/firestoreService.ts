
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { firestore } from './index';
import { FIREBASE_CONFIG, FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { timestampToDate } from './firestoreHelpers';

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
