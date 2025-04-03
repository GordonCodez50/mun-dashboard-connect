
import React, { useState } from 'react';
import { AlertButton } from '@/components/ui/AlertButton';
import { Wrench, MessagesSquare, Truck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { realtimeService } from '@/services/firebaseService';
import { toast } from 'sonner';

interface ChairQuickActionsProps {
  onAlertSent: (alertId: string, alertType: string, message: string) => void;
}

export const ChairQuickActions: React.FC<ChairQuickActionsProps> = ({ onAlertSent }) => {
  const { user } = useAuth();
  const [loadingAlert, setLoadingAlert] = useState<string | null>(null);

  const handleAlert = async (alertType: string) => {
    if (!user?.council) {
      toast.error('Your council information is missing');
      return;
    }
    
    setLoadingAlert(alertType);
    
    try {
      const message = getAlertMessage(alertType);
      
      const alertResponse = await realtimeService.createAlert({
        type: alertType,
        message: message,
        council: user.council,
        chairName: user.name || 'Chair',
        priority: alertType === 'Security' ? 'urgent' : 'normal'
      });
      
      onAlertSent(alertResponse?.id || Date.now().toString(), alertType, message);
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
      case 'Press & Coverage': return 'Press team or media coverage needed';
      case 'Logistics & Assistance': return 'Logistical assistance required';
      default: return '';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AlertButton
        icon={<Wrench size={24} className="text-accent" />}
        label="IT Support"
        onClick={() => handleAlert('IT Support')}
        loading={loadingAlert === 'IT Support'}
      />
      <AlertButton
        icon={<MessagesSquare size={24} className="text-accent" />}
        label="Press & Coverage"
        onClick={() => handleAlert('Press & Coverage')}
        loading={loadingAlert === 'Press & Coverage'}
      />
      <AlertButton
        icon={<Truck size={24} className="text-accent" />}
        label="Logistics & Assistance"
        onClick={() => handleAlert('Logistics & Assistance')}
        loading={loadingAlert === 'Logistics & Assistance'}
      />
    </div>
  );
};
