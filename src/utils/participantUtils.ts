
import { Timestamp, DocumentData } from 'firebase/firestore';
import { ParticipantWithAttendance } from '@/types/attendance';

export const transformParticipantData = (doc: DocumentData): ParticipantWithAttendance => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    council: data.council || '',
    role: data.role || 'delegate',
    attendance: data.attendance || { day1: 'not-marked', day2: 'not-marked' }
  };
};

export const getCurrentDateInfo = () => {
  const currentDate = new Date();
  // IMPORTANT: This would be replaced with real date comparison in production
  // For the prototype, we just enable both days
  return {
    isDay1: true,
    isDay2: true
  };
};
