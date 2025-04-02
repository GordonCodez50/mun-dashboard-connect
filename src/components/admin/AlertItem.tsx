
import React, { useState } from 'react';
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import { User } from '@/types/auth';

export type Alert = {
  id: string;
  council: string;
  chairName: string;
  type: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  priority: 'normal' | 'urgent';
  chairReply?: string;
};

type AlertItemProps = {
  alert: Alert;
  user: User | null;
};

export const AlertItem = ({ alert, user }: AlertItemProps) => {
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const handleAcknowledge = async (alertId: string) => {
    try {
      await realtimeService.updateAlertStatus(alertId, 'acknowledged');
      toast.success('Alert acknowledged');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await realtimeService.updateAlertStatus(alertId, 'resolved');
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
    
    try {
      // Add timestamp to reply to prevent duplicates
      await realtimeService.updateAlertStatus(alertId, alert.status, {
        reply: replyMessage,
        admin: user?.name || 'Admin',
        replyTimestamp: Date.now()
      });
      
      toast.success(`Reply sent to ${alert.chairName}`);
      setReplyMessage('');
      setActiveAlertId(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  return (
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
          
          {alert.chairReply && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-gray-800">
                <span className="font-medium">Reply from {alert.chairName}:</span> {alert.chairReply}
              </p>
            </div>
          )}
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
  );
};
