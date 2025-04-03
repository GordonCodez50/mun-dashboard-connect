
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { MessageSquare, Users } from 'lucide-react';
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

type PressUser = {
  id: string;
  name: string;
};

export const CouncilList = ({ councils, user }: CouncilListProps) => {
  const [activeChairId, setActiveChairId] = useState<string | null>(null);
  const [directMessage, setDirectMessage] = useState('');
  const [showPressMessages, setShowPressMessages] = useState(false);
  const [pressMessage, setPressMessage] = useState('');
  const [pressMembers, setPressMembers] = useState<PressUser[]>([]);
  const [activePressMember, setActivePressMember] = useState<string | null>(null);
  const [directPressMessage, setDirectPressMessage] = useState('');

  // Load press members when component mounts
  useEffect(() => {
    const loadPressMembers = async () => {
      try {
        const members = await realtimeService.getPressMembers();
        setPressMembers(members.map(member => ({
          id: member.id,
          name: member.name
        })));
      } catch (error) {
        console.error('Error loading press members:', error);
      }
    };
    
    loadPressMembers();
  }, []);

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
      // Send message to all press members
      await realtimeService.sendMessageToAllPress(
        pressMessage,
        user?.name || 'Admin',
        user?.id || 'admin'
      );
      
      toast.success('Message sent to all Press Team members');
      setPressMessage('');
      setShowPressMessages(false);
    } catch (error) {
      console.error('Error sending press message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendDirectPressMessage = async (pressId: string, pressName: string) => {
    if (!directPressMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Create a direct message alert for individual press member
      const messageData = {
        type: 'DIRECT_MESSAGE',
        message: directPressMessage,
        council: 'PRESS',
        chairName: pressName,
        councilId: pressId,
        admin: user?.name || 'Admin',
        adminId: user?.id,
        timestamp: Date.now(),
        priority: 'normal',
        status: 'pending'
      };
      
      await realtimeService.createDirectMessage(messageData);
      
      toast.success(`Message sent to ${pressName}`);
      setDirectPressMessage('');
      setActivePressMember(null);
    } catch (error) {
      console.error('Error sending direct message to press:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="space-y-4">
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
      
      {/* Press Team Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-accent" />
            <h3 className="text-md font-medium text-primary">Press Team</h3>
          </div>
          {!showPressMessages ? (
            <button
              onClick={() => setShowPressMessages(true)}
              className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
            >
              <MessageSquare size={16} />
              Message All Press
            </button>
          ) : null}
        </div>
        
        {showPressMessages && (
          <div className="p-4">
            <div className="flex flex-col gap-3">
              <textarea
                value={pressMessage}
                onChange={(e) => setPressMessage(e.target.value)}
                placeholder="Type your message to all Press Team members..."
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
                  Send to All Press
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Individual Press Members List */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Individual Press Members</h4>
          
          {pressMembers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pressMembers.map((member) => (
                <div key={member.id} className="py-3 flex justify-between items-center">
                  <span className="text-sm text-gray-800">{member.name}</span>
                  
                  {activePressMember === member.id ? (
                    <div className="flex items-center gap-2 flex-1 ml-4">
                      <input
                        type="text"
                        value={directPressMessage}
                        onChange={(e) => setDirectPressMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent"
                      />
                      <button
                        onClick={() => handleSendDirectPressMessage(member.id, member.name)}
                        className="px-3 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent/90 button-transition"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setActivePressMember(null)}
                        className="px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 button-transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActivePressMember(member.id)}
                      className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
                    >
                      <MessageSquare size={16} />
                      Message
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No press members found</p>
          )}
        </div>
      </div>
    </div>
  );
};
