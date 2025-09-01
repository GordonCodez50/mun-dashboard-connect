import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { onlineNotificationLogger } from '@/services/onlineNotificationLogger';
import { RefreshCw, Download, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const OnlineNotificationLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [deviceLogs, setDeviceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [userId, setUserId] = useState('');
  const { toast } = useToast();

  const deviceInfo = {
    deviceId: onlineNotificationLogger.getDeviceId(),
    queueSize: onlineNotificationLogger.getRetryQueueSize(),
    platform: navigator.platform,
    userAgent: navigator.userAgent.substring(0, 100) + '...'
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [allLogs, userLogsData, deviceLogsData] = await Promise.all([
        onlineNotificationLogger.getOnlineLogs(200),
        userId ? onlineNotificationLogger.getUserLogs(userId, 100) : Promise.resolve([]),
        deviceId ? onlineNotificationLogger.getDeviceLogs(deviceId, 100) : Promise.resolve([])
      ]);
      
      setLogs(allLogs);
      setUserLogs(userLogsData);
      setDeviceLogs(deviceLogsData);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast({
        title: "Error",
        description: "Failed to load online logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.status !== filter) return false;
    if (searchTerm && !log.action.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !log.error_message?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-primary/10 text-primary border-primary/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted';
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `notification-logs-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const LogTable = ({ data, title }: { data: any[], title: string }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{title} ({data.length})</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const dataStr = JSON.stringify(data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', `${title.toLowerCase().replace(' ', '-')}-logs.json`);
            linkElement.click();
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      
      <div className="max-h-96 overflow-y-auto space-y-2">
        {data.map((log, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(log.status)}>
                  {log.status}
                </Badge>
                <span className="font-medium">{log.action}</span>
                <span className="text-muted-foreground">{log.platform}</span>
              </div>
              <span className="text-muted-foreground">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="text-muted-foreground">
                Device: {log.device_id?.substring(0, 20)}...
              </div>
              
              {log.error_message && (
                <div className="text-destructive bg-destructive/10 p-2 rounded text-xs">
                  {log.error_message}
                </div>
              )}
              
              {log.notification_data && (
                <div className="bg-muted p-2 rounded text-xs">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(log.notification_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Online Notification Logs</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Centralized notification logs from all devices - stored in Supabase for remote access
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Device Info */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h3 className="font-medium">Current Device Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>Device ID: {deviceInfo.deviceId}</div>
            <div>Queue Size: {deviceInfo.queueSize}</div>
            <div>Platform: {deviceInfo.platform}</div>
            <div className="col-span-full">User Agent: {deviceInfo.userAgent}</div>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Logs</TabsTrigger>
            <TabsTrigger value="user">User Logs</TabsTrigger>
            <TabsTrigger value="device">Device Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
              
              <Button variant="outline" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export Filtered
              </Button>
            </div>

            <LogTable data={filteredLogs} title="All Notification Logs" />
          </TabsContent>
          
          <TabsContent value="user" className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Enter user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-64"
              />
              <Button onClick={loadLogs} disabled={loading}>
                Load User Logs
              </Button>
            </div>
            
            <LogTable data={userLogs} title="User Specific Logs" />
          </TabsContent>
          
          <TabsContent value="device" className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Enter device ID"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-64"
              />
              <Button onClick={loadLogs} disabled={loading}>
                Load Device Logs
              </Button>
            </div>
            
            <LogTable data={deviceLogs} title="Device Specific Logs" />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{logs.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {logs.length > 0 ? Math.round((logs.filter(l => l.status === 'error').length / logs.length) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Unique Devices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(logs.map(l => l.device_id).filter(Boolean)).size}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Platform Distribution</h4>
              <div className="space-y-2">
                {Object.entries(
                  logs.reduce((acc: Record<string, number>, log) => {
                    acc[log.platform] = (acc[log.platform] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([platform, count]) => (
                  <div key={platform} className="flex justify-between items-center">
                    <span className="capitalize">{platform}</span>
                    <Badge variant="outline">{String(count)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};