
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
  const day = currentDate.getDate();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Check if it's March 16th or 17th, 2024
  // This is only used to set the default selected date
  return {
    isDay1: day === 16 && month === 2 && year === 2024, // March is 2 (0-based)
    isDay2: day === 17 && month === 2 && year === 2024
  };
};

// Always allow editing for both days
export const canEditDate = (date: 'day1' | 'day2'): boolean => {
  // Always return true to ensure editing is always enabled
  return true;
};
