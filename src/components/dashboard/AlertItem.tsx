
import React, { useState } from 'react';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/types/alerts';
import { useAuth } from '@/context/AuthContext';
import { realtimeService } from '@/services/firebaseService';
import { toast } from 'sonner';

interface AlertItemProps {
  alert: Alert;
  onStatusChange: (alertId: string, newStatus: 'acknowledged' | 'resolved') => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  acknowledged: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
};

export const AlertItem: React.FC<AlertItemProps> = ({ alert, onStatusChange }) => {
  const { user } = useAuth();
  const [replyMessage, setReplyMessage] = useState('');
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendReply = async (alertId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await realtimeService.updateAlertStatus(alertId, 'acknowledged', {
        chairReply: replyMessage,
        chairName: user?.name || 'Chair',
        replyTimestamp: Date.now()
      });
      
      toast.success('Reply sent to admin');
      setReplyMessage('');
      setActiveAlertId(null);
      onStatusChange(alertId, 'acknowledged');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-4 first:pt-0 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-accent h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-primary">{alert.type}</h3>
            <span className="text-xs text-gray-500">
              {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
          
          {alert.admin && alert.reply && (
            <div className="mt-3 mb-2 p-3 bg-blue-50 rounded-md border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                  {alert.admin.substring(0, 1).toUpperCase()}
                </div>
                <p className="font-medium text-sm text-blue-700">
                  {alert.admin}
                </p>
              </div>
              <p className="text-sm text-blue-800 pl-8">{alert.reply}</p>
            </div>
          )}
          
          <div className="mt-3 flex justify-between items-center">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              statusColors[alert.status]
            }`}>
              {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
            </span>
            
            {alert.status !== 'resolved' && activeAlertId !== alert.id && (
              <Button 
                onClick={() => setActiveAlertId(alert.id)}
                variant="accent"
                size="sm"
                className="text-xs"
              >
                <MessageSquare size={14} />
                {user?.council?.toUpperCase() === 'PRESS' ? 'Reply' : 'Message'}
              </Button>
            )}
          </div>
          
          {activeAlertId === alert.id && (
            <div className="mt-3 bg-gray-50 p-4 rounded-md border border-gray-200 animate-scale-in">
              <div className="flex flex-col sm:flex-row items-start gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent bg-white"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => handleSendReply(alert.id)}
                    variant="accent"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    Send
                  </Button>
                  <Button
                    onClick={() => setActiveAlertId(null)}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
