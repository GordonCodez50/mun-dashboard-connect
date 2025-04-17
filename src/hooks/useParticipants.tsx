
import { useState, useCallback, useEffect } from 'react';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { useAuth } from '@/context/AuthContext';

// Mock data - will be replaced with Firebase later
const mockParticipants: ParticipantWithAttendance[] = [
  {
    id: '1',
    name: 'John Doe',
    council: 'UNSC',
    role: 'delegate',
    country: 'United States',
    attendance: { day1: 'present', day2: 'not-marked' }
  },
  {
    id: '2',
    name: 'Jane Smith',
    council: 'UNSC',
    role: 'delegate',
    country: 'United Kingdom',
    attendance: { day1: 'present', day2: 'not-marked' }
  },
  {
    id: '3',
    name: 'Ahmed Hassan',
    council: 'UNHRC',
    role: 'delegate',
    country: 'Egypt',
    attendance: { day1: 'absent', day2: 'not-marked' }
  },
  {
    id: '4',
    name: 'Sofia Garcia',
    council: 'UNHRC',
    role: 'delegate',
    country: 'Spain',
    attendance: { day1: 'excused', day2: 'not-marked' }
  },
  {
    id: '5',
    name: 'Mei Ling',
    council: 'UNEP',
    role: 'delegate',
    country: 'China',
    attendance: { day1: 'late', day2: 'not-marked' }
  },
  {
    id: '6',
    name: 'David Kim',
    council: 'UNEP',
    role: 'chair',
    attendance: { day1: 'present', day2: 'not-marked' }
  }
];

export const useParticipants = () => {
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

  // Filter participants by council (for chairs)
  useEffect(() => {
    setLoading(true);
    try {
      // In a real implementation, this would be a Firebase query
      let filteredParticipants = [...mockParticipants];
      
      // If the user is a chair, only show their council
      if (user?.role === 'chair' && user?.council) {
        filteredParticipants = filteredParticipants.filter(
          p => p.council === user.council
        );
      }
      
      setParticipants(filteredParticipants);
      setError(null);
    } catch (err) {
      console.error('Error loading participants:', err);
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a participant
  const addParticipant = useCallback((participant: Omit<ParticipantWithAttendance, 'id'>) => {
    const newParticipant = {
      ...participant,
      id: Date.now().toString(),
    };
    
    setParticipants(prev => [...prev, newParticipant as ParticipantWithAttendance]);
    return newParticipant.id;
  }, []);

  // Add multiple participants (for CSV import)
  const addMultipleParticipants = useCallback((newParticipants: Omit<ParticipantWithAttendance, 'id'>[]) => {
    const participantsWithIds = newParticipants.map(p => ({
      ...p,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
    }));
    
    setParticipants(prev => [...prev, ...participantsWithIds as ParticipantWithAttendance[]]);
    return participantsWithIds.map(p => p.id);
  }, []);

  // Update a participant
  const updateParticipant = useCallback((id: string, data: Partial<ParticipantWithAttendance>) => {
    setParticipants(prev => 
      prev.map(p => (p.id === id ? { ...p, ...data } : p))
    );
  }, []);

  // Delete a participant
  const deleteParticipant = useCallback((id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  }, []);

  // Mark attendance for a single participant
  const markAttendance = useCallback((participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => {
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
  }, []);

  // Batch mark attendance for multiple participants
  const batchMarkAttendance = useCallback((participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => {
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
