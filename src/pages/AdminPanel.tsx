
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from "sonner";
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { firestoreService } from '@/services/firebaseService';
import { useNotifications } from '@/hooks/useNotifications';
import { BellRing, Settings, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AlertsSection } from '@/components/admin/AlertsSection';
import { CouncilList } from '@/components/admin/CouncilList';
import { Alert } from '@/components/admin/AlertItem';
import { Council } from '@/components/admin/CouncilList';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

const AdminPanel = () => {
  const { user, users } = useAuth();
  const isMobile = useIsMobile();
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
  
  // Notification state
  const { 
    isSupported, 
    permissionGranted, 
    requestPermission, 
    permissionError,
    isAndroid,
    getSettingsInstructions
  } = useNotifications();
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Use Firebase Realtime Database for alerts
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  
  // Initialize sound hook
  useAlertsSound(liveAlerts, alertsMuted);
  
  // Check if we should show the notification permission prompt
  useEffect(() => {
    if (isSupported && !permissionGranted) {
      setShowPermissionPrompt(true);
    } else {
      setShowPermissionPrompt(false);
    }
  }, [isSupported, permissionGranted]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('hideResolvedAlerts', JSON.stringify(hideResolved));
  }, [hideResolved]);

  useEffect(() => {
    localStorage.setItem('alertsMuted', JSON.stringify(alertsMuted));
  }, [alertsMuted]);

  // Close dialog when permission is granted
  useEffect(() => {
    if (permissionGranted && showPermissionDialog) {
      setShowPermissionDialog(false);
    }
  }, [permissionGranted]);

  // Handle permission request click
  const handleRequestPermission = async () => {
    const result = await requestPermission();
    
    // If on Android and permission denied, show instructions dialog
    if (!result && isAndroid) {
      setShowPermissionDialog(true);
    }
  };

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
      const processedAlerts = alertsData
        .filter(alert => alert && alert.id) // Filter out invalid alerts
        .map(alert => ({
          id: alert.id,
          council: alert.council || "Unknown Council",
          chairName: alert.chairName || "Unknown Chair",
          type: alert.type || "Unspecified Alert",
          message: alert.message || "No message provided",
          timestamp: alert.timestamp ? new Date(alert.timestamp) : new Date(),
          status: alert.status || 'pending',
          priority: alert.priority || 'normal',
          chairReply: alert.chairReply,
          reply: alert.reply,
          replyTimestamp: alert.replyTimestamp,
          replyFrom: alert.replyFrom
        }));
      
      setLiveAlerts(processedAlerts);
      
      // We're removing this section since we now track notifications in useAlertsSound
      // The toast for urgent alerts will still work as it doesn't create browser notifications
      const currentAlertIds = liveAlerts.map(a => a.id);
      const newAlerts = processedAlerts.filter(
        alert => !currentAlertIds.includes(alert.id)
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
    <div className="flex h-full bg-gray-50 overflow-x-hidden">
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 overflow-y-auto w-full">
        <div className={`p-4 ${isMobile ? 'pb-24' : 'p-8'} animate-fade-in`}>
          {showPermissionPrompt && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center">
                  <BellRing className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Enable notifications to receive alerts
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={handleRequestPermission}
                >
                  Enable Notifications
                </Button>
              </div>
              {permissionError && (
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p>{permissionError}</p>
                </div>
              )}
            </div>
          )}
          
          <AdminHeader 
            user={user}
            hideResolved={hideResolved}
            alertsMuted={alertsMuted}
            toggleHideResolved={toggleHideResolved}
            toggleAlertsMute={toggleAlertsMute}
            isMobile={isMobile}
          />
          
          <AlertsSection 
            alerts={liveAlerts}
            hideResolved={hideResolved}
            user={user}
            isMobile={isMobile}
          />
          
          <div>
            <h2 className="text-lg font-medium text-primary mb-4">Council Overview</h2>
            <CouncilList councils={councils} user={user} isMobile={isMobile} />
          </div>
        </div>
      </div>

      {/* Instructions Dialog for Android users */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className={isMobile ? "w-[90%] max-w-md rounded-xl p-0" : ""}>
          <DialogHeader className={isMobile ? "p-4" : ""}>
            <DialogTitle>Enable Notifications</DialogTitle>
            <DialogDescription>
              Your browser requires manual permission for notifications.
            </DialogDescription>
          </DialogHeader>
          
          <div className={`space-y-4 ${isMobile ? "px-4 py-2" : "py-4"}`}>
            <div className="flex items-start gap-4">
              <Settings className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Browser Settings Required</h4>
                <p className="text-sm text-muted-foreground">{getSettingsInstructions()}</p>
              </div>
            </div>
            
            <div className="rounded-md bg-amber-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Important Note</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>After enabling notifications in settings, return to this app and reload the page.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className={isMobile ? "p-4 pt-2" : ""}>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Later
            </Button>
            <Button onClick={() => {
              toast.success("Check browser settings for notifications");
              setShowPermissionDialog(false);
            }}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
