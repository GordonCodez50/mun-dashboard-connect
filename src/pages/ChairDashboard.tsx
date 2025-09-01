import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import ChairTutorialPopup from '@/components/tutorial/ChairTutorialPopup';
import { AlertButton } from '@/components/ui/AlertButton';
import { QuickTimerWidget } from '@/components/ui/QuickTimerWidget';
import { toast } from "sonner";
import { Wrench, MessagesSquare, Truck, AlertTriangle, Send, MessageSquare, BellRing, Eye, EyeOff } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { ChairMobileNav } from '@/components/layout/ChairMobileNav';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

type Alert = {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  reply?: string;
  admin?: string;
};

const ChairDashboard = () => {
  const isMobile = useIsMobile();
  const { 
    user, 
    showNotificationPrompt, 
    requestNotificationPermission 
  } = useAuth();
  
  const [customAlert, setCustomAlert] = useState('');
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loadingAlert, setLoadingAlert] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [alertsMuted, setAlertsMuted] = useState<boolean>(false);
  const [hideResolved, setHideResolved] = useState<boolean>(() => {
    // Initialize from localStorage if available
    const savedPreference = localStorage.getItem('hideResolvedAlerts');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [isOnCooldown, setIsOnCooldown] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ room_no?: string; floor_no?: string }>({});
  
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  const { data: alertStatusData } = useFirebaseRealtime<any>('ALERT_STATUS_UPDATE');
  const { sendMessage: sendAlert } = useFirebaseRealtime<any>('NEW_ALERT');

  useAlertsSound(recentAlerts, alertsMuted);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    }
  };

  const buttonHoverVariants = {
    hover: { 
      scale: 1.02,
      boxShadow: "0 4px 12px rgba(69, 129, 182, 0.15)",
      transition: { type: "spring", stiffness: 400, damping: 10 } 
    },
    tap: { scale: 0.98 }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  const notificationBellVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.15, 1],
      rotateZ: [0, 15, -15, 0],
      transition: { duration: 1, repeat: Infinity, repeatDelay: 4 }
    }
  };

  const floatingIconVariants = {
    animate: {
      y: [0, -5, 0],
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 1.5
      }
    }
  };

  // Fetch user location data from Supabase
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('room_no, floor_no')
            .eq('id', user.id)
            .single();

          if (profile) {
            setUserLocation({
              room_no: profile.room_no || undefined,
              floor_no: profile.floor_no || undefined
            });
          }
        } catch (error) {
          console.error('Error fetching user location:', error);
        }
      }
    };

    fetchUserLocation();
  }, [user?.id]);

  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      const userAlerts = alertsData
        .filter(alert => alert.council === user?.council || 
                         (alert.type === 'DirectMessage' && alert.toCouncil === user?.council))
        .map(alert => ({
          id: alert.id,
          type: alert.type === 'DirectMessage' ? 'Message from Admin' : alert.type,
          message: alert.message,
          timestamp: alert.timestamp ? new Date(alert.timestamp) : new Date(),
          status: alert.status,
          reply: alert.reply,
          admin: alert.admin
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
      
      setRecentAlerts(userAlerts);
    }
  }, [alertsData, user?.council]);

  useEffect(() => {
    if (alertStatusData) {
      const processedReplies = new Set();
      
      Object.entries(alertStatusData).forEach(([alertId, data]: [string, any]) => {
        if (data.reply && !processedReplies.has(alertId)) {
          const alertExists = recentAlerts.some(alert => alert.id === alertId);
          if (alertExists) {
            toast.info('New reply from admin', {
              description: data.reply,
              duration: 5000
            });
            processedReplies.add(alertId);
          }
        }
      });
    }
  }, [alertStatusData]);

  useEffect(() => {
    if (isOnCooldown) {
      const cooldownTimer = setTimeout(() => {
        setIsOnCooldown(false);
      }, 1000);
      
      return () => clearTimeout(cooldownTimer);
    }
  }, [isOnCooldown]);

  // Save hideResolved preference to localStorage
  useEffect(() => {
    localStorage.setItem('hideResolvedAlerts', JSON.stringify(hideResolved));
  }, [hideResolved]);

  

  const getAlertMessage = (type: string): string => {
    switch (type) {
      case 'IT Support': return 'Technical assistance needed';
      case 'Press & Coverage': return 'Press team or media coverage needed';
      case 'Logistics & Assistance': return 'Logistical assistance required';
      case 'Custom': return customAlert;
      default: return '';
    }
  };

  const handleAlert = async (alertType: string) => {
    if (!user?.council) {
      toast.error('Your council information is missing');
      return;
    }
    
    const now = Date.now();
    if (now - lastAlertTime < 1000) {
      toast.warning('Please wait before sending another alert', {
        description: 'You can send alerts once per second',
        duration: 2000
      });
      return;
    }
    
    setLoadingAlert(alertType);
    setIsOnCooldown(true);
    setLastAlertTime(now);
    
    try {
      const message = getAlertMessage(alertType);
      
      // Validate all required fields before creating alert
      if (!user?.name || !user?.council || !alertType || !message.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Safely format chairName to avoid undefined values
      const chairName = user.name?.trim() || 'Unknown Chair';
      const council = user.council?.trim() || 'Unknown Council';
      
      // Additional validation to prevent undefined values
      if (chairName === 'Unknown Chair' || council === 'Unknown Council') {
        toast.error('Invalid user information. Please refresh and try again.');
        return;
      }
      
      console.log('Creating alert with data:', {
        type: alertType,
        message: message,
        council: council,
        chairName: chairName,
        priority: alertType === 'Security' ? 'urgent' : 'normal',
        room_no: userLocation.room_no,
        floor_no: userLocation.floor_no
      });
      
      const alertResult = await sendAlert({
        type: alertType,
        message: message.trim(),
        council: council,
        chairName: chairName,
        priority: alertType === 'Security' ? 'urgent' : 'normal',
        room_no: userLocation.room_no,
        floor_no: userLocation.floor_no
      });
      
      // Also send via cross-platform notification system for immediate delivery
      const { sendAlert: sendCrossPlatformAlert } = await import('@/services/crossPlatformNotificationManager');
      await sendCrossPlatformAlert(
        alertType,
        council,
        message.trim(),
        [], // Send to all users - targeting will be handled by the system
        alertType === 'Security'
      );
      
      console.log('Alert creation result:', alertResult);
      
      const newAlert: Alert = {
        id: Date.now().toString(),
        type: alertType,
        message: message,
        timestamp: new Date(),
        status: 'pending'
      };
      
      setRecentAlerts(prev => [newAlert, ...prev].slice(0, 5));
      toast.success(`${alertType} alert sent successfully`);
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert');
    } finally {
      setLoadingAlert(null);
    }
  };

  const handleCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customAlert.trim()) {
      toast.error('Please enter an alert message');
      return;
    }
    
    const now = Date.now();
    if (now - lastAlertTime < 1000) {
      toast.warning('Please wait before sending another alert', {
        description: 'You can send alerts once per second',
        duration: 2000
      });
      return;
    }
    
    setLoadingAlert('Custom');
    setIsOnCooldown(true);
    setLastAlertTime(now);
    
    try {
      // Validate required fields
      if (!user?.council || !customAlert.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Safely format chairName to avoid undefined values
      const chairName = user.name?.trim() || 'Unknown Chair';
      const council = user.council?.trim() || 'Unknown Council';
      
      // Additional validation to prevent undefined values
      if (chairName === 'Unknown Chair' || council === 'Unknown Council') {
        toast.error('Invalid user information. Please refresh and try again.');
        return;
      }
      
      console.log('Creating custom alert with data:', {
        type: 'Custom',
        message: customAlert,
        council: council,
        chairName: chairName,
        priority: 'normal',
        room_no: userLocation.room_no,
        floor_no: userLocation.floor_no
      });
      
      const alertResult = await sendAlert({
        type: 'Custom',
        message: customAlert.trim(),
        council: council,
        chairName: chairName,
        priority: 'normal',
        room_no: userLocation.room_no,
        floor_no: userLocation.floor_no
      });
      
      // Also send via cross-platform notification system
      const { sendAlert: sendCrossPlatformAlert } = await import('@/services/crossPlatformNotificationManager');
      await sendCrossPlatformAlert(
        'Custom',
        council,
        customAlert.trim(),
        [], // Send to all users
        false // Not urgent for custom alerts
      );
      
      console.log('Custom alert creation result:', alertResult);
      
      const newAlert: Alert = {
        id: Date.now().toString(),
        type: 'Custom',
        message: customAlert,
        timestamp: new Date(),
        status: 'pending'
      };
      
      setRecentAlerts(prev => [newAlert, ...prev].slice(0, 5));
      toast.success('Custom alert sent successfully');
      setCustomAlert('');
    } catch (error) {
      console.error('Error sending custom alert:', error);
      toast.error('Failed to send alert');
    } finally {
      setLoadingAlert(null);
    }
  };

  const handleSendReply = async (alertId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Send reply with proper chair information - use chairReply field for chair responses
      await realtimeService.updateAlertStatus(alertId, 'acknowledged', {
        chairReply: replyMessage.trim(),
        chairName: user?.name || 'Chair',
        replyTimestamp: Date.now(),
        replyFrom: 'chair'
      });
      
      toast.success('Reply sent to admin');
      setReplyMessage('');
      setActiveAlertId(null);
      
      setRecentAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'acknowledged' }
          : alert
      ));
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Show sidebar on desktop/laptop, hide on mobile/tablet */}
      {!isMobile && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}
      
      {/* Tutorial popup for first-time Chair users */}
      <ChairTutorialPopup />
      
      <div className="flex-1 overflow-y-auto transition-all duration-300"
           style={{ marginLeft: !isMobile ? 'var(--sidebar-width, 256px)' : '0' }}>
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-20 md:pb-8 pt-16 lg:pt-4"
        >
          {showNotificationPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Alert className="mb-6 flex items-center justify-between bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center space-x-4">
                  <motion.div 
                    variants={notificationBellVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <BellRing className="h-5 w-5" />
                  </motion.div>
                  <AlertTitle className="m-0">Enable notifications to get alerts about important events</AlertTitle>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-800/30 dark:hover:bg-amber-800/50 rounded-md transition-colors"
                >
                  Enable Notifications
                </motion.button>
              </Alert>
            </motion.div>
          )}
          
          <motion.header 
            variants={itemVariants}
            className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-white relative inline-block">
                Chair Dashboard
                <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/30 rounded-full transform scale-x-0 origin-left transition-transform group-hover:scale-x-100 duration-300" />
              </h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mt-2">
                Welcome back, <span className="font-medium text-primary/90 dark:text-white/90">{user?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1, rotate: alertsMuted ? 0 : 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAlertsMuted(!alertsMuted)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={alertsMuted ? "Unmute Notifications" : "Mute Notifications"}
              >
                {alertsMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                )}
              </motion.button>
            </div>
          </motion.header>
          
          <motion.div 
            variants={itemVariants} 
            className="mb-6 md:mb-8"
            data-tour="quick-actions"
          >
            <h2 className="text-xl md:text-2xl font-semibold text-primary dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              Quick Actions
              <motion.span 
                variants={floatingIconVariants} 
                animate="animate"
                className="inline-block text-accent/80"
              >
                <AlertTriangle size={20} />
              </motion.span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <motion.div whileHover="hover" whileTap="tap" variants={buttonHoverVariants}>
                <AlertButton
                  icon={<Wrench size={24} />}
                  label="IT Support"
                  onClick={() => handleAlert('IT Support')}
                  loading={loadingAlert === 'IT Support'}
                  className="bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white transition-all duration-300"
                />
              </motion.div>
              <motion.div whileHover="hover" whileTap="tap" variants={buttonHoverVariants}>
                <AlertButton
                  icon={<Truck size={24} />}
                  label="Logistics & Assistance"
                  onClick={() => handleAlert('Logistics & Assistance')}
                  loading={loadingAlert === 'Logistics & Assistance'}
                  className="bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white transition-all duration-300"
                />
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            variants={itemVariants} 
            className="mb-6 md:mb-8"
          >
            <form onSubmit={handleCustomAlert} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300" data-tour="custom-message">
              <h2 className="text-xl md:text-2xl font-semibold text-primary dark:text-white mb-4 md:mb-6">Custom Alert</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <motion.input
                  whileFocus={{ 
                    boxShadow: "0 0 0 2px rgba(69, 129, 182, 0.2)",
                    scale: 1.01
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  type="text"
                  value={customAlert}
                  onChange={(e) => setCustomAlert(e.target.value)}
                  placeholder="Type your alert message here..."
                  className="flex-1 px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 input-shadow focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent dark:bg-gray-700 dark:text-white"
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  type="submit"
                  disabled={loadingAlert === 'Custom'}
                  className={`inline-flex justify-center items-center gap-2 px-6 py-3 md:py-2 border border-transparent rounded-lg shadow-sm text-base md:text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent button-transition ${
                    loadingAlert === 'Custom' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loadingAlert === 'Custom' ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <motion.div 
                        animate={{ 
                          x: [0, 3, 0],
                          transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" }
                        }}
                      >
                        <Send size={18} />
                      </motion.div>
                      Send Alert
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
          
          <motion.div variants={itemVariants} data-tour="timer-widget">
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-gray-800 mb-6 md:mb-8 overflow-hidden">
              <CardHeader className="p-5 md:p-6 pb-3">
                <CardTitle className="text-xl md:text-2xl font-semibold text-primary dark:text-white">Quick Timer</CardTitle>
              </CardHeader>
              <CardContent className="p-5 md:p-6 pt-0">
                <QuickTimerWidget />
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants} data-tour="alerts-section">
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-gray-800 mb-6 md:mb-8 overflow-hidden">
              <CardHeader className="p-5 md:p-6 pb-3">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeInVariants}
                  className="flex flex-col md:flex-row justify-between md:items-center gap-3"
                >
                  <div className="flex items-center justify-between md:justify-start">
                    <CardTitle className="text-xl md:text-2xl font-semibold text-primary dark:text-white flex items-center gap-2">
                      Recent Alerts
                      {recentAlerts.length > 0 && (
                        <motion.span 
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-full bg-accent/10 text-accent"
                        >
                          {recentAlerts.length}
                        </motion.span>
                      )}
                    </CardTitle>
                    {/* Mobile: Small button beside the title */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setHideResolved(!hideResolved);
                        toast.success(hideResolved ? 'Showing all alerts' : 'Hiding resolved alerts');
                      }}
                      className={`md:hidden flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        hideResolved
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
                      }`}
                    >
                      {hideResolved ? <Eye size={14} /> : <EyeOff size={14} />}
                      {hideResolved ? 'Show All' : 'Hide Resolved'}
                    </motion.button>
                  </div>
                  {/* Desktop: Regular button on the right */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setHideResolved(!hideResolved);
                      toast.success(hideResolved ? 'Showing all alerts' : 'Hiding resolved alerts');
                    }}
                    className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      hideResolved
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
                    }`}
                  >
                    {hideResolved ? <Eye size={18} /> : <EyeOff size={18} />}
                    {hideResolved ? 'Show All' : 'Hide Resolved'}
                  </motion.button>
                </motion.div>
              </CardHeader>
              <CardContent className="p-5 md:p-6 pt-0">
                {(() => {
                  // Filter alerts based on hideResolved setting
                  const filteredAlerts = hideResolved 
                    ? recentAlerts.filter(alert => alert.status !== 'resolved')
                    : recentAlerts;
                  
                  return filteredAlerts.length > 0 ? (
                    <motion.div 
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="divide-y divide-gray-100 dark:divide-gray-700"
                    >
                      {filteredAlerts.map((alert, index) => (
                      <motion.div 
                        key={alert.id} 
                        variants={itemVariants}
                        custom={index}
                        transition={{ delay: index * 0.05 }}
                        className="py-5 md:py-4 first:pt-0 last:pb-0 flex items-start gap-4 md:gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 rounded-lg p-3 md:p-2 transition-colors duration-200"
                      >
                        <motion.span 
                          className="mt-0.5 text-accent"
                          initial={{ rotate: 0 }}
                          whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                        >
                          <AlertTriangle size={20} />
                        </motion.span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="text-base md:text-sm font-semibold text-primary dark:text-white">{alert.type}</h3>
                            <motion.span 
                              whileHover={{ scale: 1.1 }}
                              className="text-sm md:text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 md:px-2 md:py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                            >
                              {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </motion.span>
                          </div>
                          <p className="text-base md:text-sm text-gray-600 dark:text-gray-300 mt-2 md:mt-1 line-clamp-2 md:line-clamp-1">{alert.message}</p>
                          
                          {alert.admin && alert.reply && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }} 
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="mt-3 mb-3 p-4 md:p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800"
                            >
                              <p className="font-semibold text-base md:text-sm text-blue-700 dark:text-blue-300">
                                {alert.admin}:
                              </p>
                              <p className="text-base md:text-sm text-blue-800 dark:text-blue-200 mt-1">{alert.reply}</p>
                            </motion.div>
                          )}
                          
                          <div className="mt-3 md:mt-2 flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
                            <motion.span 
                              whileHover={{ scale: 1.05 }}
                              className={`inline-flex items-center px-3 py-1.5 md:px-2 md:py-0.5 rounded-lg md:rounded text-sm md:text-xs font-medium ${
                                alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              }`}
                            >
                              {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                            </motion.span>
                            
                            {alert.status !== 'resolved' && activeAlertId !== alert.id && (
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveAlertId(alert.id)}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 md:px-4 md:py-1.5 text-base md:text-xs font-medium bg-accent hover:bg-accent/90 text-white rounded-lg md:rounded-md transition-colors"
                              >
                                <MessageSquare size={18} className="md:w-3.5 md:h-3.5" />
                                Reply
                              </motion.button>
                            )}
                          </div>
                          
                          {activeAlertId === alert.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 md:mt-3 bg-gray-50 dark:bg-gray-700 p-4 md:p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex flex-col md:flex-row items-start gap-3 md:gap-2">
                                <motion.input
                                  initial={{ scale: 0.98 }}
                                  whileFocus={{ scale: 1.01 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                  type="text"
                                  value={replyMessage}
                                  onChange={(e) => setReplyMessage(e.target.value)}
                                  placeholder="Type your reply..."
                                  className="flex-1 px-4 py-2.5 md:px-3 md:py-1.5 text-base md:text-sm border border-gray-300 rounded-lg md:rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                                <div className="flex gap-2 w-full md:w-auto">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSendReply(alert.id)}
                                    className="flex-1 md:flex-none px-4 py-2.5 md:px-3 md:py-1.5 text-base md:text-xs font-medium bg-accent text-white rounded-lg md:rounded-md hover:bg-accent/90 transition-colors"
                                  >
                                    Send
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveAlertId(null)}
                                    className="flex-1 md:flex-none px-4 py-2.5 md:px-3 md:py-1.5 text-base md:text-xs font-medium bg-gray-200 text-gray-800 rounded-lg md:rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                                  >
                                    Cancel
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                     ))}
                   </motion.div>
                 ) : (
                   <motion.div 
                     variants={fadeInVariants}
                     className="text-center py-8"
                   >
                     <motion.p 
                       animate={{ 
                         opacity: [0.8, 0.6, 0.8], 
                         transition: { duration: 2, repeat: Infinity } 
                       }}
                       className="text-gray-500 dark:text-gray-400"
                     >
                       {hideResolved ? 'No active alerts (resolved alerts are hidden)' : 'No recent alerts'}
                     </motion.p>
                   </motion.div>
                 );
                })()}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
        <ChairMobileNav />
      </div>
    </div>
  );
};

export default ChairDashboard;
