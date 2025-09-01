import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogisticsLayout } from '@/components/layout/LogisticsLayout';
import { SEOHead } from '@/components/SEOHead';
import { toast } from "sonner";
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  BellRing, 
  Settings, 
  AlertTriangle,
  Filter,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { AlertItem } from '@/components/admin/AlertItem';
import { LogisticsMessaging } from '@/components/logistics/LogisticsMessaging';

// Define Alert interface to match the application structure
interface Alert {
  id: string;
  council: string;
  chairName: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  priority: 'normal' | 'urgent';
  chairReply?: string;
  reply?: string;
  replyTimestamp?: string;
  replyFrom?: 'admin' | 'chair' | 'press' | 'logistics';
  room_no?: string;
  floor_no?: string;
}

const LogisticsDashboard = () => {
  const { user } = useAuth();
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [hideResolved, setHideResolved] = useState<boolean>(() => {
    const savedPreference = localStorage.getItem('logistics_hideResolvedAlerts');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  const [alertsMuted, setAlertsMuted] = useState(() => {
    const savedMuted = localStorage.getItem('logistics_alertsMuted');
    return savedMuted ? JSON.parse(savedMuted) : false;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
    localStorage.setItem('logistics_hideResolvedAlerts', JSON.stringify(hideResolved));
  }, [hideResolved]);

  useEffect(() => {
    localStorage.setItem('logistics_alertsMuted', JSON.stringify(alertsMuted));
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
    
    if (!result && isAndroid) {
      setShowPermissionDialog(true);
    }
  };

  // Process alert data from Firebase
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      const processedAlerts = alertsData
        .filter(alert => {
          if (!alert || !alert.id) return false;
          
          // Show alerts relevant to logistics:
          const isFromAdmin = alert.senderRole === 'admin' || alert.admin;
          const isLogisticsSpecific = alert.type?.toLowerCase().includes('logistics') || 
                                     alert.message?.toLowerCase().includes('logistics') ||
                                     alert.targetRole === 'logistics' ||
                                     alert.council === 'LOGISTICS' ||
                                     alert.isLogistics === true;
          
          // Handle broadcast messages - check if it's targeted to everyone or logistics
          const isBroadcastToEveryone = alert.type === 'BROADCAST_MESSAGE' && 
                                       (alert.broadcastTarget === 'everyone' || !alert.broadcastTarget);
          const isBroadcastToLogistics = alert.type === 'BROADCAST_MESSAGE' && 
                                        alert.broadcastTarget === 'logistics';
          
          // Handle personal messages targeted to specific logistics user
          const isPersonalMessage = alert.targetUser === user?.id;
          
          // Handle logistics team internal messages (both old alert-based and new direct message-based)
          const isLogisticsInternalMessage = (alert.type === 'Logistics Direct Message' && alert.targetUser === user?.id) ||
                                           (alert.type === 'DirectMessage' && alert.recipientId === user?.id && alert.senderRole === 'logistics') ||
                                           (alert.type === 'DirectMessage' && alert.senderId === user?.id && alert.recipientRole === 'logistics');
          
          console.log('Logistics dashboard filtering:', {
            alertId: alert.id,
            alertType: alert.type,
            targetUser: alert.targetUser,
            recipientId: alert.recipientId,
            senderId: alert.senderId,
            senderRole: alert.senderRole,
            recipientRole: alert.recipientRole,
            currentUserId: user?.id,
            isPersonalMessage,
            isLogisticsInternalMessage,
            shouldShow: isFromAdmin || isLogisticsSpecific || isBroadcastToEveryone || 
                       isBroadcastToLogistics || isPersonalMessage || isLogisticsInternalMessage
          });
          
          return isFromAdmin || isLogisticsSpecific || isBroadcastToEveryone || 
                 isBroadcastToLogistics || isPersonalMessage || isLogisticsInternalMessage;
        })
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
          replyFrom: alert.replyFrom,
          room_no: alert.room_no,
          floor_no: alert.floor_no
        }));
      
      setLiveAlerts(processedAlerts);
      
      // Show toast for urgent alerts
      const currentAlertIds = liveAlerts.map(a => a.id);
      const newAlerts = processedAlerts.filter(
        alert => !currentAlertIds.includes(alert.id)
      );
      
      if (newAlerts.length > 0) {
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Add a small delay to show the refresh animation
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Data refreshed');
    }, 1000);
  };

  // Filter alerts based on preferences
  const filteredAlerts = hideResolved 
    ? liveAlerts.filter(alert => alert.status !== 'resolved')
    : liveAlerts;

  // Calculate stats
  const pendingAlerts = liveAlerts.filter(alert => alert.status === 'pending').length;
  const urgentAlerts = liveAlerts.filter(alert => alert.priority === 'urgent' && alert.status !== 'resolved').length;
  const totalAlerts = liveAlerts.length;

  return (
    <>
      <SEOHead 
        title="Logistics Dashboard"
        description="Real-time logistics dashboard for BMUNIS conference. Monitor alerts, track council activities, and manage logistics operations efficiently."
        canonicalUrl="/logistics-dashboard"
      />
      
      <LogisticsLayout activeItem="dashboard">
        <div className="space-y-6">
          {/* Notification Permission Prompt */}
          {showPermissionPrompt && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center">
                    <BellRing className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Enable notifications to receive alerts
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200"
                    onClick={handleRequestPermission}
                  >
                    Enable Notifications
                  </Button>
                </div>
                {permissionError && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p>{permissionError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Logistics Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name || 'Logistics Team'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleHideResolved}
                className="gap-2"
              >
                {hideResolved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {hideResolved ? 'Show All' : 'Hide Resolved'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAlertsMute}
                className="gap-2"
              >
                {alertsMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {alertsMuted ? 'Unmute' : 'Mute'}
              </Button>
            </div>
          </div>

          {/* Messaging Section */}
          <LogisticsMessaging user={user} />

          {/* Alerts Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Live Alerts
                </CardTitle>
                <Badge variant="outline">
                  {filteredAlerts.length} alerts
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No alerts found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {hideResolved 
                      ? "All alerts are resolved. Toggle 'Show All' to see resolved alerts."
                      : "No alerts have been received yet."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts
                    .sort((a, b) => {
                      // Sort by priority first (urgent first), then by timestamp (newest first)
                      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
                      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
                      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                    })
                    .map((alert) => (
                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        user={user}
                      />
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions Dialog for Android users */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="w-[90%] max-w-md rounded-xl">
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
              
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Important Note</h3>
                    <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      <p>After enabling notifications in settings, return to this app and reload the page.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
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
      </LogisticsLayout>
    </>
  );
};

export default LogisticsDashboard;