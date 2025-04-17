
import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { ParticipantWithAttendance } from '@/types/attendance';
import { useAuth } from '@/context/AuthContext';
import { FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { useParticipantOperations } from './useParticipantOperations';
import { useAttendanceOperations } from './useAttendanceOperations';
import { transformParticipantData, getCurrentDateInfo } from '@/utils/participantUtils';
import { toast } from 'sonner';

export const useParticipants = () => {
  const db = getFirestore();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<ParticipantWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isDay1, isDay2 } = getCurrentDateInfo();
  const participantOps = useParticipantOperations();
  const attendanceOps = useAttendanceOperations();

  useEffect(() => {
    const loadParticipants = async () => {
      setLoading(true);
      try {
        const participantsRef = collection(db, FIRESTORE_COLLECTIONS.participants);
        let participantsQuery = user?.role === 'chair' && user?.council
          ? query(participantsRef, where("council", "==", user.council))
          : participantsRef;
        
        const snapshot = await getDocs(participantsQuery);
        const loadedParticipants = snapshot.docs.map(transformParticipantData);
        
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

  const addParticipant = async (participant: Omit<ParticipantWithAttendance, 'id'>) => {
    const id = await participantOps.addParticipant(participant);
    const newParticipant = { ...participant, id } as ParticipantWithAttendance;
    setParticipants(prev => [...prev, newParticipant]);
    return id;
  };

  const addMultipleParticipants = async (newParticipants: Omit<ParticipantWithAttendance, 'id'>[]) => {
    const ids = await participantOps.addMultipleParticipants(newParticipants);
    const participantsWithIds = newParticipants.map((p, index) => ({
      ...p,
      id: ids[index],
    }));
    setParticipants(prev => [...prev, ...participantsWithIds as ParticipantWithAttendance[]]);
    return ids;
  };

  const updateParticipant = async (id: string, data: Partial<ParticipantWithAttendance>) => {
    await participantOps.updateParticipant(id, data);
    setParticipants(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)));
  };

  const deleteParticipant = async (id: string) => {
    await participantOps.deleteParticipant(id);
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const markAttendance = async (participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => {
    await attendanceOps.markAttendance(participantId, date, status);
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
  };

  const batchMarkAttendance = async (participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => {
    await attendanceOps.batchMarkAttendance(participantIds, date, status);
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
  };

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
