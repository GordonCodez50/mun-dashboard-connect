
import { useCallback } from 'react';
import { getFirestore, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { AttendanceStatus } from '@/types/attendance';
import { FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { toast } from 'sonner';

export const useAttendanceOperations = () => {
  const db = getFirestore();

  const markAttendance = useCallback(async (participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.participants, participantId);
      await updateDoc(docRef, {
        [`attendance.${date}`]: status,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error(`Error marking attendance for participant ${participantId}:`, err);
      toast.error('Failed to update attendance');
      throw err;
    }
  }, []);

  const batchMarkAttendance = useCallback(async (participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => {
    try {
      const batch = writeBatch(db);
      
      participantIds.forEach(id => {
        const docRef = doc(db, FIRESTORE_COLLECTIONS.participants, id);
        batch.update(docRef, {
          [`attendance.${date}`]: status,
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
    } catch (err) {
      console.error('Error batch marking attendance:', err);
      toast.error('Failed to update attendance');
      throw err;
    }
  }, []);

  return {
    markAttendance,
    batchMarkAttendance
  };
};
