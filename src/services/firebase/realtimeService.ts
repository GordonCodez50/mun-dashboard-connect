
import { 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  update 
} from 'firebase/database';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { realtimeDb, firestore } from './index';
import { FIREBASE_CONFIG, FIRESTORE_COLLECTIONS } from '@/config/firebaseConfig';
import { User } from '@/types/auth';
import { toast } from 'sonner';

// Realtime Database service (replaces WebSocket)
export const realtimeService = {
  // Listen for new alerts
  onNewAlert: (callback: (alert: any) => void) => {
    const alertsRef = ref(realtimeDb, 'alerts');
    onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array
        const alerts = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as any)
        }));
        callback(alerts);
      } else {
        callback([]);
      }
    });
    
    // Return unsubscribe function
    return () => off(alertsRef);
  },
  
  // Listen for alert status updates
  onAlertStatusUpdates: (callback: (alerts: any) => void) => {
    const alertsRef = ref(realtimeDb, 'alerts');
    onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || {});
    });
    
    // Return unsubscribe function
    return () => off(alertsRef);
  },
  
  // Create a new alert
  createAlert: async (alertData: any) => {
    try {
      const alertsRef = ref(realtimeDb, 'alerts');
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        ...alertData,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      return true;
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
      return false;
    }
  },
  
  // Update alert status
  updateAlertStatus: async (alertId: string, status: string, additionalData: any = {}) => {
    try {
      const alertRef = ref(realtimeDb, `alerts/${alertId}`);
      await update(alertRef, {
        status,
        updatedAt: Date.now(),
        ...additionalData
      });
      
      return true;
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast.error('Failed to update alert status');
      return false;
    }
  },
  
  // Timer sync
  onTimerSync: (timerId: string, callback: (data: any) => void) => {
    const timerRef = ref(realtimeDb, `timers/${timerId}`);
    onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
    
    // Return unsubscribe function
    return () => off(timerRef);
  },
  
  // Update timer
  updateTimer: async (timerId: string, timerData: any) => {
    try {
      const timerRef = ref(realtimeDb, `timers/${timerId}`);
      await set(timerRef, {
        ...timerData,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating timer:', error);
      toast.error('Failed to update timer');
      return false;
    }
  },
  
  // Add this new method for direct messages
  createDirectMessage: async (messageData: any): Promise<boolean> => {
    try {
      const alertsRef = ref(realtimeDb, 'alerts');
      const newMessageRef = push(alertsRef);
      await set(newMessageRef, {
        ...messageData,
        type: 'Message from Admin',
        id: newMessageRef.key,
        timestamp: Date.now(),
        status: 'pending'
      });
      
      console.log('Direct message sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending direct message:', error);
      return false;
    }
  },
  
  // New method to get all press members
  getPressMembers: async (): Promise<User[]> => {
    if (FIREBASE_CONFIG.demoMode) {
      // Return demo press members
      return [
        {
          id: 'press1',
          username: 'Press1',
          name: 'Press Team 1',
          role: 'press',
          council: 'PRESS',
          email: 'press1@isbmun.com',
          createdAt: new Date()
        },
        {
          id: 'press2',
          username: 'Press2',
          name: 'Press Team 2',
          role: 'press',
          council: 'PRESS',
          email: 'press2@isbmun.com',
          createdAt: new Date()
        }
      ];
    }
    
    try {
      const usersRef = collection(firestore, FIRESTORE_COLLECTIONS.users);
      const q = query(usersRef, where("role", "==", "press"));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username,
          name: data.name,
          role: data.role,
          council: data.council,
          email: data.email,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          lastLogin: data.lastLogin ? (data.lastLogin as Timestamp).toDate() : undefined
        };
      });
    } catch (error) {
      console.error('Error getting press members:', error);
      return [];
    }
  },
  
  // New method to send a message to all press members
  sendMessageToAllPress: async (message: string, adminName: string, adminId: string): Promise<boolean> => {
    try {
      const alertsRef = ref(realtimeDb, 'alerts');
      const newMessageRef = push(alertsRef);
      await set(newMessageRef, {
        type: 'ALL_PRESS_MESSAGE',
        message: message,
        council: 'PRESS',
        chairName: 'All Press Members',
        councilId: 'press-all',
        admin: adminName || 'Admin',
        adminId: adminId,
        timestamp: Date.now(),
        priority: 'normal',
        status: 'pending'
      });
      
      return true;
    } catch (error) {
      console.error('Error sending message to all press:', error);
      return false;
    }
  }
};
