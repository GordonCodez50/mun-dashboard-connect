
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { realtimeService } from '@/services/firebaseService';
import { User } from '@/types/auth';

export interface BroadcastMessage {
  id: string;
  type: string;
  message: string;
  targetGroup: 'chairs' | 'press' | 'all';
  admin: string;
  adminId: string;
  timestamp: number;
  priority?: 'normal' | 'urgent';
  status?: 'pending' | 'seen' | 'resolved';
}

export function useBroadcastMessages(currentUser: User | null) {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Listen for broadcast messages
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = realtimeService.onBroadcastMessages((data) => {
      if (Array.isArray(data)) {
        // Filter messages based on user role and targetGroup
        const filteredMessages = data.filter(msg => {
          // Admin sees all messages
          if (currentUser.role === 'admin') return true;
          
          // Chair sees messages targeted at chairs or all
          if (currentUser.role === 'chair' && currentUser.council !== 'PRESS') {
            return msg.targetGroup === 'chairs' || msg.targetGroup === 'all';
          }
          
          // Press sees messages targeted at press or all
          if (currentUser.role === 'chair' && currentUser.council === 'PRESS') {
            return msg.targetGroup === 'press' || msg.targetGroup === 'all';
          }
          
          return false;
        });
        
        setMessages(filteredMessages);
      } else {
        setMessages([]);
      }
      
      setIsLoading(false);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);
  
  // Send a broadcast message
  const sendBroadcastMessage = useCallback(async (
    message: string, 
    targetGroup: 'chairs' | 'press' | 'all',
    priority: 'normal' | 'urgent' = 'normal'
  ): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast.error('Only admins can send broadcast messages');
      return false;
    }
    
    if (!message.trim()) {
      toast.error('Message cannot be empty');
      return false;
    }
    
    try {
      const messageData = {
        type: 'BROADCAST_MESSAGE',
        message,
        targetGroup,
        admin: currentUser.name || 'Admin',
        adminId: currentUser.id,
        timestamp: Date.now(),
        priority,
        status: 'pending'
      };
      
      const success = await realtimeService.createBroadcastMessage(messageData);
      
      if (success) {
        let targetText = '';
        switch (targetGroup) {
          case 'chairs': targetText = 'all chairs'; break;
          case 'press': targetText = 'press team'; break;
          case 'all': targetText = 'all chairs and press'; break;
        }
        
        toast.success(`Message sent to ${targetText}`);
        return true;
      } else {
        toast.error('Failed to send broadcast message');
        return false;
      }
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      toast.error('Failed to send broadcast message');
      return false;
    }
  }, [currentUser]);
  
  return { 
    messages, 
    isLoading, 
    sendBroadcastMessage 
  };
}

export default useBroadcastMessages;
