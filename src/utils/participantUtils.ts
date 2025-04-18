
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
  return {
    isDay1: day === 16 && month === 2 && year === 2024, // March is 2 (0-based)
    isDay2: day === 17 && month === 2 && year === 2024
  };
};

// Always allow editing - we'll use this just to determine which day to show by default
export const canEditDate = (date: 'day1' | 'day2'): boolean => {
  return true;
};
