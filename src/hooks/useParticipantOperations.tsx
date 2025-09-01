
import { useCallback } from 'react';
import { getFirestore, doc, addDoc, updateDoc, deleteDoc, collection, Timestamp, writeBatch } from 'firebase/firestore';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const useParticipantOperations = () => {
  const db = getFirestore();
  const { user } = useAuth();

  const addParticipant = useCallback(async (participant: Omit<ParticipantWithAttendance, 'id'>) => {
    try {
      const participantsRef = collection(db, FIRESTORE_COLLECTIONS.participants);
      const docRef = await addDoc(participantsRef, {
        ...participant,
        createdAt: Timestamp.now(),
        createdBy: user?.id || 'unknown'
      });
      
      return docRef.id;
    } catch (err) {
      console.error('Error adding participant:', err);
      toast.error('Failed to add participant');
      throw err;
    }
  }, [user]);

  const addMultipleParticipants = useCallback(async (newParticipants: Omit<ParticipantWithAttendance, 'id'>[]) => {
    try {
      const batch = writeBatch(db);
      const participantsRef = collection(db, FIRESTORE_COLLECTIONS.participants);
      
      const addedIds: string[] = [];
      
      for (const participant of newParticipants) {
        const docRef = doc(participantsRef);
        batch.set(docRef, {
          ...participant,
          createdAt: Timestamp.now(),
          createdBy: user?.id || 'unknown'
        });
        addedIds.push(docRef.id);
      }
      
      await batch.commit();
      return addedIds;
    } catch (err) {
      console.error('Error adding multiple participants:', err);
      toast.error('Failed to add participants');
      throw err;
    }
  }, [user]);

  const updateParticipant = useCallback(async (id: string, data: Partial<ParticipantWithAttendance>) => {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.participants, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error('Error updating participant:', err);
      toast.error('Failed to update participant');
      throw err;
    }
  }, []);

  const deleteParticipant = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.participants, id));
    } catch (err) {
      console.error('Error deleting participant:', err);
      toast.error('Failed to delete participant');
      throw err;
    }
  }, []);

  return {
    addParticipant,
    addMultipleParticipants,
    updateParticipant,
    deleteParticipant
  };
};
