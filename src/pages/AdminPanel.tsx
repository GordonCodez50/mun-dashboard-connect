
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, MessageSquare, Bell, BellOff, EyeOff, Eye } from 'lucide-react';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { firestoreService, realtimeService } from '@/services/firebaseService';

type Alert = {
  id: string;
  council: string;
  chairName: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  priority: 'normal' | 'urgent';
};

type Council = {
  id: string;
  name: string;
  chairName: string;
  lastUpdate?: Date;
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [hideResolved, setHideResolved] = useState<boolean>(false);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [alertsMuted, setAlertsMuted] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio("https://pixabay.com/sound-effects/notification-18-270129/");
    return () => {
      if (notificationSound.current) {
        notificationSound.current = null;
      }
    };
  }, []);

  // Use Firebase Realtime Database for alerts
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');

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
      
      // Play sound for new alerts if not muted
      const newAlerts = processedAlerts.filter(
        alert => !liveAlerts.some(a => a.id === alert.id)
      );
      
      if (newAlerts.length > 0 && !alertsMuted) {
        // Play the notification sound
        if (notificationSound.current) {
          notificationSound.current.currentTime = 0;
          notificationSound.current.play().catch(err => console.error("Error playing sound:", err));
        }
        
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
  }, [alertsData, alertsMuted, liveAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      await realtimeService.updateAlertStatus(alertId, 'acknowledged');
      
      setLiveAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
        )
      );
      
      toast.success('Alert acknowledged');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await realtimeService.updateAlertStatus(alertId, 'resolved');
      
      setLiveAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, status: 'resolved' } : alert
        )
      );
      
      toast.success('Alert marked as resolved');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const handleSendReply = async (alertId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    const alert = liveAlerts.find(a => a.id === alertId);
    if (alert) {
      try {
        // Add timestamp to reply to prevent duplicates
        await realtimeService.updateAlertStatus(alertId, alert.status, {
          reply: replyMessage,
          admin: user?.name || 'Admin',
          replyTimestamp: Date.now() // Add this line
        });
        
        toast.success(`Reply sent to ${alert.chairName}`);
        setReplyMessage('');
        setActiveAlertId(null);
      } catch (error) {
        console.error('Error sending reply:', error);
        toast.error('Failed to send reply');
      }
    }
  };

  const toggleAlertsMute = () => {
    setAlertsMuted(!alertsMuted);
    toast.success(alertsMuted ? 'Alerts unmuted' : 'Alerts muted');
  };

  const toggleHideResolved = () => {
    setHideResolved(!hideResolved);
    toast.success(hideResolved ? 'Showing all alerts' : 'Hiding resolved alerts');
  };

  // Filter alerts based on hideResolved setting
  const filteredAlerts = hideResolved 
    ? liveAlerts.filter(alert => alert.status !== 'resolved')
    : liveAlerts;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.name}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={toggleHideResolved}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                  hideResolved
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                } button-transition`}
              >
                {hideResolved ? (
                  <>
                    <Eye size={18} />
                    Show Resolved
                  </>
                ) : (
                  <>
                    <EyeOff size={18} />
                    Hide Resolved
                  </>
                )}
              </button>
              
              <button
                onClick={toggleAlertsMute}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                  alertsMuted 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-accent text-white hover:bg-accent/90'
                } button-transition`}
              >
                {alertsMuted ? (
                  <>
                    <BellOff size={18} />
                    Alerts Muted
                  </>
                ) : (
                  <>
                    <Bell size={18} />
                    Mute Alerts
                  </>
                )}
              </button>
            </div>
          </header>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-primary mb-4 flex items-center">
              Live Alerts
              <div className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </h2>
            {filteredAlerts.length > 0 ? (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`bg-white rounded-lg shadow-sm border ${
                      alert.priority === 'urgent' 
                        ? 'border-red-200' 
                        : 'border-gray-100'
                    } overflow-hidden animate-scale-in`}
                  >
                    <div className={`px-4 py-3 flex justify-between items-center ${
                      alert.priority === 'urgent' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle 
                          size={18} 
                          className={alert.priority === 'urgent' ? 'text-red-500' : 'text-accent'}
                        />
                        <h3 className="font-medium text-primary">
                          {alert.council} - {alert.type}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="mb-4">
                        <p className="text-sm text-gray-800">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          From: {alert.chairName}
                        </p>
                      </div>
                      
                      {activeAlertId === alert.id ? (
                        <div className="mt-3">
                          <div className="flex items-start gap-2">
                            <input
                              type="text"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Type your reply..."
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent"
                            />
                            <button
                              onClick={() => handleSendReply(alert.id)}
                              className="px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 button-transition"
                            >
                              Send
                            </button>
                            <button
                              onClick={() => setActiveAlertId(null)}
                              className="px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 button-transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {alert.status !== 'acknowledged' && alert.status !== 'resolved' && (
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              className="px-3 py-1.5 bg-accent text-white text-sm rounded-md hover:bg-accent/90 button-transition inline-flex items-center gap-1.5"
                            >
                              <CheckCircle size={16} />
                              Acknowledge
                            </button>
                          )}
                          
                          {alert.status !== 'resolved' && (
                            <button
                              onClick={() => handleResolve(alert.id)}
                              className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 button-transition inline-flex items-center gap-1.5"
                            >
                              <CheckCircle size={16} />
                              Resolve
                            </button>
                          )}
                          
                          <button
                            onClick={() => setActiveAlertId(alert.id)}
                            className="px-3 py-1.5 bg-white text-primary text-sm rounded-md border border-gray-200 hover:bg-gray-50 button-transition inline-flex items-center gap-1.5"
                          >
                            <MessageSquare size={16} />
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">
                  {hideResolved ? 'No active alerts (resolved alerts are hidden)' : 'No active alerts'}
                </p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-medium text-primary mb-4">Council Overview</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Council
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chair
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {councils.map((council) => (
                    <tr key={council.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary">{council.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{council.chairName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toast.info(`Messaging ${council.chairName}`)}
                          className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
                        >
                          <MessageSquare size={16} />
                          Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
