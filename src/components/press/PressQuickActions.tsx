
import React, { useState } from 'react';
import { AlertButton } from '@/components/ui/AlertButton';
import { MapPin, Map, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { realtimeService } from '@/services/firebaseService';
import { toast } from 'sonner';

interface PressQuickActionsProps {
  onAlertSent: (alertId: string, alertType: string, message: string) => void;
}

export const PressQuickActions: React.FC<PressQuickActionsProps> = ({ onAlertSent }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [loadingAlert, setLoadingAlert] = useState<string | null>(null);

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
      }
      
      const alertResponse = await realtimeService.createAlert({
        type: alertType,
        message: message,
        council: user.council,
        chairName: user.name || 'Press',
        priority: alertType === 'Need Help' ? 'urgent' : 'normal'
      });
      
      onAlertSent(alertResponse?.id || Date.now().toString(), alertType, message);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AlertButton
        icon={<MapPin size={24} className="text-accent" />}
        label="Admin Location"
        onClick={() => handleAlert('Admin Location')}
        loading={loadingAlert === 'Admin Location'}
      />
      <Card className="border-gray-200 shadow-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex flex-1 items-center gap-3 w-full">
          <span className="text-accent flex-shrink-0 h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Map size={20} />
          </span>
          <input
            type="text"
            placeholder="Enter location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent bg-white"
          />
        </div>
        <Button
          onClick={() => handleAlert('Need Help')}
          disabled={loadingAlert === 'Need Help'}
          variant="accent"
          className="shrink-0 min-w-[120px]"
        >
          {loadingAlert === 'Need Help' ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <HelpCircle size={18} className="mr-1" />
              Need Help
            </>
          )}
        </Button>
      </Card>
    </div>
  );
};
