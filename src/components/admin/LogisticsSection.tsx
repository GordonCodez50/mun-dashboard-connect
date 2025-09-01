import React, { useState } from 'react';
import { User } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Truck,
  Building
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
import { realtimeService } from '@/services/firebaseService';

interface LogisticsSectionProps {
  users: User[];
  user: User | null;
  isMobile: boolean;
}

export const LogisticsSection: React.FC<LogisticsSectionProps> = ({ users, user, isMobile }) => {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedLogistics, setSelectedLogistics] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter users to get only logistics personnel
  const logisticsUsers = users.filter(u => u.role === 'logistics');

  const handleSendMessage = async (targetUser?: User) => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      const alertData = {
        type: 'Admin Message',
        message: message.trim(),
        council: targetUser ? 'Logistics Team' : 'All Logistics',
        chairName: user?.name || 'Admin',
        priority: 'normal',
        targetUser: targetUser?.id,
        targetRole: 'logistics',
        from: 'admin'
      };

      await realtimeService.createAlert(alertData);
      
      toast.success(
        targetUser 
          ? `Message sent to ${targetUser.name}`
          : 'Message sent to all logistics personnel'
      );
      
      setMessage('');
      setMessageDialogOpen(false);
      setSelectedLogistics(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Message All Logistics Button */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Logistics Team Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full flex items-center gap-2"
                onClick={() => {
                  setSelectedLogistics(null);
                  setMessageDialogOpen(true);
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Message All Logistics
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Send Message to {selectedLogistics ? 'Logistics Member' : 'All Logistics Personnel'}
                </DialogTitle>
                <DialogDescription>
                  This message will appear as an alert to {selectedLogistics ? 'the selected logistics member' : 'all logistics team members'}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
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
                    setSelectedLogistics(null);
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
        </CardContent>
      </Card>

      {/* Individual Logistics Members */}
      {logisticsUsers.length > 0 ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Individual Logistics Members ({logisticsUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logisticsUsers.map((logisticsUser) => (
                <div
                  key={logisticsUser.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{logisticsUser.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {logisticsUser.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>@{logisticsUser.username}</span>
                      {(logisticsUser as any).room_no && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          Room {(logisticsUser as any).room_no}
                          {(logisticsUser as any).floor_no && `, Floor ${(logisticsUser as any).floor_no}`}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedLogistics(logisticsUser.id);
                      setMessageDialogOpen(true);
                    }}
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Message
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No logistics personnel found</p>
            <p className="text-sm">Logistics users will appear here when added to the system</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog for individual member messaging */}
      {selectedLogistics && (
        <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Send Message to {logisticsUsers.find(u => u.id === selectedLogistics)?.name}
              </DialogTitle>
              <DialogDescription>
                This message will appear as an alert to the selected logistics member.
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
                  setSelectedLogistics(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleSendMessage(logisticsUsers.find(u => u.id === selectedLogistics))}
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