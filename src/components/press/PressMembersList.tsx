import React, { useState } from 'react';
import { User } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  Users
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { realtimeService } from '@/services/firebaseService';

interface PressMembersListProps {
  users: User[];
  user: User | null;
  isMobile?: boolean;
}

export const PressMembersList: React.FC<PressMembersListProps> = ({ users, user, isMobile }) => {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedPress, setSelectedPress] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter users to get only press members (excluding current user)
  // Look for press members based on email pattern (press-) or council 'PRESS'
  const pressUsers = users.filter(u => {
    const isPress = (u.role === 'chair' && u.council === 'PRESS') || 
                   (u.email && u.email.includes('press-'));
    const isNotCurrentUser = u.id !== user?.id;
    
    return isPress && isNotCurrentUser;
  });

  const handleSendMessage = async (targetUser?: User) => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      const alertData = {
        type: targetUser ? 'Press Direct Message' : 'Press Broadcast Message',
        message: message.trim(),
        council: 'PRESS',
        chairName: user?.name || 'Press Member',
        priority: 'normal',
        targetUser: targetUser?.id,
        targetRole: 'press',
        from: 'press',
        fromUser: user?.id
      };

      await realtimeService.createAlert(alertData);
      
      console.log('Sending message:', {
        type: alertData.type,
        targetUser: alertData.targetUser,
        message: alertData.message,
        targetName: targetUser?.name
      });
      
      toast.success(
        targetUser 
          ? `Message sent to ${targetUser.name}`
          : 'Message sent to all press members'
      );
      
      setMessage('');
      setMessageDialogOpen(false);
      setSelectedPress(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Broadcast Messages Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-primary dark:text-white">
              Broadcast Messages
            </CardTitle>
            <Dialog open={messageDialogOpen && !selectedPress} onOpenChange={(open) => {
              if (!open) {
                setMessageDialogOpen(false);
                setSelectedPress(null);
                setMessage('');
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  onClick={() => {
                    setSelectedPress(null);
                    setMessageDialogOpen(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Message All Press
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Send Message to All Press Members
                  </DialogTitle>
                  <DialogDescription>
                    This message will appear as an alert to all press team members.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="broadcast-message">Message</Label>
                    <Textarea
                      id="broadcast-message"
                      placeholder="Enter your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setMessageDialogOpen(false);
                      setMessage('');
                      setSelectedPress(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !message.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? 'Sending...' : 'Send Message'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Empty content area for consistency */}
        </CardContent>
      </Card>

      {/* Press Members Table */}
      {pressUsers.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pressUsers.map((pressUser) => (
                    <tr key={pressUser.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {pressUser.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPress(pressUser.id);
                            setMessageDialogOpen(true);
                          }}
                          className="flex items-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Message
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Press Members Message */}
      {pressUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No other press members found</p>
            <p className="text-sm">Other press members will appear here when added to the system</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog for individual member messaging */}
      {selectedPress && (
        <Dialog open={messageDialogOpen && !!selectedPress} onOpenChange={(open) => {
          if (!open) {
            setMessageDialogOpen(false);
            setSelectedPress(null);
            setMessage('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Send Message to {pressUsers.find(u => u.id === selectedPress)?.name}
              </DialogTitle>
              <DialogDescription>
                This message will appear as an alert to the selected press member.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="individual-message">Message</Label>
                <Textarea
                  id="individual-message"
                  placeholder="Enter your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setMessageDialogOpen(false);
                  setMessage('');
                  setSelectedPress(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleSendMessage(pressUsers.find(u => u.id === selectedPress))}
                disabled={isLoading || !message.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Message'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};