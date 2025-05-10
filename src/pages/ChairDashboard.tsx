
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AlertButton } from '@/components/ui/AlertButton';
import { QuickTimerWidget } from '@/components/ui/QuickTimerWidget';
import { toast } from "sonner";
import { Wrench, MessagesSquare, Truck, AlertTriangle, Send, MessageSquare, BellRing } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [isOnCooldown, setIsOnCooldown] = useState<boolean>(false);
  
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  const { data: alertStatusData } = useFirebaseRealtime<any>('ALERT_STATUS_UPDATE');

  useAlertsSound(recentAlerts, alertsMuted);

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
      
      await realtimeService.createAlert({
        type: alertType,
        message: message,
        council: user.council,
        chairName: user.name || 'Chair',
        priority: alertType === 'Security' ? 'urgent' : 'normal'
      });
      
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
      await realtimeService.createAlert({
        type: 'Custom',
        message: customAlert,
        council: user?.council || 'Unknown',
        chairName: user?.name || 'Chair',
        priority: 'normal'
      });
      
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
      await realtimeService.updateAlertStatus(alertId, 'acknowledged', {
        chairReply: replyMessage,
        chairName: user?.name || 'Chair',
        replyTimestamp: Date.now()
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
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };
  
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring", 
        stiffness: 80, 
        damping: 15
      }
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      transition: {
        type: "spring", 
        stiffness: 300, 
        damping: 20
      }
    }
  };
  
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };
  
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <motion.div 
          className="p-6 md:p-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <AnimatePresence>
            {showNotificationPrompt && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Alert className="mb-6 flex items-center justify-between bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                  <div className="flex items-center space-x-4">
                    <BellRing className="h-5 w-5" />
                    <AlertTitle className="m-0">Enable notifications to get alerts about important events</AlertTitle>
                  </div>
                  <motion.button
                    onClick={requestNotificationPermission}
                    className="px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-800/30 dark:hover:bg-amber-800/50 rounded-md transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Enable Notifications
                  </motion.button>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.header className="mb-8 flex justify-between items-center" variants={itemVariants}>
            <div>
              <motion.h1 
                className="text-3xl font-bold text-primary dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Chair Dashboard
              </motion.h1>
              <motion.p 
                className="text-gray-600 dark:text-gray-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Welcome back, {user?.name}
              </motion.p>
            </div>
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.button
                onClick={() => setAlertsMuted(!alertsMuted)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={alertsMuted ? "Unmute Notifications" : "Mute Notifications"}
                whileHover={{ scale: 1.1, rotate: alertsMuted ? 0 : 5 }}
                whileTap={{ scale: 0.9 }}
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
            </motion.div>
          </motion.header>
          
          <motion.div className="mb-8" variants={itemVariants}>
            <motion.h2 
              className="text-lg font-medium text-primary dark:text-white mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Quick Actions
            </motion.h2>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.div whileHover="hover" initial="rest" variants={buttonVariants}>
                <AlertButton
                  icon={<Wrench size={24} />}
                  label="IT Support"
                  onClick={() => handleAlert('IT Support')}
                  loading={loadingAlert === 'IT Support'}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 hover:shadow-lg border border-blue-200 dark:border-blue-800/30"
                />
              </motion.div>
              
              <motion.div whileHover="hover" initial="rest" variants={buttonVariants}>
                <AlertButton
                  icon={<MessagesSquare size={24} />}
                  label="Press & Coverage"
                  onClick={() => handleAlert('Press & Coverage')}
                  loading={loadingAlert === 'Press & Coverage'}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/30 hover:shadow-lg border border-purple-200 dark:border-purple-800/30"
                />
              </motion.div>
              
              <motion.div whileHover="hover" initial="rest" variants={buttonVariants}>
                <AlertButton
                  icon={<Truck size={24} />}
                  label="Logistics & Assistance"
                  onClick={() => handleAlert('Logistics & Assistance')}
                  loading={loadingAlert === 'Logistics & Assistance'}
                  className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/30 hover:shadow-lg border border-amber-200 dark:border-amber-800/30"
                />
              </motion.div>
            </motion.div>
          </motion.div>
          
          <motion.div className="mb-8" variants={itemVariants}>
            <motion.form 
              onSubmit={handleCustomAlert} 
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)" }}
            >
              <motion.h2 
                className="text-lg font-medium text-primary dark:text-white mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                Custom Alert
              </motion.h2>
              <motion.div 
                className="flex flex-col sm:flex-row gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <input
                  type="text"
                  value={customAlert}
                  onChange={(e) => setCustomAlert(e.target.value)}
                  placeholder="Type your alert message here..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent dark:bg-gray-700 dark:text-white transition-all duration-200 input-shadow"
                />
                <motion.button
                  type="submit"
                  disabled={loadingAlert === 'Custom'}
                  className={`inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all duration-200 ${
                    loadingAlert === 'Custom' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loadingAlert === 'Custom' ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Alert
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 mb-8 overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-accent/10 to-transparent">
                  <CardTitle className="text-lg text-primary dark:text-white flex items-center">
                    <motion.span 
                      className="inline-block mr-2"
                      animate={{ rotate: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                    >
                      ⏱️
                    </motion.span>
                    Quick Timer
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <QuickTimerWidget />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 mb-8 overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="text-lg text-primary dark:text-white flex items-center">
                    <motion.span
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0]
                      }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
                      className="inline-block mr-2"
                    >
                      <AlertTriangle size={18} className="text-amber-500" />
                    </motion.span>
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {recentAlerts.length > 0 ? (
                    <motion.div className="divide-y divide-gray-100 dark:divide-gray-700">
                      <AnimatePresence>
                        {recentAlerts.map((alert, index) => (
                          <motion.div 
                            key={alert.id} 
                            className="py-4 first:pt-0 last:pb-0 flex items-start gap-3 relative"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            exit={{ opacity: 0, x: 20 }}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          >
                            <span className="mt-0.5 text-accent">
                              <AlertTriangle size={16} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h3 className="text-sm font-medium text-primary dark:text-white">{alert.type}</h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">{alert.message}</p>
                              
                              <AnimatePresence>
                                {alert.admin && alert.reply && (
                                  <motion.div 
                                    className="mt-2 mb-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800"
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                  >
                                    <p className="font-medium text-sm text-blue-700 dark:text-blue-300">
                                      {alert.admin}:
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">{alert.reply}</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                              <div className="mt-2 flex justify-between items-center">
                                <motion.span 
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                    alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  }`}
                                  animate={alert.status === 'pending' ? { scale: [1, 1.05, 1] } : {}}
                                  transition={{ repeat: Infinity, repeatDelay: 2, duration: 1.5 }}
                                >
                                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                                </motion.span>
                                
                                {alert.status !== 'resolved' && activeAlertId !== alert.id && (
                                  <motion.button 
                                    onClick={() => setActiveAlertId(alert.id)}
                                    className="flex items-center justify-center gap-1 px-4 py-1.5 text-xs bg-accent hover:bg-accent/90 text-white rounded-md"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <MessageSquare size={14} />
                                    Reply
                                  </motion.button>
                                )}
                              </div>
                              
                              <AnimatePresence>
                                {activeAlertId === alert.id && (
                                  <motion.div 
                                    className="mt-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                  >
                                    <div className="flex items-start gap-2">
                                      <motion.input
                                        type="text"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        initial={{ scale: 0.98 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                      />
                                      <motion.button
                                        onClick={() => handleSendReply(alert.id)}
                                        className="px-3 py-1.5 text-xs bg-accent text-white rounded-md hover:bg-accent/90"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        Send
                                      </motion.button>
                                      <motion.button
                                        onClick={() => setActiveAlertId(null)}
                                        className="px-3 py-1.5 text-xs bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        Cancel
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="text-center py-8"
                      variants={fadeInVariants}
                    >
                      <motion.p 
                        className="text-gray-500 dark:text-gray-400"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        No recent alerts
                      </motion.p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChairDashboard;
