
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from "sonner";
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { firestoreService } from '@/services/firebaseService';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AlertsSection } from '@/components/admin/AlertsSection';
import { CouncilList } from '@/components/admin/CouncilList';
import { Alert } from '@/components/admin/AlertItem';
import { Council } from '@/components/admin/CouncilList';
import { useAlertsSound } from '@/hooks/useAlertsSound';

const AdminPanel = () => {
  const { user, users } = useAuth();
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [hideResolved, setHideResolved] = useState<boolean>(() => {
    // Initialize from localStorage if available
    const savedPreference = localStorage.getItem('hideResolvedAlerts');
    return savedPreference ? JSON.parse(savedPreference) : false;
  });
  const [councils, setCouncils] = useState<Council[]>([]);
  const [alertsMuted, setAlertsMuted] = useState(() => {
    // Also persist the alerts muted preference
    const savedMuted = localStorage.getItem('alertsMuted');
    return savedMuted ? JSON.parse(savedMuted) : false;
  });

  // Use Firebase Realtime Database for alerts
  const { data: alertsData, sendMessage: updateAlertInFirebase } = useFirebaseRealtime<any[]>('NEW_ALERT');
  
  // Initialize sound hook
  useAlertsSound(liveAlerts, alertsMuted);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('hideResolvedAlerts', JSON.stringify(hideResolved));
  }, [hideResolved]);

  useEffect(() => {
    localStorage.setItem('alertsMuted', JSON.stringify(alertsMuted));
  }, [alertsMuted]);

  // Load councils from Firestore and match with chair users
  useEffect(() => {
    const loadCouncils = async () => {
      try {
        // First get all council data
        const councilsData = await firestoreService.getCouncils();
        
        // Get chair users to match with councils
        const chairUsers = users.filter(u => u.role === 'chair' && u.council && u.council !== 'PRESS');
        
        // Map councils with their chair information
        const formattedCouncils = councilsData.map(council => {
          // Find the chair for this council
          const chairUser = chairUsers.find(user => user.council === council.name);
          
          return {
            id: council.id,
            name: council.name,
            chairName: chairUser ? chairUser.name : `${council.name} Chair`,
            lastUpdate: new Date()
          };
        });
        
        // Add any councils that exist in user records but not in council collection
        const existingCouncilNames = formattedCouncils.map(c => c.name);
        const missedChairUsers = chairUsers.filter(user => !existingCouncilNames.includes(user.council || ''));
        
        const additionalCouncils = missedChairUsers.map(chairUser => ({
          id: chairUser.id,
          name: chairUser.council || '',
          chairName: chairUser.name,
          lastUpdate: new Date()
        }));
        
        setCouncils([...formattedCouncils, ...additionalCouncils]);
      } catch (error) {
        console.error('Error loading councils:', error);
        toast.error('Failed to load councils');
      }
    };
    
    if (users.length > 0) {
      loadCouncils();
    }
  }, [users]);

  // Process alert data from Firebase
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      const processedAlerts = alertsData.map(alert => ({
        ...alert,
        timestamp: alert.timestamp ? new Date(alert.timestamp) : new Date(),
      }));
      
      setLiveAlerts(processedAlerts);
      
      // Show toast for urgent alerts that are new
      const newAlerts = processedAlerts.filter(
        alert => !liveAlerts.some(a => a.id === alert.id)
      );
      
      if (newAlerts.length > 0) {
        // Show toast for urgent alerts
        const newUrgentAlerts = newAlerts.filter(alert => alert.priority === 'urgent');
        if (newUrgentAlerts.length > 0) {
          newUrgentAlerts.forEach(alert => {
            toast.info(`New urgent alert from ${alert.council}: ${alert.type}`, {
              description: alert.message,
              duration: 5000
            });
          });
        }
      }
    }
  }, [alertsData, liveAlerts]);

  const toggleAlertsMute = () => {
    setAlertsMuted(!alertsMuted);
    toast.success(alertsMuted ? 'Alerts unmuted' : 'Alerts muted');
  };

  const toggleHideResolved = () => {
    setHideResolved(!hideResolved);
    toast.success(hideResolved ? 'Showing all alerts' : 'Hiding resolved alerts');
  };

  // New function to resolve all alerts
  const resolveAllAlerts = async () => {
    const pendingAlerts = liveAlerts.filter(alert => alert.status !== 'resolved');
    
    if (pendingAlerts.length === 0) {
      toast.info('No pending alerts to resolve');
      return;
    }
    
    // Show confirmation toast
    toast.info(`Resolving ${pendingAlerts.length} alert${pendingAlerts.length > 1 ? 's' : ''}...`);
    
    try {
      // Update each alert in Firebase
      const updatePromises = pendingAlerts.map(alert => {
        return updateAlertInFirebase({
          id: alert.id,
          status: 'resolved',
          resolvedBy: user?.name || 'Admin',
          resolvedAt: Date.now()
        });
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      toast.success(`Successfully resolved ${pendingAlerts.length} alert${pendingAlerts.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error resolving all alerts:', error);
      toast.error('Failed to resolve all alerts');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <AdminHeader 
            user={user}
            hideResolved={hideResolved}
            alertsMuted={alertsMuted}
            toggleHideResolved={toggleHideResolved}
            toggleAlertsMute={toggleAlertsMute}
            resolveAllAlerts={resolveAllAlerts}
          />
          
          <AlertsSection 
            alerts={liveAlerts}
            hideResolved={hideResolved}
            user={user}
          />
          
          <div>
            <h2 className="text-lg font-medium text-primary mb-4">Council Overview</h2>
            <CouncilList councils={councils} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
