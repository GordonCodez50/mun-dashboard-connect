import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import RTAdminLayout from '@/components/layout/RTAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { rtAlertService, RTAlert } from '@/services/rtAlertService';
import { realtimeService } from '@/services/firebaseService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, MessageSquare, CheckCircle, XCircle, Users, Send, Filter } from 'lucide-react';
import { format } from 'date-fns';

const RTAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<RTAlert[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [councilFilter, setCouncilFilter] = useState<'all' | 'HCC' | 'FCC'>('all');
  const [replyMessages, setReplyMessages] = useState<{ [alertId: string]: string }>({});
  const [chairMessages, setChairMessages] = useState<{ [chairCouncil: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin-rt') return;

    const unsubscribe = rtAlertService.onRTAlerts((rtAlerts) => {
      setAlerts(rtAlerts);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const filteredAlerts = alerts
    .filter(alert => showResolved || alert.status === 'pending')
    .filter(alert => {
      if (councilFilter === 'all') return true;
      return alert.from.council === councilFilter;
    });

  const handleStatusUpdate = async (alertId: string, status: 'accepted' | 'rejected') => {
    if (!user) return;

    try {
      await rtAlertService.updateRTAlertStatus(alertId, status, user.id);
      toast.success(`Alert ${status} successfully`);
    } catch (error) {
      console.error('Error updating alert status:', error);
      toast.error(`Failed to ${status.slice(0, -2)} alert`);
    }
  };

  const handleReply = async (alertId: string) => {
    const message = replyMessages[alertId]?.trim();
    if (!message || !user) return;

    try {
      await rtAlertService.addRTAlertReply(alertId, {
        from: user.name || user.username,
        message,
        fromRole: 'admin-rt'
      });
      
      setReplyMessages(prev => ({ ...prev, [alertId]: '' }));
      toast.success('Reply sent successfully');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const handleChairMessage = async (chairCouncil: 'HCC' | 'FCC') => {
    const message = chairMessages[chairCouncil]?.trim();
    if (!message || !user) return;

    try {
      // Use existing alert system to send to chairs
      await realtimeService.createAlert({
        title: `Message from R&T Admin`,
        message,
        priority: 'high',
        type: 'message',
        fromUser: user.name || user.username,
        fromRole: 'admin-rt',
        targetRole: 'chair',
        targetCouncil: chairCouncil,
        timestamp: Date.now()
      });
      
      setChairMessages(prev => ({ ...prev, [chairCouncil]: '' }));
      toast.success(`Message sent to ${chairCouncil} Chair successfully`);
    } catch (error) {
      console.error('Error sending message to chair:', error);
      toast.error(`Failed to send message to ${chairCouncil} Chair`);
    }
  };

  const getStatusIcon = (status: RTAlert['status']) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: RTAlert['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <RTAdminLayout activeItem="rt-admin">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </RTAdminLayout>
    );
  }

  return (
    <RTAdminLayout activeItem="rt-admin">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">R&T Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage alerts from HCC and FCC members</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* Council Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={councilFilter} onValueChange={(value: 'all' | 'HCC' | 'FCC') => setCouncilFilter(value)}>
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Councils</SelectItem>
                  <SelectItem value="HCC">HCC Only</SelectItem>
                  <SelectItem value="FCC">FCC Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Show Resolved Toggle */}
            <div className="flex items-center space-x-2 text-sm sm:text-base">
              <Switch
                id="show-resolved"
                checked={showResolved}
                onCheckedChange={setShowResolved}
              />
              <Label htmlFor="show-resolved" className="whitespace-nowrap">Show resolved</Label>
            </div>
          </div>
        </div>

        {/* Live Alerts Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base sm:text-lg">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                Live Alerts ({filteredAlerts.length})
              </div>
              {councilFilter !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Showing {councilFilter} only
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
                {councilFilter !== 'all' 
                  ? `No ${showResolved ? '' : 'pending '}alerts from ${councilFilter}`
                  : showResolved ? 'No alerts found' : 'No pending alerts'}
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-primary shadow-sm">
                  <CardContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${getStatusColor(alert.status)} text-xs`}>
                          {getStatusIcon(alert.status)}
                          <span className="ml-1 capitalize">{alert.status}</span>
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {alert.from.council}
                        </Badge>
                        <span className="font-medium text-sm sm:text-base">{alert.from.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg text-sm sm:text-base">
                      {alert.message}
                    </div>

                    {alert.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(alert.id, 'accepted')}
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleStatusUpdate(alert.id, 'rejected')}
                          className="w-full sm:w-auto"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Replies Section */}
                    {alert.replies && alert.replies.length > 0 && (
                      <div className="space-y-2">
                        <Separator />
                        <h4 className="font-medium text-sm">Conversation</h4>
                        <div className="space-y-2">
                          {alert.replies.map((reply, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-2 text-sm">
                              <Badge variant="outline" className="text-xs w-fit">
                                {reply.fromRole === 'admin-rt' ? 'You' : reply.from}
                              </Badge>
                              <span className="flex-1 p-2 bg-background border rounded text-sm">
                                {reply.message}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(reply.timestamp), 'HH:mm')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reply Input */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyMessages[alert.id] || ''}
                        onChange={(e) => setReplyMessages(prev => ({ 
                          ...prev, 
                          [alert.id]: e.target.value 
                        }))}
                        className="flex-1 min-h-[60px] text-sm resize-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(alert.id)}
                        disabled={!replyMessages[alert.id]?.trim()}
                        className="w-full sm:w-auto h-10 sm:h-8"
                      >
                        <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chair Communication Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Chair Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* HCC Chair */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-medium">Message to HCC Chair</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Textarea
                  placeholder="Send message to HCC Chair..."
                  value={chairMessages['HCC'] || ''}
                  onChange={(e) => setChairMessages(prev => ({ 
                    ...prev, 
                    HCC: e.target.value 
                  }))}
                  className="flex-1 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
                />
                <Button
                  onClick={() => handleChairMessage('HCC')}
                  disabled={!chairMessages['HCC']?.trim()}
                  className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to HCC
                </Button>
              </div>
            </div>

            <Separator />

            {/* FCC Chair */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-medium">Message to FCC Chair</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Textarea
                  placeholder="Send message to FCC Chair..."
                  value={chairMessages['FCC'] || ''}
                  onChange={(e) => setChairMessages(prev => ({ 
                    ...prev, 
                    FCC: e.target.value 
                  }))}
                  className="flex-1 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
                />
                <Button
                  onClick={() => handleChairMessage('FCC')}
                  disabled={!chairMessages['FCC']?.trim()}
                  className="w-full sm:w-auto h-11 sm:h-10 text-sm sm:text-base"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to FCC
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RTAdminLayout>
  );
};

export default RTAdminDashboard;