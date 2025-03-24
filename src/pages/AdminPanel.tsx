
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge, CouncilStatus } from '@/components/ui/StatusBadge';
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, MessageSquare, Bell, BellOff } from 'lucide-react';

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

  // Initialize mock data
  useEffect(() => {
    // Mock councils
    const mockCouncils: Council[] = [
      {
        id: '1',
        name: 'Security Council',
        chairName: 'John Smith',
        status: 'in-session',
        lastUpdate: new Date()
      },
      {
        id: '2',
        name: 'Human Rights Council',
        chairName: 'Emma Johnson',
        status: 'on-break',
        lastUpdate: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },
      {
        id: '3',
        name: 'Economic and Social Council',
        chairName: 'Michael Brown',
        status: 'technical-issue',
        lastUpdate: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      }
    ];
    
    // Mock alerts
    const mockAlerts: Alert[] = [
      {
        id: '1',
        council: 'Security Council',
        chairName: 'John Smith',
        type: 'IT Support',
        message: 'Projector not working properly',
        timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
        status: 'pending',
        priority: 'normal'
      },
      {
        id: '2',
        council: 'Economic and Social Council',
        chairName: 'Michael Brown',
        type: 'Security',
        message: 'Unauthorized person in the council room',
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        status: 'acknowledged',
        priority: 'urgent'
      }
    ];
    
    setCouncils(mockCouncils);
    setLiveAlerts(mockAlerts);
  }, []);

  // Handle acknowledging an alert
  const handleAcknowledge = (alertId: string) => {
    setLiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      )
    );
    toast.success('Alert acknowledged');
  };

  // Handle resolving an alert
  const handleResolve = (alertId: string) => {
    setLiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      )
    );
    toast.success('Alert marked as resolved');
  };

  // Handle sending a reply
  const handleSendReply = (alertId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    toast.success(`Reply sent to ${liveAlerts.find(a => a.id === alertId)?.chairName}`);
    setReplyMessage('');
    setActiveAlertId(null);
  };

  // Toggle alerts mute
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
          
          {/* Live Alerts */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-primary mb-4">Live Alerts</h2>
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
                    {/* Alert header */}
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
                    
                    {/* Alert content */}
                    <div className="p-4">
                      <div className="mb-4">
                        <p className="text-sm text-gray-800">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          From: {alert.chairName}
                        </p>
                      </div>
                      
                      {/* Reply section */}
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
          
          {/* Council Overview */}
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
