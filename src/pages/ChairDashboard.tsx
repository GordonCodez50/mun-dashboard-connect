import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AlertButton } from '@/components/ui/AlertButton';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { toast } from "sonner";
import { Wrench, Mic, ShieldAlert, Coffee, AlertTriangle, Send } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';

type Alert = {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
};

const ChairDashboard = () => {
  const { user } = useAuth();
  const [customAlert, setCustomAlert] = useState('');
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loadingAlert, setLoadingAlert] = useState<string | null>(null);
  
  // Use Firebase Realtime Database for alerts
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  
  // Use Firebase Realtime Database for alert status updates
  const { data: alertStatusData } = useFirebaseRealtime<any>('ALERT_STATUS_UPDATE');

  // Process alerts data to show the user's council alerts
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      // Filter alerts for this user's council
      const userAlerts = alertsData
        .filter(alert => alert.council === user?.council)
        .map(alert => ({
          id: alert.id,
          type: alert.type,
          message: alert.message,
          timestamp: alert.timestamp ? new Date(alert.timestamp) : new Date(),
          status: alert.status,
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
          
          <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-primary mb-4">Quick Timer</h2>
            <div className="flex justify-center py-2">
              <TimerComponent />
            </div>
          </div>
          
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

// Improved timer component with better UI
const TimerComponent = () => {
  const [time, setTime] = useState<number>(120); // 2 minutes in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [inputMinutes, setInputMinutes] = useState<string>("2");
  const [inputSeconds, setInputSeconds] = useState<string>("0");
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && isRunning) {
      setIsRunning(false);
      // Play sound when timer finishes
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-simple-countdown-922.mp3');
      audio.play();
      toast.info("Time's up!");
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time]);
  
  const handleStart = () => {
    setIsRunning(true);
  };
  
  const handlePause = () => {
    setIsRunning(false);
  };
  
  const handleReset = () => {
    setIsRunning(false);
    // Convert input values to numbers and set time
    const minutes = parseInt(inputMinutes) || 0;
    const seconds = parseInt(inputSeconds) || 0;
    setTime(minutes * 60 + seconds);
  };
  
  const handleSet = () => {
    setIsRunning(false);
    // Convert input values to numbers and set time
    const minutes = parseInt(inputMinutes) || 0;
    const seconds = parseInt(inputSeconds) || 0;
    setTime(minutes * 60 + seconds);
  };
  
  // Format time for display
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const initialTime = parseInt(inputMinutes) * 60 + parseInt(inputSeconds) || 120;
  const progress = Math.max(0, (time / initialTime) * 100);
  
  return (
    <div className="w-full max-w-md">
      <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex justify-center mb-2">
          <div className="text-4xl font-bold text-primary">{formatTime(time)}</div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-accent h-2.5 rounded-full transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-center space-x-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
            >
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
            >
              Pause
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="grid grid-cols-2 gap-2 flex-1">
          <div>
            <label htmlFor="minutes" className="block text-sm text-gray-600">
              Minutes
            </label>
            <input
              id="minutes"
              type="number"
              min="0"
              max="60"
              value={inputMinutes}
              onChange={(e) => setInputMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-accent focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="seconds" className="block text-sm text-gray-600">
              Seconds
            </label>
            <input
              id="seconds"
              type="number"
              min="0"
              max="59"
              value={inputSeconds}
              onChange={(e) => setInputSeconds(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-accent focus:border-accent"
            />
          </div>
        </div>
        <div className="pt-6">
          <button
            onClick={handleSet}
            className="px-4 py-2 bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChairDashboard;
