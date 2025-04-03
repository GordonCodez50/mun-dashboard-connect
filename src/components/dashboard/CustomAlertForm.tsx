
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { realtimeService } from '@/services/firebaseService';
import { toast } from "sonner";

interface CustomAlertFormProps {
  onAlertSent: (alertId: string, alertType: string, message: string) => void;
}

export const CustomAlertForm: React.FC<CustomAlertFormProps> = ({ onAlertSent }) => {
  const { user } = useAuth();
  const [customAlert, setCustomAlert] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customAlert.trim()) {
      toast.error('Please enter an alert message');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const alertResponse = await realtimeService.createAlert({
        type: 'Custom',
        message: customAlert,
        council: user?.council || 'Unknown',
        chairName: user?.name || 'Chair',
        priority: 'normal'
      });
      
      toast.success('Custom alert sent successfully');
      onAlertSent(alertResponse?.id || Date.now().toString(), 'Custom', customAlert);
      setCustomAlert('');
    } catch (error) {
      console.error('Error sending custom alert:', error);
      toast.error('Failed to send alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCustomAlert} className="form-card">
      <h2 className="text-lg font-medium text-primary mb-4">Custom Alert</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={customAlert}
          onChange={(e) => setCustomAlert(e.target.value)}
          placeholder="Type your alert message here..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 input-focus bg-white/80"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="accent"
          className="transition-all"
        >
          {isSubmitting ? (
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
        </Button>
      </div>
    </form>
  );
};
