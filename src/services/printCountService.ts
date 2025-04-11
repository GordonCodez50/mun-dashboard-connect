
import { ref, get, set, increment } from 'firebase/database';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, increment as firestoreIncrement } from 'firebase/firestore';
import { realtimeService } from './firebaseService';

// Reference to the Firebase Realtime Database
const { realtimeDb } = realtimeService;

// Counts are stored in Realtime Database for faster concurrent updates
export const printCountService = {
  /**
   * Get the council-specific print count
   * @param council The council name
   * @returns The current print count for the council
   */
  async getCouncilPrintCount(council: string): Promise<number> {
    try {
      const councilRef = ref(realtimeDb, `printCounts/councils/${council.toLowerCase()}`);
      const snapshot = await get(councilRef);
      return snapshot.exists() ? snapshot.val() : 0;
    } catch (error) {
      console.error('Error getting council print count:', error);
      return 0;
    }
  },

  /**
   * Get the global print count across all councils
   * @returns The current global print count
   */
  async getGlobalPrintCount(): Promise<number> {
    try {
      const globalRef = ref(realtimeDb, 'printCounts/global');
      const snapshot = await get(globalRef);
      return snapshot.exists() ? snapshot.val() : 0;
    } catch (error) {
      console.error('Error getting global print count:', error);
      return 0;
    }
  },

  /**
   * Increment both council-specific and global print counts
   * @param council The council name
   * @returns An object containing the updated council and global counts
   */
  async incrementPrintCounts(council: string): Promise<{ councilCount: number; globalCount: number }> {
    try {
      const councilRef = ref(realtimeDb, `printCounts/councils/${council.toLowerCase()}`);
      const globalRef = ref(realtimeDb, 'printCounts/global');
      
      // Get current counts first
      const councilSnapshot = await get(councilRef);
      const globalSnapshot = await get(globalRef);
      
      const currentCouncilCount = councilSnapshot.exists() ? councilSnapshot.val() : 0;
      const currentGlobalCount = globalSnapshot.exists() ? globalSnapshot.val() : 0;
      
      // Increment counts
      const newCouncilCount = currentCouncilCount + 1;
      const newGlobalCount = currentGlobalCount + 1;
      
      // Update in database
      await set(councilRef, newCouncilCount);
      await set(globalRef, newGlobalCount);
      
      return {
        councilCount: newCouncilCount,
        globalCount: newGlobalCount
      };
    } catch (error) {
      console.error('Error incrementing print counts:', error);
      return { councilCount: 0, globalCount: 0 };
    }
  }
};
