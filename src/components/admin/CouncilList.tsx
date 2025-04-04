
import React, { useState } from 'react';
import { toast } from "sonner";
import { MessageSquare, Users, UserPlus } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';

export type Council = {
  id: string;
  name: string;
  chairName: string;
  lastUpdate?: Date;
};

type CouncilListProps = {
  councils: Council[];
  user: User | null;
};

export const CouncilList = ({ councils, user }: CouncilListProps) => {
  const [activeChairId, setActiveChairId] = useState<string | null>(null);
  const [directMessage, setDirectMessage] = useState('');
  const [showPressMessages, setShowPressMessages] = useState(false);
  const [pressMessage, setPressMessage] = useState('');
  const [showBroadcastMessages, setShowBroadcastMessages] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'chairs' | 'chairsAndPress'>('chairs');

  const handleSendDirectMessage = async (councilId: string, councilName: string, chairName: string) => {
    if (!directMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Create a direct message alert
      const messageData = {
        type: 'DIRECT_MESSAGE',
        message: directMessage,
        council: councilName,
        chairName: chairName,
        councilId: councilId,
        admin: user?.name || 'Admin',
        adminId: user?.id,
        timestamp: Date.now(),
        priority: 'normal',
        status: 'pending'
      };
      
      await realtimeService.createDirectMessage(messageData);
      
      toast.success(`Message sent to ${chairName}`);
      setDirectMessage('');
      setActiveChairId(null);
    } catch (error) {
      console.error('Error sending direct message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendPressMessage = async () => {
    if (!pressMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Create a press message alert
      const messageData = {
        type: 'PRESS_MESSAGE',
        message: pressMessage,
        council: 'PRESS',
        chairName: 'Press Team',
        councilId: 'press',
        admin: user?.name || 'Admin',
        adminId: user?.id,
        timestamp: Date.now(),
        priority: 'normal',
        status: 'pending'
      };
      
      await realtimeService.createDirectMessage(messageData);
      
      toast.success('Message sent to Press Team');
      setPressMessage('');
      setShowPressMessages(false);
    } catch (error) {
      console.error('Error sending press message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    setLoading(true);
    try {
      const isIncludePress = broadcastTarget === 'chairsAndPress';
      let successCount = 0;
      const targetCouncils = [...councils];
      
      // Add press team if needed
      if (isIncludePress) {
        targetCouncils.push({
          id: 'press',
          name: 'PRESS',
          chairName: 'Press Team'
        });
      }
      
      // Send message to each council/chair
      for (const council of targetCouncils) {
        const messageData = {
          type: 'BROADCAST_MESSAGE',
          message: broadcastMessage,
          council: council.name,
          chairName: council.chairName,
          councilId: council.id,
          admin: user?.name || 'Admin',
          adminId: user?.id,
          timestamp: Date.now(),
          priority: 'normal',
          status: 'resolved', // Mark as resolved immediately
          broadcast: true,
          broadcastType: isIncludePress ? 'ALL' : 'CHAIRS'
        };
        
        await realtimeService.createDirectMessage(messageData);
        successCount++;
      }
      
      const targetText = isIncludePress ? 'all Chairs and Press Team' : 'all Chairs';
      toast.success(`Broadcast message sent to ${targetText} (${successCount} recipients)`);
      setBroadcastMessage('');
      setShowBroadcastMessages(false);
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      toast.error('Failed to send broadcast message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Broadcast section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-md font-medium text-primary">Broadcast Messages</h3>
          {!showBroadcastMessages ? (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowBroadcastMessages(true);
                  setBroadcastTarget('chairs');
                }}
                className="text-white bg-accent hover:bg-accent/90 inline-flex items-center gap-1"
                size="sm"
              >
                <Users size={16} />
                Message All Chairs
              </Button>
              <Button
                onClick={() => {
                  setShowBroadcastMessages(true);
                  setBroadcastTarget('chairsAndPress');
                }}
                className="text-white bg-accent hover:bg-accent/90 inline-flex items-center gap-1"
                size="sm"
              >
                <UserPlus size={16} />
                Message All Chairs & Press
              </Button>
            </div>
          ) : null}
        </div>
        
        {showBroadcastMessages && (
          <div className="p-4">
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium text-gray-700">
                {broadcastTarget === 'chairs' ? 'Message to All Chairs' : 'Message to All Chairs & Press'}
              </div>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={`Type your message to ${broadcastTarget === 'chairs' ? 'all chairs' : 'all chairs and press team'}...`}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
                disabled={loading}
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowBroadcastMessages(false)}
                  variant="outline"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBroadcastMessage}
                  disabled={loading || !broadcastMessage.trim()}
                  className="bg-accent text-white hover:bg-accent/90"
                >
                  {loading ? 'Sending...' : 'Send Broadcast'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Council List table */}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {activeChairId === council.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={directMessage}
                        onChange={(e) => setDirectMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent"
                      />
                      <button
                        onClick={() => handleSendDirectMessage(council.id, council.name, council.chairName)}
                        className="px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 button-transition"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setActiveChairId(null)}
                        className="px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 button-transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveChairId(council.id)}
                      className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
                    >
                      <MessageSquare size={16} />
                      Message
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Press Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-md font-medium text-primary">Press Team</h3>
          {!showPressMessages ? (
            <button
              onClick={() => setShowPressMessages(true)}
              className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
            >
              <MessageSquare size={16} />
              Message Press
            </button>
          ) : null}
        </div>
        
        {showPressMessages && (
          <div className="p-4">
            <div className="flex flex-col gap-3">
              <textarea
                value={pressMessage}
                onChange={(e) => setPressMessage(e.target.value)}
                placeholder="Type your message to the Press Team..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPressMessages(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 button-transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendPressMessage}
                  className="px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 button-transition"
                >
                  Send to Press
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
