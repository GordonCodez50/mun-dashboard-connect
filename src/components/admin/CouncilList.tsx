
import React, { useState } from 'react';
import { toast } from "sonner";
import { MessageSquare, Users, Send } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import { User } from '@/types/auth';

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
  const [showAllChairsMessage, setShowAllChairsMessage] = useState(false);
  const [allChairsMessage, setAllChairsMessage] = useState('');
  const [showAllChairsAndPressMessage, setShowAllChairsAndPressMessage] = useState(false);
  const [allChairsAndPressMessage, setAllChairsAndPressMessage] = useState('');

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

  const handleSendAllChairsMessage = async () => {
    if (!allChairsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Create a message for all chairs
      const messageData = {
        type: 'BROADCAST_MESSAGE',
        message: allChairsMessage,
        targetGroup: 'chairs',
        admin: user?.name || 'Admin',
        adminId: user?.id,
        timestamp: Date.now(),
        priority: 'normal',
        status: 'pending'
      };
      
      await realtimeService.createBroadcastMessage(messageData);
      
      toast.success('Message sent to all chairs');
      setAllChairsMessage('');
      setShowAllChairsMessage(false);
    } catch (error) {
      console.error('Error sending message to all chairs:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendAllChairsAndPressMessage = async () => {
    if (!allChairsAndPressMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Create a message for all chairs and press
      const messageData = {
        type: 'BROADCAST_MESSAGE',
        message: allChairsAndPressMessage,
        targetGroup: 'all',
        admin: user?.name || 'Admin',
        adminId: user?.id,
        timestamp: Date.now(),
        priority: 'normal',
        status: 'pending'
      };
      
      await realtimeService.createBroadcastMessage(messageData);
      
      toast.success('Message sent to all chairs and press');
      setAllChairsAndPressMessage('');
      setShowAllChairsAndPressMessage(false);
    } catch (error) {
      console.error('Error sending message to all chairs and press:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="space-y-4">
      {/* Broadcast Messages Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-md font-medium text-primary">Broadcast Messages</h3>
        </div>
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              setShowAllChairsMessage(true);
              setShowAllChairsAndPressMessage(false);
              setShowPressMessages(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Users size={16} />
            Message All Chairs
          </button>
          <button
            onClick={() => {
              setShowAllChairsAndPressMessage(true);
              setShowAllChairsMessage(false);
              setShowPressMessages(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
          >
            <Users size={16} />
            Message All Chairs & Press
          </button>
          <button
            onClick={() => {
              setShowPressMessages(true);
              setShowAllChairsMessage(false);
              setShowAllChairsAndPressMessage(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            <MessageSquare size={16} />
            Message Press
          </button>
        </div>
        
        {showAllChairsMessage && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700">Message to all chairs:</label>
              <textarea
                value={allChairsMessage}
                onChange={(e) => setAllChairsMessage(e.target.value)}
                placeholder="Type your message to all chairs..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAllChairsMessage(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 button-transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAllChairsMessage}
                  className="px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 button-transition flex items-center gap-1"
                >
                  <Send size={14} />
                  Send to All Chairs
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showAllChairsAndPressMessage && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700">Message to all chairs & press:</label>
              <textarea
                value={allChairsAndPressMessage}
                onChange={(e) => setAllChairsAndPressMessage(e.target.value)}
                placeholder="Type your message to all chairs and press..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAllChairsAndPressMessage(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 button-transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAllChairsAndPressMessage}
                  className="px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 button-transition flex items-center gap-1"
                >
                  <Send size={14} />
                  Send to All Chairs & Press
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showPressMessages && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700">Message to press team:</label>
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
                  className="px-3 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 button-transition flex items-center gap-1"
                >
                  <Send size={14} />
                  Send to Press
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Individual Council List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-md font-medium text-primary">Individual Councils</h3>
        </div>
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
        </div>
      </div>
    </div>
  );
};
