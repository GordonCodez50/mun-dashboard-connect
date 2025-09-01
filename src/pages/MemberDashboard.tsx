import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import MemberLayout from '@/components/layout/MemberLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { rtAlertService, RTAlert } from '@/services/rtAlertService';
import { realtimeService } from '@/services/firebaseService';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  Plus,
  FileText,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<RTAlert[]>([]);
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [newAlertMessage, setNewAlertMessage] = useState('');
  const [replyMessages, setReplyMessages] = useState<{ [alertId: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastActionTime, setLastActionTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  
  const COOLDOWN_SECONDS = 10; // 10 second cooldown

  // Load last action time from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedTime = localStorage.getItem(`lastActionTime_${user.id}`);
      if (savedTime) {
        const lastTime = parseInt(savedTime);
        const now = Date.now();
        const elapsed = (now - lastTime) / 1000;
        
        if (elapsed < COOLDOWN_SECONDS) {
          setLastActionTime(lastTime);
          setCooldownRemaining(COOLDOWN_SECONDS - elapsed);
        }
      }
    }
  }, [user]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  useEffect(() => {
    if (!user || (!user.role.includes('member-'))) return;

    const unsubscribe = rtAlertService.onMemberRTAlerts(user.id, (memberAlerts) => {
      setAlerts(memberAlerts);
      setLoading(false);
    });

    // Load shared files
    loadSharedFiles();
    
    // Set up real-time listener for new file shares
    const unsubscribeFiles = realtimeService.onNewAlert(() => {
      console.log('New alert detected, refreshing shared files...');
      loadSharedFiles();
    });

    return () => {
      unsubscribe();
      if (unsubscribeFiles) unsubscribeFiles();
    };
  }, [user]);

  const loadSharedFiles = async () => {
    if (!user) return;
    
    setFilesLoading(true);
    try {
      // Get files shared with this user's council
      const councilName = getCouncilFromRole(user.role);
      console.log('Loading shared files for council:', councilName);
      
      // Get RT Admin files and chair-to-members files
      const [rtAdminFiles, chairFiles] = await Promise.all([
        realtimeService.getRTAdminFiles(),
        realtimeService.getChairToMembersFiles(councilName)
      ]);
      
      console.log('All RT Admin files:', rtAdminFiles);
      console.log('Chair-to-members files:', chairFiles);
      
      // Filter RT Admin files for this council
      const rtAdminFilesForCouncil = Object.keys(rtAdminFiles).filter(assetId => {
        const file = rtAdminFiles[assetId];
        console.log(`Checking RT admin file ${assetId}:`, file);
        console.log(`File sharedWith: ${file.sharedWith}, looking for: ${councilName}-all`);
        return file.sharedWith === `${councilName}-all`;
      }).map(assetId => ({
        ...rtAdminFiles[assetId],
        asset_id: assetId,
        fromRole: 'admin-rt'
      }));
      
      // Add chair-to-members files
      const chairFilesArray = Object.keys(chairFiles).map(assetId => ({
        ...chairFiles[assetId],
        asset_id: assetId,
        fromRole: 'chair'
      }));
      
      // Combine all files
      const allFiles = [...rtAdminFilesForCouncil, ...chairFilesArray];
      
      console.log('All relevant files found:', allFiles);
      
      // Sort by upload time (newest first)
      allFiles.sort((a, b) => (b.uploadTime || 0) - (a.uploadTime || 0));
      setSharedFiles(allFiles);
    } catch (error) {
      console.error('Error loading shared files:', error);
    } finally {
      setFilesLoading(false);
    }
  };

  const getCouncilFromRole = (role: string): 'HCC' | 'FCC' => {
    return role === 'member-hcc' ? 'HCC' : 'FCC';
  };

  const startCooldown = () => {
    const now = Date.now();
    setLastActionTime(now);
    setCooldownRemaining(COOLDOWN_SECONDS);
    if (user) {
      localStorage.setItem(`lastActionTime_${user.id}`, now.toString());
    }
  };

  const handleSendAlert = async () => {
    if (!newAlertMessage.trim() || !user || sending || cooldownRemaining > 0) return;

    setSending(true);
    try {
      await rtAlertService.createRTAlert({
        message: newAlertMessage.trim(),
        from: {
          name: user.name || user.username,
          council: getCouncilFromRole(user.role),
          role: user.role as 'member-hcc' | 'member-fcc',
          userId: user.id
        }
      });
      
      setNewAlertMessage('');
      startCooldown();
      toast.success('Message sent to R&T Admin successfully');
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (alertId: string) => {
    const message = replyMessages[alertId]?.trim();
    if (!message || !user || cooldownRemaining > 0) return;

    try {
      await rtAlertService.addRTAlertReply(alertId, {
        from: user.name || user.username,
        message,
        fromRole: user.role
      });
      
      setReplyMessages(prev => ({ ...prev, [alertId]: '' }));
      startCooldown();
      toast.success('Reply sent successfully');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const getStatusIcon = (status: RTAlert['status']) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-white" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-white" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: RTAlert['status']) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-600 text-white border-green-600';
      case 'rejected':
        return 'bg-red-600 text-white border-red-600';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const handleFileDownload = (file: any) => {
    const link = document.createElement('a');
    link.href = file.secure_url;
    link.download = file.originalName || file.original_filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading ${file.originalName || file.original_filename}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return format(new Date(timestamp), 'MMM dd, HH:mm');
  };

  if (loading) {
    return (
      <MemberLayout activeItem="member-dashboard">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MemberLayout>
    );
  }

  const councilName = user?.role === 'member-hcc' ? 'HCC' : 'FCC';

  return (
    <MemberLayout activeItem="member-dashboard">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{councilName} Member Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Send Messages and see Responses</p>
        </div>

        {/* Send Message Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              Send Message to R&T Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Textarea
              placeholder="Type your message..."
              value={newAlertMessage}
              onChange={(e) => setNewAlertMessage(e.target.value)}
              className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
            />
            <Button 
              onClick={handleSendAlert}
              disabled={!newAlertMessage.trim() || sending || cooldownRemaining > 0}
              className="w-full h-11 sm:h-10 sm:w-auto text-sm sm:text-base font-medium"
              size="default"
            >
              {sending ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {cooldownRemaining > 0 
                ? `Wait ${Math.ceil(cooldownRemaining)}s` 
                : sending 
                ? 'Sending...' 
                : 'Send Message'
              }
            </Button>
          </CardContent>
        </Card>

        {/* Messages Status Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              Your Messages ({alerts.length + sharedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Shared Files Section */}
            {sharedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Files shared with you
                </div>
                {sharedFiles.map((file) => (
                  <Card key={file.asset_id} className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardContent className="pt-3 sm:pt-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Shared File
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            From {file.fromRole === 'admin-rt' ? 'R&T Admin' : `${file.councilId || getCouncilFromRole(user.role)} Chair`}
                          </Badge>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(file.uploadTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{file.originalName || file.original_filename}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(file.bytes)} • Shared by {file.fromRole === 'admin-rt' ? 'R&T Admin' : 'Chair'} • {file.targetAudience || 'Your council'}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileDownload(file)}
                          className="h-8"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {alerts.length > 0 && <Separator />}
              </div>
            )}

            {/* Messages Section */}
            {alerts.length === 0 && sharedFiles.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">
                No messages or files yet
              </div>
            ) : alerts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Your messages to R&T Admin
                </div>
                {alerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-primary shadow-sm">
                  <CardContent className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${getStatusColor(alert.status)} text-xs`}>
                          {getStatusIcon(alert.status)}
                          <span className="ml-1 capitalize">{alert.status}</span>
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          To R&T Admin
                        </Badge>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg text-sm sm:text-base">
                      {alert.message}
                    </div>

                    {alert.status !== 'pending' && alert.resolvedAt && (
                      <div className={`p-3 rounded-lg text-sm ${
                        alert.status === 'accepted' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        <p>
                          {alert.status === 'accepted' ? 'Accepted' : 'Rejected'} by R&T Admin on{' '}
                          {format(new Date(alert.resolvedAt), 'MMM dd, HH:mm')}
                        </p>
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
                                {reply.fromRole === 'admin-rt' ? 'R&T Admin' : 'You'}
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

                    {/* Reply Input - only show for pending messages */}
                    {alert.status === 'pending' && (
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
                          disabled={!replyMessages[alert.id]?.trim() || cooldownRemaining > 0}
                          className="w-full sm:w-auto h-10 sm:h-8"
                        >
                          {cooldownRemaining > 0 ? (
                            <span className="text-xs">{Math.ceil(cooldownRemaining)}s</span>
                          ) : (
                            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
};

export default MemberDashboard;