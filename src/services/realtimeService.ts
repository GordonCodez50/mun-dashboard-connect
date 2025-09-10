import { getDatabase, ref, set, push, onChildAdded, onValue, serverTimestamp } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/config/firebaseConfig';
import { toast } from 'sonner';
import { notificationService } from '@/services/notificationService';

const app = initializeApp(firebaseConfig);
const realtimeDb = getDatabase(app);

// Track if we've already set up listeners
let listenersInitialized = false;
let alertListenersActive = false;
let recentAlerts = new Set(); // To track recently processed alerts and prevent duplicates

// Initialize global realtime alert listeners
const initializeAlertListeners = () => {
  if (listenersInitialized) {
    console.log('Alert listeners already initialized, skipping');
    return;
  }
  
  console.log('Initializing global realtime alert listeners');
  
  const alertsRef = ref(realtimeDb, 'alerts');
  
  try {
    // Listen for new alerts
    const unsubscribe = onChildAdded(alertsRef, (snapshot) => {
      const alert = snapshot.val();
      if (!alert) return;
      
      // Filter out invalid alerts with undefined values or demo/test alerts
      if (!alert.type || !alert.council || !alert.message || 
          alert.type === 'undefined' || alert.council === 'undefined' || 
          alert.message === 'undefined' || alert.type.toString() === 'undefined' || 
          alert.council.toString() === 'undefined' || alert.message.toString() === 'undefined' ||
          alert.message === 'Demo alert message' || alert.type === 'demo' ||
          alert.chairName === 'undefined by undefined' || alert.chairName === 'undefined' ||
          !alert.chairName || alert.chairName.includes('undefined')) {
        console.log('Filtered out invalid/demo alert:', alert);
        return;
      }
      
      // Get alert ID from snapshot
      const alertId = snapshot.key;
      
      // Check if we've already processed this alert in this session
      if (recentAlerts.has(alertId)) {
        console.log('Already processed this alert, skipping notification:', alertId);
        return;
      }
      
      // Only show notification for new alerts (within last 30 seconds to account for page loads)
      const now = Date.now();
      const alertTime = alert.timestamp || now;
      const isRecent = (now - alertTime) < 30000; // 30 seconds
      
      if (isRecent) {
        console.log('New alert detected in realtime:', alert);
        
        // Add to our processed alerts set
        recentAlerts.add(alertId);
        
        // Keep set size manageable
        if (recentAlerts.size > 100) {
          // Remove oldest entries (convert to array, slice, convert back to set)
          recentAlerts = new Set([...recentAlerts].slice(-50));
        }
        
        // Show notification regardless of current page
        const isUrgent = alert.priority === 'urgent';
        
        // Pass complete alert data to notification for accurate redirects
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
    
    // Mark as initialized
    listenersInitialized = true;
    alertListenersActive = true;
    
    // Log success
    console.log('Alert listeners initialized successfully');
    
    // Attach the unsubscribe function to window for cleanup if needed
    (window as any).__alertListenerCleanup = unsubscribe;
    
    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up alert listeners:', error);
    return () => {}; // Return empty function in case of error
  }
};

// Check if listeners are active
const areAlertListenersActive = () => {
  return alertListenersActive;
};

// Force reinitialize listeners (useful if they disconnect)
const reinitializeAlertListeners = () => {
  if (typeof (window as any).__alertListenerCleanup === 'function') {
    (window as any).__alertListenerCleanup();
  }
  listenersInitialized = false;
  alertListenersActive = false;
  return initializeAlertListeners();
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
    room_no?: string;
    floor_no?: string;
  }) => {
    try {
      // Filter out undefined values to prevent Firebase errors
      const cleanAlertData = Object.fromEntries(
        Object.entries(alertData).filter(([_, value]) => value !== undefined)
      );
      
      // Ensure timestamp is set
      if (!cleanAlertData.timestamp) {
        cleanAlertData.timestamp = Date.now();
      }
      
      // Set defaults for status and priority if not provided
      if (!cleanAlertData.status) {
        cleanAlertData.status = 'pending';
      }
      
      if (!cleanAlertData.priority) {
        cleanAlertData.priority = cleanAlertData.type === 'Security' ? 'urgent' : 'normal';
      }
      
      const alertsRef = ref(realtimeDb, 'alerts');
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, cleanAlertData);
      
      console.log('Alert created successfully:', cleanAlertData);
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
  
  // Update alert status
  updateAlertStatus: async (alertId: string, status: string, additionalData?: any) => {
    try {
      const alertRef = ref(realtimeDb, `alerts/${alertId}`);
      const updateData = {
        status,
        lastUpdated: Date.now(),
        ...(additionalData || {})
      };
      
      await set(alertRef, updateData);
      console.log(`Alert ${alertId} status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating alert status:', error);
      return false;
    }
  },
  
  // Listen for specific alert updates
  onAlertStatusUpdates: (callback: (data: any) => void) => {
    const alertsRef = ref(realtimeDb, 'alerts');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    return unsubscribe;
  },
  
  // Listen for new alerts
  onNewAlert: (callback: (data: any) => void) => {
    const alertsRef = ref(realtimeDb, 'alerts');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    return unsubscribe;
  },
  
  // Timer synchronization
  updateTimer: async (timerId: string, timerData: any) => {
    try {
      const timerRef = ref(realtimeDb, `timers/${timerId}`);
      await set(timerRef, {
        ...timerData,
        lastUpdated: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating timer:', error);
      return false;
    }
  },
  
  // Listen for timer updates
  onTimerSync: (timerId: string, callback: (data: any) => void) => {
    const timerRef = ref(realtimeDb, `timers/${timerId}`);
    const unsubscribe = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });
    
    return unsubscribe;
  },
  
  // Add this new function to the exported service
  initializeAlertListeners,
  areAlertListenersActive,
  reinitializeAlertListeners
};
