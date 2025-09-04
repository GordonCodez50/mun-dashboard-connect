import React, { useState } from 'react';
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, MessageSquare, MapPin, Building } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import { Button } from '@/components/ui/button';
import { User } from '@/types/auth';

export type Alert = {
  id: string;
  council?: string;
  chairName?: string;
  type?: string;
  message?: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  priority?: 'normal' | 'urgent';
  chairReply?: string;
  room_no?: string;
  floor_no?: string;
};

type AlertItemProps = {
  alert: Alert;
  user: User | null;
};

const recentReplies = new Set<string>();

export const AlertItem = ({ alert, user }: AlertItemProps) => {
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const safeAlert = {
    ...alert,
    council: alert.council || 'Unknown Council',
    type: alert.type || 'Unspecified Alert',
    message: alert.message || 'No message provided',
    chairName: alert.chairName || 'Unknown Chair',
    priority: alert.priority || 'normal'
  };

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
      const replyId = `${alertId}-${Date.now()}`;
      
      if (recentReplies.has(replyId)) {
        return;
      }
      
      recentReplies.add(replyId);
      
      if (recentReplies.size > 100) {
        const entriesIterator = recentReplies.values();
        recentReplies.delete(entriesIterator.next().value);
      }
      
      await realtimeService.updateAlertStatus(alertId, alert.status, {
        reply: replyMessage,
        admin: user?.name || 'Admin',
        replyTimestamp: Date.now()
      });
      
      toast.success(`Reply sent to ${safeAlert.chairName}`);
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
      className={`bg-card rounded-lg shadow-sm border ${
        safeAlert.priority === 'urgent' 
          ? 'border-red-200 dark:border-red-700' 
          : 'border-border'
      } overflow-hidden animate-scale-in mb-3 md:mb-0`}
    >
      <div className={`px-3 md:px-4 py-2 md:py-3 flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0 ${
        safeAlert.priority === 'urgent' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted'
      }`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <AlertTriangle 
            size={16} 
            className={`flex-shrink-0 ${safeAlert.priority === 'urgent' ? 'text-red-500' : 'text-accent'}`}
          />
          <h3 className="font-medium text-foreground text-sm md:text-base truncate">
            {safeAlert.council} - {safeAlert.type}
          </h3>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            alert.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
            alert.status === 'acknowledged' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
            'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          }`}>
            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      <div className="p-3 md:p-4">
        <div className="mb-3 md:mb-4">
          <p className="text-sm text-foreground leading-relaxed break-words">{safeAlert.message}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>From: {safeAlert.chairName}</span>
            {(alert.room_no || alert.floor_no) && (
              <div className="flex items-center gap-1">
                {alert.room_no && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    <Building size={10} />
                    Room {alert.room_no}
                  </span>
                )}
                {alert.floor_no && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                    <MapPin size={10} />
                    Floor {alert.floor_no}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {alert.chairReply && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-xs text-foreground">
                <span className="font-medium">Reply from {safeAlert.chairName}:</span> {alert.chairReply}
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
                className="flex-1 px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent"
              />
              <button
                onClick={() => handleSendReply(alert.id)}
                className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 button-transition"
              >
                Send
              </button>
              <button
                onClick={() => setActiveAlertId(null)}
                className="px-3 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 button-transition"
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
                className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 button-transition inline-flex items-center gap-1.5"
              >
                <CheckCircle size={16} />
                Acknowledge
              </button>
            )}
            
            {alert.status !== 'resolved' && (
              <button
                onClick={() => handleResolve(alert.id)}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 button-transition inline-flex items-center gap-1.5"
              >
                <CheckCircle size={16} />
                Resolve
              </button>
            )}
            
            <button
              onClick={() => setActiveAlertId(alert.id)}
              className="px-3 py-1.5 bg-background text-foreground text-sm rounded-md border border-border hover:bg-muted button-transition inline-flex items-center gap-1.5"
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
