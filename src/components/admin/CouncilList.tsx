import React, { useState } from 'react';
import { toast } from "sonner";
import { MessageSquare, Send, ChevronDown, ChevronUp, UserPlus, Users } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type Council = {
  id: string;
  name: string;
  chairName: string;
  lastUpdate?: Date;
};

type CouncilListProps = {
  councils: Council[];
  user: User | null;
  isMobile?: boolean;
};

export const CouncilList = ({ councils, user, isMobile = false }: CouncilListProps) => {
  const [activeChairId, setActiveChairId] = useState<string | null>(null);
  const [directMessage, setDirectMessage] = useState('');
  const [showPressMessages, setShowPressMessages] = useState(false);
  const [pressMessage, setPressMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'chairs' | 'chairsAndPress'>('chairs');
  const [showCouncilsList, setShowCouncilsList] = useState(!isMobile);

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

    setIsLoading(true);
    try {
      // Prepare list of councils to message
      let targetCouncils = [...councils];
      
      // If broadcasting to chairs & press, we need to ensure press is included
      const includePress = broadcastTarget === 'chairsAndPress';
      
      // Broadcast to all selected councils
      const broadcastPromises = targetCouncils.map(async (council) => {
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
          status: 'resolved' // Mark as resolved immediately
        };
        
        return realtimeService.createDirectMessage(messageData);
      });
      
      // If including press, add press message
      if (includePress) {
        const pressMessageData = {
          type: 'BROADCAST_MESSAGE',
          message: broadcastMessage,
          council: 'PRESS',
          chairName: 'Press Team',
          councilId: 'press',
          admin: user?.name || 'Admin',
          adminId: user?.id,
          timestamp: Date.now(),
          priority: 'normal',
          status: 'resolved' // Mark as resolved immediately
        };
        
        broadcastPromises.push(realtimeService.createDirectMessage(pressMessageData));
      }
      
      // Wait for all messages to be sent
      await Promise.all(broadcastPromises);
      
      toast.success(
        includePress 
          ? 'Message broadcast to all chairs and press'
          : 'Message broadcast to all chairs'
      );
      
      setBroadcastMessage('');
      setShowBroadcastForm(false);
    } catch (error) {
      console.error('Error broadcasting message:', error);
      toast.error('Failed to broadcast message');
    } finally {
      setIsLoading(false);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4 mb-16 animate-fade-in">
        {/* Broadcast Card */}
        <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 py-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users size={18} className="text-primary" />
                Broadcast Messages
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {!showBroadcastForm ? (
              <div className="flex flex-col gap-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setShowBroadcastForm(true);
                    setBroadcastTarget('chairs');
                  }}
                  className="w-full shadow-sm border bg-white text-primary hover:bg-primary/5 hover:text-primary"
                  variant="outline"
                >
                  <MessageSquare size={16} className="mr-2" />
                  Message All Chairs
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowBroadcastForm(true);
                    setBroadcastTarget('chairsAndPress');
                  }}
                  className="w-full shadow-sm border bg-white text-primary hover:bg-primary/5 hover:text-primary"
                  variant="outline"
                >
                  <UserPlus size={16} className="mr-2" />
                  Message All Chairs & Press
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="text-xs text-gray-600 mb-1">
                  {broadcastTarget === 'chairs' 
                    ? 'This message will be sent to all chairs' 
                    : 'This message will be sent to all chairs and the press team'}
                </div>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder={`Type your broadcast message...`}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
                  disabled={isLoading}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowBroadcastForm(false);
                      setBroadcastMessage('');
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendBroadcastMessage}
                    disabled={isLoading || !broadcastMessage.trim()}
                    className="inline-flex items-center gap-2"
                  >
                    {isLoading ? 'Sending...' : 'Send Broadcast'}
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Press Team Card */}
        <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 py-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Press Team</span>
              {!showPressMessages ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPressMessages(true)}
                  className="h-8 text-primary hover:text-primary/80"
                >
                  <MessageSquare size={16} className="mr-1" />
                  Message
                </Button>
              ) : null}
            </CardTitle>
          </CardHeader>
          
          {showPressMessages && (
            <CardContent className="p-4 animate-fade-in">
              <div className="flex flex-col gap-3">
                <textarea
                  value={pressMessage}
                  onChange={(e) => setPressMessage(e.target.value)}
                  placeholder="Type your message to the Press Team..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPressMessages(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendPressMessage}
                  >
                    Send to Press
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Council List Card */}
        <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
          <CardHeader 
            className="bg-primary/5 py-3 cursor-pointer" 
            onClick={() => setShowCouncilsList(!showCouncilsList)}
          >
            <CardTitle className="text-base flex items-center justify-between">
              <span>Councils ({councils.length})</span>
              {showCouncilsList ? 
                <ChevronUp size={20} /> : 
                <ChevronDown size={20} />
              }
            </CardTitle>
          </CardHeader>
          
          {showCouncilsList && (
            <CardContent className="p-0 animate-fade-in">
              <div className="max-h-[40vh] overflow-y-auto">
                {councils.map((council) => (
                  <div key={council.id} className="border-b border-gray-100 last:border-0">
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-primary">{council.name}</div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-primary"
                          onClick={() => setActiveChairId(activeChairId === council.id ? null : council.id)}
                        >
                          <MessageSquare size={14} className="mr-1" />
                          Message
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600">{council.chairName}</div>
                      
                      {activeChairId === council.id && (
                        <div className="mt-3 animate-fade-in">
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={directMessage}
                              onChange={(e) => setDirectMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveChairId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSendDirectMessage(council.id, council.name, council.chairName)}
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Broadcast Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="text-md font-medium text-primary">Broadcast Messages</h3>
          {!showBroadcastForm ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBroadcastForm(true);
                  setBroadcastTarget('chairs');
                }}
                className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
              >
                <MessageSquare size={16} />
                Message All Chairs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBroadcastForm(true);
                  setBroadcastTarget('chairsAndPress');
                }}
                className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
              >
                <MessageSquare size={16} />
                Message All Chairs & Press
              </Button>
            </div>
          ) : null}
        </div>

        {showBroadcastForm && (
          <div className="p-4">
            <div className="flex flex-col gap-3">
              <div className="text-sm text-gray-600 mb-2">
                {broadcastTarget === 'chairs' 
                  ? 'This message will be sent to all chairs' 
                  : 'This message will be sent to all chairs and the press team'}
              </div>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={`Type your broadcast message...`}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
                disabled={isLoading}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBroadcastForm(false);
                    setBroadcastMessage('');
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendBroadcastMessage}
                  disabled={isLoading || !broadcastMessage.trim()}
                  className="inline-flex items-center gap-2"
                >
                  {isLoading ? 'Sending...' : 'Send Broadcast'}
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Council List */}
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
