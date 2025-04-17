import { useState, useCallback, useEffect } from 'react';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  deleteDoc,
  Timestamp,
  writeBatch,
  DocumentData
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore'; // Add this import
import { firestoreService } from '@/services/firebaseService'; // Update this import
import { toast } from 'sonner';
import { FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';

export const useParticipants = () => {
  // Get Firestore instance
  const db = getFirestore();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<ParticipantWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get current date for logic around which day to show/edit
  const currentDate = new Date();
  // IMPORTANT: This would be replaced with real date comparison in production
  // For the prototype, we just enable both days
  const isDay1 = true; // Replace with real date logic later
  const isDay2 = true; // Replace with real date logic later

  // Load participants from Firestore
  useEffect(() => {
    const loadParticipants = async () => {
      setLoading(true);
      try {
        // Create the participants collection reference
        const participantsRef = collection(db, FIRESTORE_COLLECTIONS.participants);
        
        // Build query based on user role
        let participantsQuery;
        if (user?.role === 'chair' && user?.council) {
          // Chair users can only see their council's participants
          participantsQuery = query(participantsRef, where("council", "==", user.council));
        } else {
          // Admin users can see all participants
          participantsQuery = participantsRef;
        }
        
        const snapshot = await getDocs(participantsQuery);
        
        // Transform the data
        const loadedParticipants = snapshot.docs.map(doc => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            name: data.name || '',
            council: data.council || '',
            role: data.role || 'delegate',
            attendance: data.attendance || { day1: 'not-marked', day2: 'not-marked' },
            // Removed email, country, and notes as requested
          } as ParticipantWithAttendance;
        });
        
        setParticipants(loadedParticipants);
        setError(null);
      } catch (err) {
        console.error('Error loading participants:', err);
        setError('Failed to load participants');
        toast.error('Failed to load participants');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadParticipants();
    }
  }, [user]);

  // Add a participant to Firestore
  const addParticipant = useCallback(async (participant: Omit<ParticipantWithAttendance, 'id'>) => {
    try {
      // Add to Firestore
      const participantsRef = collection(db, FIRESTORE_COLLECTIONS.participants);
      const docRef = await addDoc(participantsRef, {
        ...participant,
        createdAt: Timestamp.now(),
        createdBy: user?.id || 'unknown'
      });
      
      // Add to local state
      const newParticipant = {
        ...participant,
        id: docRef.id
      } as ParticipantWithAttendance;
      
      setParticipants(prev => [...prev, newParticipant]);
      
      return docRef.id;
    } catch (err) {
      console.error('Error adding participant:', err);
      toast.error('Failed to add participant');
      throw err;
    }
  }, [user]);

  // Add multiple participants (for CSV import)
  const addMultipleParticipants = useCallback(async (newParticipants: Omit<ParticipantWithAttendance, 'id'>[]) => {
    try {
      const batch = writeBatch(db);
      const participantsRef = collection(db, FIRESTORE_COLLECTIONS.participants);
      
      const addedIds: string[] = [];
      
      // Prepare batch write
      for (const participant of newParticipants) {
        const docRef = doc(participantsRef);
        batch.set(docRef, {
          ...participant,
          createdAt: Timestamp.now(),
          createdBy: user?.id || 'unknown'
        });
        addedIds.push(docRef.id);
      }
      
      // Execute the batch
      await batch.commit();
      
      // Update local state
      const participantsWithIds = newParticipants.map((p, index) => ({
        ...p,
        id: addedIds[index],
      }));
      
      setParticipants(prev => [...prev, ...participantsWithIds as ParticipantWithAttendance[]]);
      
      return addedIds;
    } catch (err) {
      console.error('Error adding multiple participants:', err);
      toast.error('Failed to add participants');
      throw err;
    }
  }, [user]);

  // Update a participant
  const updateParticipant = useCallback(async (id: string, data: Partial<ParticipantWithAttendance>) => {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.participants, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      
      setParticipants(prev => 
        prev.map(p => (p.id === id ? { ...p, ...data } : p))
      );
    } catch (err) {
      console.error('Error updating participant:', err);
      toast.error('Failed to update participant');
      throw err;
    }
  }, []);

  // Delete a participant
  const deleteParticipant = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.participants, id));
      setParticipants(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting participant:', err);
      toast.error('Failed to delete participant');
      throw err;
    }
  }, []);

  // Mark attendance for a single participant
  const markAttendance = useCallback(async (participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.participants, participantId);
      
      // Update in Firestore
      await updateDoc(docRef, {
        [`attendance.${date}`]: status,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setParticipants(prev => 
        prev.map(p => {
          if (p.id === participantId) {
            return {
              ...p,
              attendance: {
                ...p.attendance,
                [date]: status
              }
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error(`Error marking attendance for participant ${participantId}:`, err);
      toast.error('Failed to update attendance');
      throw err;
    }
  }, []);

  // Batch mark attendance for multiple participants
  const batchMarkAttendance = useCallback(async (participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => {
    try {
      const batch = writeBatch(db);
      
      // Prepare batch updates
      participantIds.forEach(id => {
        const docRef = doc(db, FIRESTORE_COLLECTIONS.participants, id);
        batch.update(docRef, {
          [`attendance.${date}`]: status,
          updatedAt: Timestamp.now()
        });
      });
      
      // Execute the batch
      await batch.commit();
      
      // Update local state
      setParticipants(prev => 
        prev.map(p => {
          if (participantIds.includes(p.id)) {
            return {
              ...p,
              attendance: {
                ...p.attendance,
                [date]: status
              }
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error batch marking attendance:', err);
      toast.error('Failed to update attendance');
      throw err;
    }
  }, []);

  return {
    participants,
    loading,
    error,
    isDay1,
    isDay2,
    addParticipant,
    addMultipleParticipants,
    updateParticipant,
    deleteParticipant,
    markAttendance,
    batchMarkAttendance
  };
};
