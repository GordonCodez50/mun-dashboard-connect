
import React, { useState } from 'react';
import { toast } from "sonner";
import { MessageSquare } from 'lucide-react';
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

  return (
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
  );
};
