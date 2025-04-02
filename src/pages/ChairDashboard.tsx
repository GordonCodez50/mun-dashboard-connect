
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AlertButton } from '@/components/ui/AlertButton';
import { QuickTimerWidget } from '@/components/ui/QuickTimerWidget';
import { toast } from "sonner";
import { Wrench, Mic, ShieldAlert, Coffee, AlertTriangle, Send, MessageSquare } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const { user } = useAuth();
  const [customAlert, setCustomAlert] = useState('');
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loadingAlert, setLoadingAlert] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  
  // Use Firebase Realtime Database for alerts
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  
  // Use Firebase Realtime Database for alert status updates
  const { data: alertStatusData } = useFirebaseRealtime<any>('ALERT_STATUS_UPDATE');

  // Process alerts data to show the user's council alerts
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      // Filter alerts for this user's council
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
        .slice(0, 5); // Show only the 5 most recent alerts
      
      setRecentAlerts(userAlerts);
    }
  }, [alertsData, user?.council]);

  // Update the useEffect that handles alert status updates
  useEffect(() => {
    if (alertStatusData) {
      // Keep track of shown replies to prevent duplicates
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
  }, [alertStatusData]); // Remove recentAlerts from dependency array

  const handleAlert = async (alertType: string) => {
    if (!user?.council) {
      toast.error('Your council information is missing');
      return;
    }
    
    setLoadingAlert(alertType);
    
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
        id: Date.now().toString(), // Temporary ID until we get the real one
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

  const getAlertMessage = (type: string): string => {
    switch (type) {
      case 'IT Support': return 'Technical assistance needed';
      case 'Mic Issue': return 'Microphone not working properly';
      case 'Security': return 'Security assistance required';
      case 'Break': return 'Motion for a break proposed';
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
        chairName: user?.name || 'Chair',
        priority: 'normal'
      });
      
      const newAlert: Alert = {
        id: Date.now().toString(), // Temporary ID until we get the real one
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

  // Add function to handle sending a reply
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
      
      // Update local alert data
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
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-white">Chair Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {user?.name}
            </p>
          </header>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AlertButton
                icon={<Wrench size={24} />}
                label="IT Support"
                onClick={() => handleAlert('IT Support')}
                loading={loadingAlert === 'IT Support'}
              />
              <AlertButton
                icon={<Mic size={24} />}
                label="Mic Issue"
                onClick={() => handleAlert('Mic Issue')}
                loading={loadingAlert === 'Mic Issue'}
              />
              <AlertButton
                icon={<ShieldAlert size={24} />}
                label="Security"
                onClick={() => handleAlert('Security')}
                variant="urgent"
                loading={loadingAlert === 'Security'}
              />
              <AlertButton
                icon={<Coffee size={24} />}
                label="Break Motion"
                onClick={() => handleAlert('Break')}
                loading={loadingAlert === 'Break'}
              />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-primary dark:text-white">Quick Timer</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <QuickTimerWidget />
              </CardContent>
            </Card>
            
            <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800">
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
                            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                              <span className="font-medium">{alert.admin}:</span> {alert.reply}
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
                                className="text-xs text-accent flex items-center gap-1"
                              >
                                <MessageSquare size={12} />
                                Reply
                              </button>
                            )}
                          </div>
                          
                          {activeAlertId === alert.id && (
                            <div className="mt-2">
                              <div className="flex items-start gap-2">
                                <input
                                  type="text"
                                  value={replyMessage}
                                  onChange={(e) => setReplyMessage(e.target.value)}
                                  placeholder="Type your reply..."
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
                                />
                                <button
                                  onClick={() => handleSendReply(alert.id)}
                                  className="px-2 py-1 bg-accent text-white text-xs rounded-md hover:bg-accent/90"
                                >
                                  Send
                                </button>
                                <button
                                  onClick={() => setActiveAlertId(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-md hover:bg-gray-300"
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
    </div>
  );
};

export default ChairDashboard;
