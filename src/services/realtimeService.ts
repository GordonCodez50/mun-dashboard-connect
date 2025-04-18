
import { getDatabase, ref, set, push } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/config/firebaseConfig';
import { toast } from 'sonner';

const app = initializeApp(firebaseConfig);
const realtimeDb = getDatabase(app);

export const realtimeService = {
  createAlert: async (alertData: {
    type: string;
    council: string;
    message: string;
    chairName: string;
    timestamp: number;
    status: string;
    priority: string;
  }) => {
    try {
      const alertsRef = ref(realtimeDb, 'alerts');
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, alertData);
      return true;
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
      return false;
    }
  },
  
  // New function for sending attendance submission alerts
  createAttendanceSubmissionAlert: async (data: {
    council: string;
    date: string;
    chairName: string;
  }) => {
    try {
      const alertData = {
        type: 'Attendance Submission',
        council: data.council,
        message: `${data.council} has submitted attendance for ${data.date}`,
        chairName: data.chairName,
        timestamp: Date.now(),
        status: 'pending',
        priority: 'normal'
      };
      
      const alertsRef = ref(realtimeDb, 'alerts');
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, alertData);
      console.log('Attendance submission alert created');
      return true;
    } catch (error) {
      console.error('Error creating attendance submission alert:', error);
      return false;
    }
  }
};
