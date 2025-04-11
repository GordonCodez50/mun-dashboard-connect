
import { realtimeDb as db, firestore } from '@/services/firebaseService';
import { ref, get, set, increment } from 'firebase/database';
import { doc, getDoc, setDoc, updateDoc, increment as firestoreIncrement } from 'firebase/firestore';

export const printCountService = {
  /**
   * Get the council-specific print count for a council
   */
  async getCouncilPrintCount(council: string): Promise<number> {
    try {
      // First try Firestore
      const docRef = doc(firestore, 'councils', council.toLowerCase());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().printCount !== undefined) {
        return docSnap.data().printCount;
      }
      
      // Fallback to Realtime Database
      const dbRef = ref(db, `councilPrintCounts/${council.toLowerCase()}`);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      // If no count exists, initialize it
      await setDoc(docRef, { printCount: 0 }, { merge: true });
      return 0;
    } catch (error) {
      console.error('Error getting council print count:', error);
      return 0;
    }
  },

  /**
   * Get the global print count across all councils
   */
  async getGlobalPrintCount(): Promise<number> {
    try {
      // First try Firestore
      const docRef = doc(firestore, 'global', 'printCount');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().count;
      }
      
      // Fallback to Realtime Database
      const dbRef = ref(db, 'globalPrintCount');
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      // If no count exists, initialize it
      await setDoc(docRef, { count: 0 });
      return 0;
    } catch (error) {
      console.error('Error getting global print count:', error);
      return 0;
    }
  },

  /**
   * Increment both council-specific and global print counts
   */
  async incrementPrintCounts(council: string): Promise<{ councilCount: number, globalCount: number }> {
    try {
      // Get current counts
      const currentCouncilCount = await this.getCouncilPrintCount(council);
      const currentGlobalCount = await this.getGlobalPrintCount();
      
      // Increment council count in Firestore
      const councilDocRef = doc(firestore, 'councils', council.toLowerCase());
      await updateDoc(councilDocRef, {
        printCount: firestoreIncrement(1)
      }).catch(async () => {
        // If document doesn't exist, create it
        await setDoc(councilDocRef, { printCount: currentCouncilCount + 1 });
      });
      
      // Increment global count in Firestore
      const globalDocRef = doc(firestore, 'global', 'printCount');
      await updateDoc(globalDocRef, {
        count: firestoreIncrement(1)
      }).catch(async () => {
        // If document doesn't exist, create it
        await setDoc(globalDocRef, { count: currentGlobalCount + 1 });
      });
      
      // Update also in Realtime Database as backup
      await set(ref(db, `councilPrintCounts/${council.toLowerCase()}`), currentCouncilCount + 1);
      await set(ref(db, 'globalPrintCount'), currentGlobalCount + 1);
      
      return {
        councilCount: currentCouncilCount + 1,
        globalCount: currentGlobalCount + 1
      };
    } catch (error) {
      console.error('Error incrementing print counts:', error);
      return { councilCount: 0, globalCount: 0 };
    }
  }
};
