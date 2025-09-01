import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { MessageSquare, Send, Shield, Users } from 'lucide-react';
import { realtimeService, firestoreService } from '@/services/firebaseService';
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type AdminUser = {
  id: string;
  name: string;
  email: string;
};

type LogisticsUser = {
  id: string;
  name: string;
  email: string;
};

type LogisticsMessagingProps = {
  user: User | null;
};

export const LogisticsMessaging = ({ user }: LogisticsMessagingProps) => {
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [directMessage, setDirectMessage] = useState('');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [logisticsUsers, setLogisticsUsers] = useState<LogisticsUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch admin and logistics users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get all users from Firestore
        const allUsers = await firestoreService.getUsers();
        
        // Filter admin users
        const admins = allUsers
          .filter((user: any) => user.role === 'admin')
          .map((user: any) => ({
            id: user.id,
            name: user.name || 'Admin User',
            email: user.email || 'No email'
          }));
        
        // Filter logistics users (excluding current user)
        const logistics = allUsers
          .filter((userData: any) => 
            userData.role === 'logistics' && 
            userData.id !== user?.id
          )
          .map((user: any) => ({
            id: user.id,
            name: user.name || 'Logistics Member',
            email: user.email || 'No email'
          }));
        
        setAdminUsers(admins);
        setLogisticsUsers(logistics);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, [user?.id]);

  const handleSendDirectMessage = async (recipientId: string, recipientType: 'admin' | 'logistics', recipientName: string) => {
    if (!directMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      const messageData = {
        type: recipientType === 'admin' ? 'Logistics to Admin Message' : 'Logistics Direct Message',
        message: directMessage,
        council: recipientType === 'admin' ? 'ADMIN' : 'LOGISTICS',
        chairName: recipientName,
        councilId: recipientId,
        admin: user?.name || 'Logistics Team',
        adminId: user?.id,
        targetUser: recipientId, // Important: Set target user for personal messages
        timestamp: Date.now(),
        priority: 'normal' as const,
        status: 'pending' as const,
        senderRole: 'logistics',
        targetRole: recipientType,
        fromUser: user?.id // Add sender tracking
      };

      console.log('Logistics sending personal message:', {
        type: messageData.type,
        targetUser: messageData.targetUser,
        targetName: recipientName,
        recipientType
      });

      await realtimeService.createDirectMessage(messageData);
      
      toast.success(`Message sent to ${recipientName}`);
      setDirectMessage('');
      setActiveRecipientId(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Users Card */}
      <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-primary/5 py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Admin Team ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {adminUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium">Role</TableHead>
                  <TableHead className="text-xs font-medium">Name</TableHead>
                  <TableHead className="text-xs font-medium w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="text-xs text-gray-600">Admin</TableCell>
                    <TableCell className="text-sm font-medium">{admin.name}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveRecipientId(activeRecipientId === admin.id ? null : admin.id);
                          setDirectMessage('');
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
            <div className="p-4 text-center text-gray-500 text-sm">
              No admin users found
            </div>
          )}
          
          {/* Message form for admin */}
          {activeRecipientId && adminUsers.find(u => u.id === activeRecipientId) && (
            <div className="p-4 border-t bg-gray-50 animate-fade-in">
              <div className="text-sm font-medium mb-2">
                Message {adminUsers.find(u => u.id === activeRecipientId)?.name}
              </div>
              <div className="flex flex-col gap-3">
                <textarea
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveRecipientId(null);
                      setDirectMessage('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const admin = adminUsers.find(u => u.id === activeRecipientId);
                      if (admin) {
                        handleSendDirectMessage(admin.id, 'admin', admin.name);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Send size={14} className="mr-1" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logistics Team Card */}
      <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-primary/5 py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Logistics Team ({logisticsUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logisticsUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium">Role</TableHead>
                  <TableHead className="text-xs font-medium">Name</TableHead>
                  <TableHead className="text-xs font-medium w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logisticsUsers.map((logisticsUser) => (
                  <TableRow key={logisticsUser.id}>
                    <TableCell className="text-xs text-gray-600">Logistics</TableCell>
                    <TableCell className="text-sm font-medium">{logisticsUser.name}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveRecipientId(activeRecipientId === logisticsUser.id ? null : logisticsUser.id);
                          setDirectMessage('');
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
            <div className="p-4 text-center text-gray-500 text-sm">
              No other logistics team members found
            </div>
          )}
          
          {/* Message form for logistics user */}
          {activeRecipientId && logisticsUsers.find(u => u.id === activeRecipientId) && (
            <div className="p-4 border-t bg-gray-50 animate-fade-in">
              <div className="text-sm font-medium mb-2">
                Message {logisticsUsers.find(u => u.id === activeRecipientId)?.name}
              </div>
              <div className="flex flex-col gap-3">
                <textarea
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveRecipientId(null);
                      setDirectMessage('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const logisticsUser = logisticsUsers.find(u => u.id === activeRecipientId);
                      if (logisticsUser) {
                        handleSendDirectMessage(logisticsUser.id, 'logistics', logisticsUser.name);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <Send size={14} className="mr-1" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};