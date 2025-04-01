import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge, CouncilStatus } from '@/components/ui/StatusBadge';
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, MessageSquare, Bell, BellOff } from 'lucide-react';
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
  status: CouncilStatus;
  lastUpdate: Date;
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [councils, setCouncils] = useState<Council[]>([]);
  const [alertsMuted, setAlertsMuted] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  // Use Firebase Realtime Database for alerts
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');

  // Use Firebase Realtime Database for council status
  const { data: councilStatusData } = useFirebaseRealtime<any>('COUNCIL_STATUS_UPDATE');

  // Load councils from Firestore
  useEffect(() => {
    const loadCouncils = async () => {
      try {
        const councilsData = await firestoreService.getCouncils();
        const formattedCouncils = councilsData.map(council => ({
          id: council.id,
          name: council.name,
          chairName: `${council.name} Chair`,
          status: (council.status as CouncilStatus) || 'in-session',
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
      
      // Play sound for new urgent alerts if not muted
      const newUrgentAlerts = processedAlerts.filter(
        alert => alert.priority === 'urgent' && 
        alert.status === 'pending' && 
        !liveAlerts.some(a => a.id === alert.id)
      );
      
      if (newUrgentAlerts.length > 0 && !alertsMuted) {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3');
        audio.play();
        
        newUrgentAlerts.forEach(alert => {
          toast.info(`New urgent alert from ${alert.council}: ${alert.type}`, {
            description: alert.message,
            duration: 5000
          });
        });
      }
    }
  }, [alertsData, alertsMuted, liveAlerts]);

  // Update council status when data changes
  useEffect(() => {
    if (councilStatusData) {
      // Update councils with new status data
      setCouncils(prev => {
        const updatedCouncils = [...prev];
        
        // Find and update each council's status
        Object.entries(councilStatusData).forEach(([councilId, data]: [string, any]) => {
          // Try to find council by ID first
          let councilIndex = updatedCouncils.findIndex(c => c.id === councilId);
          
          // If not found, try to find by name (using the name stored in the status update)
          if (councilIndex < 0 && data.name) {
            councilIndex = updatedCouncils.findIndex(c => c.name === data.name);
          }
          
          // If still not found, try to match by using the councilId as a name
          if (councilIndex < 0) {
            councilIndex = updatedCouncils.findIndex(c => c.name === councilId);
          }
          
          if (councilIndex >= 0 && data.status) {
            updatedCouncils[councilIndex] = {
              ...updatedCouncils[councilIndex],
              status: data.status as CouncilStatus,
              lastUpdate: data.timestamp ? new Date(data.timestamp) : new Date()
            };
          }
        });
        
        return updatedCouncils;
      });
    }
  }, [councilStatusData]);

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
          </header>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-primary mb-4 flex items-center">
              Live Alerts
              <div className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </h2>
            {liveAlerts.length > 0 ? (
              <div className="space-y-4">
                {liveAlerts.map((alert) => (
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
                <p className="text-gray-500">No active alerts</p>
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
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Update
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={council.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {council.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
