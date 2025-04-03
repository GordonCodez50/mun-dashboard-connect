
import { ref, set, push } from 'firebase/database';
import { realtimeDb } from './index';
import { FIREBASE_CONFIG } from '@/config/firebaseConfig';

// Initialize data for demo mode
export const initializeDemoData = async () => {
  if (FIREBASE_CONFIG.demoMode) {
    console.log('Initializing demo data...');
    
    // Set up demo alerts
    const alertTypes = ['IT Support', 'Mic Issue', 'Security', 'Break'];
    const demoCouncils = ['ECOSOC', 'UNHRC', 'UNSC', 'SPECPOL', 'DISEC'];
    
    const alertsRef = ref(realtimeDb, 'alerts');
    
    for (let i = 0; i < 3; i++) {
      const randomCouncil = Math.floor(Math.random() * demoCouncils.length);
      const newAlertRef = push(alertsRef);
      await set(newAlertRef, {
        council: demoCouncils[randomCouncil],
        chairName: `${demoCouncils[randomCouncil]} Chair`,
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        message: 'Demo alert message',
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        status: Math.random() > 0.5 ? 'pending' : 'resolved',
        priority: Math.random() > 0.7 ? 'urgent' : 'normal'
      });
    }
    
    console.log('Demo data initialized');
  }
};

// Initialize Firebase
export const initializeFirebase = async () => {
  try {
    // No need to check if Firebase is already initialized since this happens in index.ts
    console.log('Firebase initialized successfully');
    
    // Initialize demo data if in demo mode
    if (FIREBASE_CONFIG.demoMode) {
      await initializeDemoData();
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
};
