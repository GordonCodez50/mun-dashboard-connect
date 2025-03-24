
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AlertButton } from '@/components/ui/AlertButton';
import { StatusBadge, CouncilStatus } from '@/components/ui/StatusBadge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { toast } from "sonner";
import { Wrench, Mic, ShieldAlert, Coffee, AlertTriangle, Send } from 'lucide-react';

type Alert = {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
};

const ChairDashboard = () => {
  const { user } = useAuth();
  const [councilStatus, setCouncilStatus] = useState<CouncilStatus>('in-session');
  const [customAlert, setCustomAlert] = useState('');
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loadingAlert, setLoadingAlert] = useState<string | null>(null);

  // Handle alert button click
  const handleAlert = async (alertType: string) => {
    setLoadingAlert(alertType);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newAlert: Alert = {
      id: Date.now().toString(),
      type: alertType,
      message: getAlertMessage(alertType),
      timestamp: new Date(),
      status: 'pending'
    };
    
    setRecentAlerts(prev => [newAlert, ...prev].slice(0, 5));
    toast.success(`${alertType} alert sent successfully`);
    setLoadingAlert(null);
  };

  // Get alert message based on type
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

  // Handle sending custom alert
  const handleCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customAlert.trim()) {
      toast.error('Please enter an alert message');
      return;
    }
    
    setLoadingAlert('Custom');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    setLoadingAlert(null);
  };

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as CouncilStatus;
    setCouncilStatus(newStatus);
    toast.success(`Status updated to ${newStatus.replace('-', ' ')}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Chair Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.name}
            </p>
          </header>
          
          {/* Status Panel */}
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-primary">Council Status</h2>
                <StatusBadge status={councilStatus} className="mt-2" size="lg" />
              </div>
              
              <div className="w-full sm:w-auto">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status
                </label>
                <select
                  id="status"
                  value={councilStatus}
                  onChange={handleStatusChange}
                  className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent rounded-md shadow-sm"
                >
                  <option value="in-session">In Session</option>
                  <option value="on-break">On Break</option>
                  <option value="technical-issue">Technical Issue</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Quick Actions Grid */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-primary mb-4">Quick Actions</h2>
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
          
          {/* Custom Alert */}
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-primary mb-4">Custom Alert</h2>
            <form onSubmit={handleCustomAlert} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={customAlert}
                onChange={(e) => setCustomAlert(e.target.value)}
                placeholder="Type your alert message here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 input-shadow focus:outline-none focus:ring-accent focus:border-accent"
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
            </form>
          </div>
          
          {/* Timer Summary */}
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-primary mb-4">Quick Timer</h2>
            <div className="flex justify-center py-2">
              <CountdownTimer initialTime={120} autoStart={false} size="sm" />
            </div>
          </div>
          
          {/* Recent Alerts */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-primary mb-4">Recent Alerts</h2>
            {recentAlerts.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-100">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 flex items-start gap-3">
                    <span className="mt-0.5 text-accent">
                      <AlertTriangle size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium text-primary">{alert.type}</h3>
                        <span className="text-xs text-gray-500">
                          {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          alert.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">No recent alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChairDashboard;
