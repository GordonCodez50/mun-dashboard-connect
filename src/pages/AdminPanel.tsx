
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from "sonner";
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { firestoreService } from '@/services/firebase';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AlertsSection } from '@/components/admin/AlertsSection';
import { CouncilList } from '@/components/admin/CouncilList';
import { Alert } from '@/components/admin/AlertItem';
import { Council } from '@/components/admin/CouncilList';
import { useAlertsSound } from '@/hooks/useAlertsSound';

const AdminPanel = () => {
  const { user } = useAuth();
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
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  
  // Initialize sound hook
  useAlertsSound(liveAlerts, alertsMuted);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('hideResolvedAlerts', JSON.stringify(hideResolved));
  }, [hideResolved]);

  useEffect(() => {
    localStorage.setItem('alertsMuted', JSON.stringify(alertsMuted));
  }, [alertsMuted]);

  // Load councils from Firestore
  useEffect(() => {
    const loadCouncils = async () => {
      try {
        const councilsData = await firestoreService.getCouncils();
        const formattedCouncils = councilsData.map(council => ({
          id: council.id,
          name: council.name,
          chairName: `${council.name} Chair`,
          lastUpdate: new Date()
        }));
        setCouncils(formattedCouncils);
      } catch (error) {
        console.error('Error loading councils:', error);
        toast.error('Failed to load councils');
      }
    };
    
    loadCouncils();
  }, []);

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
