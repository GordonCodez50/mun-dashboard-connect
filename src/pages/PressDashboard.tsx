import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AlertButton } from '@/components/ui/AlertButton';
import { toast } from "sonner";
import { MapPin, Send, HelpCircle, MessageSquare, AlertTriangle, BellRing } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle } from '@/components/ui/alert';

type Alert = {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  reply?: string;
  admin?: string;
};

const PressDashboard = () => {
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
  const [location, setLocation] = useState('');
  
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  const { data: alertStatusData } = useFirebaseRealtime<any>('ALERT_STATUS_UPDATE');

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

  const handleAlert = async (alertType: string) => {
    if (!user?.council) {
      toast.error('Your council information is missing');
      return;
    }
    
    setLoadingAlert(alertType);
    
    try {
      let message = '';
      
      if (alertType === 'Admin Location') {
        message = 'Admin location requested';
      } else if (alertType === 'Need Help') {
        if (!location.trim()) {
          toast.error('Please enter a location');
          setLoadingAlert(null);
          return;
        }
        message = `Need help at ${location}`;
      } else {
        message = getAlertMessage(alertType);
      }
      
      await realtimeService.createAlert({
        type: alertType,
        message: message,
        council: user.council,
        chairName: user.name || 'Press',
        priority: alertType === 'Need Help' ? 'urgent' : 'normal'
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
      
      if (alertType === 'Need Help') {
        setLocation('');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert');
    } finally {
      setLoadingAlert(null);
    }
  };

  const getAlertMessage = (type: string): string => {
    switch (type) {
      case 'Custom': return customAlert;
      default: return '';
    }
  };

  const handleCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customAlert.trim()) {
      toast.error('Please enter an alert message');
      return;
    }
    
    setLoadingAlert('Custom');
    
    try {
      await realtimeService.createAlert({
        type: 'Custom',
        message: customAlert,
        council: user?.council || 'Unknown',
        chairName: user?.name || 'Press',
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
        chairName: user?.name || 'Press',
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          {showNotificationPrompt && (
            <Alert className="mb-6 flex items-center justify-between bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
              <div className="flex items-center space-x-4">
                <BellRing className="h-5 w-5" />
                <AlertTitle className="m-0">Enable notifications to get alerts about important events</AlertTitle>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-800/30 dark:hover:bg-amber-800/50 rounded-md transition-colors"
              >
                Enable Notifications
              </button>
            </Alert>
          )}
          
          <header className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-primary dark:text-white">Press Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
          </header>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AlertButton
                icon={<MapPin size={24} />}
                label="Admin Location"
                onClick={() => handleAlert('Admin Location')}
                loading={loadingAlert === 'Admin Location'}
                className="h-full min-w-[200px]" // Add fixed minimum width
              />
              <div className="flex flex-col md:flex-row gap-3 border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm min-h-[80px]">
                <div className="flex flex-1 items-center gap-3">
                  <span className="text-accent flex-shrink-0">
                    <HelpCircle size={24} />
                  </span>
                  <input
                    type="text"
                    placeholder="Enter location..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => handleAlert('Need Help')}
                  disabled={loadingAlert === 'Need Help'}
                  className={`shrink-0 px-4 py-2 text-white bg-accent hover:bg-accent/90 rounded-md transition-colors flex items-center justify-center gap-2 ${
                    loadingAlert === 'Need Help' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loadingAlert === 'Need Help' ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      Need Help
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <form onSubmit={handleCustomAlert} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <h2 className="text-lg font-medium text-primary dark:text-white mb-4">Custom Alert</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={customAlert}
                  onChange={(e) => setCustomAlert(e.target.value)}
                  placeholder="Type your alert message here..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 input-shadow focus:outline-none focus:ring-accent focus:border-accent dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={loadingAlert === 'Custom'}
                  className={`inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent button-transition ${
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
                      <Send size={18} />
                      Send Alert
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800 mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-primary dark:text-white">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {recentAlerts.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
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
                        
                        {alert.admin && alert.reply && (
                          <div className="mt-2 mb-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-100 dark:border-blue-800">
                            <p className="font-medium text-sm text-blue-700 dark:text-blue-300">
                              {alert.admin}:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{alert.reply}</p>
                          </div>
                        )}
                        
                        <div className="mt-2 flex justify-between items-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                          </span>
                          
                          {alert.status !== 'resolved' && activeAlertId !== alert.id && (
                            <button 
                              onClick={() => setActiveAlertId(alert.id)}
                              className="flex items-center justify-center gap-1 px-6 py-2 text-sm font-medium bg-accent hover:bg-accent/90 text-white rounded-md transition-colors"
                            >
                              <MessageSquare size={16} />
                              Reply
                            </button>
                          )}
                        </div>
                        
                        {activeAlertId === alert.id && (
                          <div className="mt-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                            <div className="flex items-start gap-2">
                              <input
                                type="text"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              />
                              <button
                                onClick={() => handleSendReply(alert.id)}
                                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
                              >
                                Send
                              </button>
                              <button
                                onClick={() => setActiveAlertId(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">No recent alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PressDashboard;
