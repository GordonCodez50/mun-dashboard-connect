import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { MessageSquare, Send, ChevronDown, ChevronUp, UserPlus, Users, Truck, Globe } from 'lucide-react';
import { realtimeService, firestoreService } from '@/services/firebaseService';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type Council = {
  id: string;
  name: string;
  chairName: string;
  lastUpdate?: Date;
};

type LogisticsUser = {
  id: string;
  name: string;
  email: string;
};

type PressUser = {
  id: string;
  name: string;
  email: string;
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
  const [showLogisticsMessages, setShowLogisticsMessages] = useState(false);
  const [pressMessage, setPressMessage] = useState('');
  const [logisticsMessage, setLogisticsMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'everyone' | 'chairs' | 'press' | 'logistics'>('everyone');
  const [showCouncilsList, setShowCouncilsList] = useState(!isMobile);
  const [logisticsUsers, setLogisticsUsers] = useState<LogisticsUser[]>([]);
  const [pressUsers, setPressUsers] = useState<PressUser[]>([]);

  // Fetch logistics and press users from Firestore
  useEffect(() => {
    const fetchTeamUsers = async () => {
      try {
        // Get all users from Firestore
        const allUsers = await firestoreService.getUsers();
        
        // Filter users with logistics email pattern
        const logistics = allUsers
          .filter((user: any) => user.email && user.email.startsWith('logistics-') && user.email.endsWith('@bmunis.com'))
          .map((user: any) => {
            // Extract name from email pattern: logistics-{name}@bmunis.com
            const emailPart = user.email.split('@')[0]; // get "logistics-{name}"
            const name = emailPart.replace('logistics-', ''); // get "{name}"
            
            return {
              id: user.id,
              name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
              email: user.email
            };
          });
        
        // Filter users with press email pattern or council: 'PRESS'
        const press = allUsers
          .filter((user: any) => 
            (user.email && user.email.startsWith('press-') && user.email.endsWith('@bmunis.com')) ||
            user.council === 'PRESS'
          )
          .map((user: any) => {
            let name = user.name || 'Unknown';
            
            // If name is not available but email is, extract from email
            if (!user.name && user.email && user.email.startsWith('press-')) {
              const emailPart = user.email.split('@')[0]; // get "press-{name}"
              name = emailPart.replace('press-', ''); // get "{name}"
              name = name.charAt(0).toUpperCase() + name.slice(1); // Capitalize first letter
            }
            
            return {
              id: user.id,
              name: name,
              email: user.email || 'No email'
            };
          });
        
        setLogisticsUsers(logistics);
        setPressUsers(press);
      } catch (error) {
        console.error('Error fetching team users:', error);
        toast.error('Failed to load team users');
      }
    };

    fetchTeamUsers();
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

  const handleSendLogisticsMessage = async () => {
    if (!logisticsMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Create a logistics message alert
      const messageData = {
        type: 'LOGISTICS_MESSAGE',
        message: logisticsMessage,
        council: 'LOGISTICS',
        chairName: 'Logistics Team',
        councilId: 'logistics',
        admin: user?.name || 'Admin',
        adminId: user?.id,
        timestamp: Date.now(),
        priority: 'normal',
        status: 'pending'
      };
      
      await realtimeService.createDirectMessage(messageData);
      
      toast.success('Message sent to Logistics Team');
      setLogisticsMessage('');
      setShowLogisticsMessages(false);
    } catch (error) {
      console.error('Error sending logistics message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleSendPersonalMessage = async (targetUserId: string, targetUserName: string, team: string) => {
    if (!directMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    try {
      // Create a personal message alert with proper targeting
      const messageData = {
        type: team === 'PRESS' ? 'Press Direct Message' : 'Logistics Direct Message',
        message: directMessage,
        council: team,
        chairName: targetUserName,
        councilId: targetUserId,
        admin: user?.name || 'Admin',
        adminId: user?.id,
        targetUser: targetUserId, // Important: Set the target user for personal messages
        timestamp: Date.now(),
        priority: 'normal',
        status: 'pending'
      };
      
      await realtimeService.createDirectMessage(messageData);
      
      toast.success(`Message sent to ${targetUserName}`);
      setDirectMessage('');
      setActiveChairId(null);
    } catch (error) {
      console.error('Error sending personal message:', error);
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
      
      // Handle different broadcast targets
      const includePress = broadcastTarget === 'everyone' || broadcastTarget === 'press';
      const includeLogistics = broadcastTarget === 'everyone' || broadcastTarget === 'logistics';
      const includeChairs = broadcastTarget === 'everyone' || broadcastTarget === 'chairs';
      
      // Broadcast to councils (skip if not targeting chairs)
      const broadcastPromises = !includeChairs ? [] : targetCouncils.map(async (council) => {
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
          status: 'pending',
          broadcastTarget: broadcastTarget // Add broadcast target for filtering
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
          status: 'pending',
          broadcastTarget: broadcastTarget // Add broadcast target for filtering
        };
        
        broadcastPromises.push(realtimeService.createDirectMessage(pressMessageData));
      }

      // If including logistics, add logistics message
      if (includeLogistics) {
        const logisticsMessageData = {
          type: 'BROADCAST_MESSAGE',
          message: broadcastMessage,
          council: 'LOGISTICS',
          chairName: 'Logistics Team',
          councilId: 'logistics',
          admin: user?.name || 'Admin',
          adminId: user?.id,
          timestamp: Date.now(),
          priority: 'normal',
          status: 'pending',
          broadcastTarget: broadcastTarget // Add broadcast target for filtering
        };
        
        broadcastPromises.push(realtimeService.createDirectMessage(logisticsMessageData));
      }
      
      // Wait for all messages to be sent
      await Promise.all(broadcastPromises);
      
      let successMessage = 'Message broadcast successfully';
      if (broadcastTarget === 'everyone') {
        successMessage = 'Message broadcast to everyone';
      } else if (broadcastTarget === 'chairs') {
        successMessage = 'Message broadcast to all chairs';
      } else if (broadcastTarget === 'press') {
        successMessage = 'Message sent to press team';
      } else if (broadcastTarget === 'logistics') {
        successMessage = 'Message sent to logistics team';
      }
      
      toast.success(successMessage);
      
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
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 dark:bg-primary/10 py-3">
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
                    setBroadcastTarget('everyone');
                  }}
                  className="w-full shadow-sm border bg-background text-primary hover:bg-primary/5 hover:text-primary"
                  variant="outline"
                >
                  <Globe size={16} className="mr-2" />
                  To Everyone
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowBroadcastForm(true);
                    setBroadcastTarget('chairs');
                  }}
                  className="w-full shadow-sm border bg-background text-primary hover:bg-primary/5 hover:text-primary"
                  variant="outline"
                >
                  <Users size={16} className="mr-2" />
                  To Chairs
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowBroadcastForm(true);
                    setBroadcastTarget('press');
                  }}
                  className="w-full shadow-sm border bg-background text-primary hover:bg-primary/5 hover:text-primary"
                  variant="outline"
                >
                  <MessageSquare size={16} className="mr-2" />
                  To Press
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowBroadcastForm(true);
                    setBroadcastTarget('logistics');
                  }}
                  className="w-full shadow-sm border bg-background text-primary hover:bg-primary/5 hover:text-primary"
                  variant="outline"
                >
                  <Truck size={16} className="mr-2" />
                  To Logistics
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="text-xs text-muted-foreground mb-1">
                  {broadcastTarget === 'everyone' 
                    ? 'This message will be sent to all chairs, press team, and logistics team' 
                    : broadcastTarget === 'chairs'
                    ? 'This message will be sent to all chairs'
                    : broadcastTarget === 'press'
                    ? 'This message will be sent to the press team'
                    : 'This message will be sent to the logistics team'}
                </div>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder={`Type your broadcast message...`}
                  className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
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

        {/* Logistics Team Card (above Press Team) */}
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 dark:bg-primary/10 py-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Truck size={18} className="text-primary" />
                Logistics Team
              </span>
              {!showLogisticsMessages ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLogisticsMessages(true)}
                  className="h-8 text-primary hover:text-primary/80"
                >
                  <MessageSquare size={16} className="mr-1" />
                  Message
                </Button>
              ) : null}
            </CardTitle>
          </CardHeader>
          
          {showLogisticsMessages && (
            <CardContent className="p-4 animate-fade-in">
              <div className="flex flex-col gap-3">
                <textarea
                  value={logisticsMessage}
                  onChange={(e) => setLogisticsMessage(e.target.value)}
                  placeholder="Type your message to the Logistics Team..."
                  className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogisticsMessages(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSendLogisticsMessage}
                  >
                    Send to Logistics
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Press Team Card */}
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 dark:bg-primary/10 py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Press Team ({pressUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pressUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium">Team</TableHead>
                    <TableHead className="text-xs font-medium">Member</TableHead>
                    <TableHead className="text-xs font-medium w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pressUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-xs text-muted-foreground">Press</TableCell>
                      <TableCell className="text-sm font-medium">{user.name}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Send individual message to press member
                            const messageData = {
                              type: 'DIRECT_MESSAGE',
                              message: `Message for ${user.name}`,
                              council: 'PRESS',
                              chairName: user.name,
                              councilId: user.id,
                              admin: user?.name || 'Admin',
                              adminId: user?.id,
                              timestamp: Date.now(),
                              priority: 'normal',
                              status: 'pending'
                            };
                            // For now, show message dialog for individual press member
                            setActiveChairId(user.id);
                          }}
                          className="h-8 text-primary hover:text-primary/80"
                        >
                          <MessageSquare size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No press members found
              </div>
            )}
            
            {/* Message form for individual press member */}
            {activeChairId && pressUsers.find(u => u.id === activeChairId) && (
              <div className="p-4 border-t bg-muted/50 animate-fade-in">
                <div className="text-sm font-medium mb-2">
                  Message {pressUsers.find(u => u.id === activeChairId)?.name}
                </div>
                <div className="flex flex-col gap-3">
                  <textarea
                    value={directMessage}
                    onChange={(e) => setDirectMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveChairId(null);
                        setDirectMessage('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const user = pressUsers.find(u => u.id === activeChairId);
                        if (user) {
                          handleSendDirectMessage(user.id, 'PRESS', user.name);
                        }
                      }}
                    >
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Council List Card */}
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          <CardHeader 
            className="bg-primary/5 dark:bg-primary/10 py-3 cursor-pointer" 
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
                  <div key={council.id} className="border-b border-border last:border-0">
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
                      <div className="text-xs text-muted-foreground">{council.chairName}</div>
                      
                      {activeChairId === council.id && (
                        <div className="mt-3 animate-fade-in">
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={directMessage}
                              onChange={(e) => setDirectMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[80px]"
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
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-border">
          <h3 className="text-md font-medium text-foreground">Broadcast Messages</h3>
          {!showBroadcastForm ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBroadcastForm(true);
                  setBroadcastTarget('chairs');
                }}
                className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
              >
                <Users size={16} />
                To Chairs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBroadcastForm(true);
                  setBroadcastTarget('everyone');
                }}
                className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
              >
                <Globe size={16} />
                To Everyone
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBroadcastForm(true);
                  setBroadcastTarget('press');
                }}
                className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
              >
                <MessageSquare size={16} />
                To Press
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBroadcastForm(true);
                  setBroadcastTarget('logistics');
                }}
                className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
              >
                <Truck size={16} />
                To Logistics
              </Button>
            </div>
          ) : null}
        </div>

        {showBroadcastForm && (
          <div className="p-4">
            <div className="flex flex-col gap-3">
              <div className="text-sm text-muted-foreground mb-2">
                {broadcastTarget === 'everyone' 
                  ? 'This message will be sent to everyone'
                  : broadcastTarget === 'chairs'
                  ? 'This message will be sent to all chairs' 
                  : broadcastTarget === 'press'
                  ? 'This message will be sent to the press team'
                  : 'This message will be sent to the logistics team'}
              </div>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={`Type your broadcast message...`}
                className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px]"
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
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Council
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Chair
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {councils.map((council) => (
              <tr key={council.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">{council.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-muted-foreground">{council.chairName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {activeChairId === council.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={directMessage}
                        onChange={(e) => setDirectMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent"
                      />
                      <button
                        onClick={() => handleSendDirectMessage(council.id, council.name, council.chairName)}
                        className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 button-transition"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setActiveChairId(null)}
                        className="px-3 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 button-transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveChairId(council.id)}
                      className="text-primary hover:text-primary/80 inline-flex items-center gap-1"
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
      
      {/* Logistics Team Table - Separate section below councils */}
      {logisticsUsers.length > 0 && (
        <div className="mt-6 bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Truck size={16} />
                    Team
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {logisticsUsers.map((logisticsUser) => (
                <tr key={logisticsUser.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">LOGISTICS</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{logisticsUser.name}</div>
                    <div className="text-sm text-gray-500">{logisticsUser.email}</div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setActiveChairId(logisticsUser.id);
                       }}
                       className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
                     >
                       <MessageSquare size={16} />
                       Message
                     </Button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Press Team Table */}
      {pressUsers.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    Team
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {pressUsers.map((pressUser) => (
                <tr key={pressUser.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">PRESS</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{pressUser.name}</div>
                    <div className="text-sm text-gray-500">{pressUser.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveChairId(pressUser.id)}
                      className="text-accent hover:text-accent/80 inline-flex items-center gap-1"
                    >
                      <MessageSquare size={16} />
                      Message
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
           {/* Message form for individual team member */}
           {activeChairId && (pressUsers.find(u => u.id === activeChairId) || logisticsUsers.find(u => u.id === activeChairId)) && (
              <div className="p-4 border-t bg-muted/50">
                <div className="text-sm font-medium mb-2 text-foreground">
                  Message {pressUsers.find(u => u.id === activeChairId)?.name || logisticsUsers.find(u => u.id === activeChairId)?.name}
                </div>
                <div className="flex flex-col gap-3">
                  <textarea
                    value={directMessage}
                    onChange={(e) => setDirectMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[80px]"
                 />
                 <div className="flex justify-end gap-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       setActiveChairId(null);
                       setDirectMessage('');
                     }}
                   >
                     Cancel
                   </Button>
                   <Button
                     size="sm"
                     onClick={() => {
                       const pressUser = pressUsers.find(u => u.id === activeChairId);
                       const logisticsUser = logisticsUsers.find(u => u.id === activeChairId);
                       
                       if (pressUser) {
                         handleSendPersonalMessage(pressUser.id, pressUser.name, 'PRESS');
                       } else if (logisticsUser) {
                         handleSendPersonalMessage(logisticsUser.id, logisticsUser.name, 'LOGISTICS');
                       }
                     }}
                   >
                     Send Message
                   </Button>
                 </div>
               </div>
             </div>
           )}
        </div>
      )}

      {/* Logistics Message Dialog */}
      {showLogisticsMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4 text-foreground">Send Message to Logistics Team</h3>
            <textarea
              value={logisticsMessage}
              onChange={(e) => setLogisticsMessage(e.target.value)}
              placeholder="Type your message to the Logistics Team..."
              className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent min-h-[100px] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLogisticsMessages(false)}
                className="px-3 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 button-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendLogisticsMessage}
                className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 button-transition"
              >
                Send to Logistics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
