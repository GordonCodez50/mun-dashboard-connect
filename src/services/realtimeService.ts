
import { getDatabase, ref, set, push, onChildAdded } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/config/firebaseConfig';
import { toast } from 'sonner';
import { notificationService } from '@/services/notificationService';

const app = initializeApp(firebaseConfig);
const realtimeDb = getDatabase(app);

// Track if we've already set up listeners
let listenersInitialized = false;

// Initialize global realtime alert listeners
const initializeAlertListeners = () => {
  if (listenersInitialized) return;
  
  console.log('Initializing global realtime alert listeners');
  
  const alertsRef = ref(realtimeDb, 'alerts');
  onChildAdded(alertsRef, (snapshot) => {
    const alert = snapshot.val();
    if (!alert) return;
    
    // Only show notification for new alerts (within last 10 seconds)
    const now = Date.now();
    const alertTime = alert.timestamp || now;
    const isRecent = (now - alertTime) < 10000; // 10 seconds
    
    if (isRecent) {
      console.log('New alert detected in realtime:', alert);
      
      // Show notification regardless of current page
      const isUrgent = alert.priority === 'urgent';
      notificationService.showAlertNotification(
        alert.type || 'New Alert',
        alert.council || 'Unknown Council',
        alert.message || 'No message provided',
        isUrgent
      );
      
      // Also show a toast
      toast.info(`${isUrgent ? '🚨 URGENT: ' : ''}${alert.type} from ${alert.council}`, {
        description: alert.message,
        duration: 5000
      });
    }
  });
  
  listenersInitialized = true;
};

export const realtimeService = {
  createAlert: async (alertData: {
    type: string;
    council: string;
    message: string;
    chairName: string;
    timestamp?: number;
    status?: string;
    priority?: string;
  }) => {
    try {
      // Ensure timestamp is set
      if (!alertData.timestamp) {
        alertData.timestamp = Date.now();
      }
      
      // Set defaults for status and priority if not provided
      if (!alertData.status) {
        alertData.status = 'pending';
      }
      
      if (!alertData.priority) {
        alertData.priority = alertData.type === 'Security' ? 'urgent' : 'normal';
      }
      
      const alertsRef = ref(realtimeDb, 'alerts');
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, alertData);
      
      console.log('Alert created successfully:', alertData);
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
  },
  
  // Add this new function to the exported service
  initializeAlertListeners
};
