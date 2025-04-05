
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from "sonner";
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { firestoreService } from '@/services/firebaseService';
import { useNotifications } from '@/hooks/useNotifications';
import { BellRing, Settings, AlertTriangle, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { AlertsSection } from '@/components/admin/AlertsSection';
import { CouncilList } from '@/components/admin/CouncilList';
import { Alert } from '@/components/admin/AlertItem';
import { Council } from '@/components/admin/CouncilList';
import { useAlertsSound } from '@/hooks/useAlertsSound';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
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

  // Render mobile or desktop layout based on screen size
  const renderContent = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-8 animate-fade-in space-y-6">
        {showPermissionPrompt && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center">
                <BellRing className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Enable notifications to receive alerts in real-time
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
  );

  // Mobile layout with sheet sidebar
  if (isMobile) {
    return (
      <div className="flex h-screen bg-gray-50 relative">
        {/* Mobile header with menu trigger */}
        <div className="fixed top-0 left-0 right-0 bg-white z-40 border-b border-gray-200 px-4 h-14 flex items-center justify-between">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="font-semibold text-primary">Admin Dashboard</div>
          <div className="w-9"></div> {/* Balance the layout */}
        </div>
        
        {/* Main content with padding for header */}
        <div className="pt-14 w-full h-full overflow-hidden">
          {renderContent()}
        </div>

        {/* Instructions Dialog for Android users */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enable Notifications</DialogTitle>
              <DialogDescription>
                Your browser requires manual permission for notifications.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3">
                <Settings className="h-7 w-7 text-muted-foreground flex-shrink-0 mt-1" />
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
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
                I'll do it later
              </Button>
              <Button onClick={() => {
                toast.success("Check your browser settings to enable notifications");
                setShowPermissionDialog(false);
              }}>
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      {renderContent()}

      {/* Instructions Dialog for Android users */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Notifications</DialogTitle>
            <DialogDescription>
              Your browser requires manual permission for notifications.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              I'll do it later
            </Button>
            <Button onClick={() => {
              toast.success("Check your browser settings to enable notifications");
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
