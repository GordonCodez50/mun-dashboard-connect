/**
 * Notification Diagnostics Component
 * 
 * Displays comprehensive notification logging and diagnostics information
 * for debugging mobile push notification issues
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Download, 
  Trash2,
  RefreshCw,
  Settings,
  Bug
} from 'lucide-react';
import { notificationLogger, NotificationLogEntry } from '@/services/notificationLogger';
import { toast } from 'sonner';

const StatusIcon = ({ status }: { status: 'success' | 'error' | 'warning' | 'info' }) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const TypeBadge = ({ type }: { type: NotificationLogEntry['type'] }) => {
  const colors = {
    permission_request: 'bg-blue-500',
    token_request: 'bg-green-500',
    notification_show: 'bg-purple-500',
    notification_click: 'bg-orange-500',
    service_worker: 'bg-indigo-500',
    error: 'bg-red-500',
    debug: 'bg-gray-500'
  };
  
  return (
    <Badge variant="secondary" className={`${colors[type]} text-white text-xs`}>
      {type.replace('_', ' ')}
    </Badge>
  );
};

const LogEntry = ({ log }: { log: NotificationLogEntry }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border rounded-lg p-3 mb-2 bg-card">
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3 flex-1">
          <StatusIcon status={log.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TypeBadge type={log.type} />
              <span className="text-sm font-medium">{log.action}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{log.message}</p>
            {log.error && (
              <p className="text-xs text-red-500 mt-1">Error: {log.error}</p>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground ml-2">
          {log.platform} {log.browser}
        </div>
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong>Platform:</strong> {log.platform}
            </div>
            <div>
              <strong>Browser:</strong> {log.browser} {log.browserVersion}
            </div>
            <div>
              <strong>OS Version:</strong> {log.osVersion}
            </div>
            <div>
              <strong>PWA:</strong> {log.isPWA ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Permission:</strong> {log.permissionStatus}
            </div>
            <div>
              <strong>FCM Token:</strong> {log.fcmTokenAvailable ? 'Available' : 'Not available'}
            </div>
          </div>
          
          {log.data && Object.keys(log.data).length > 0 && (
            <div className="mt-2">
              <strong className="text-xs">Additional Data:</strong>
              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}
          
          {log.stackTrace && (
            <div className="mt-2">
              <strong className="text-xs">Stack Trace:</strong>
              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                {log.stackTrace}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const NotificationDiagnostics = () => {
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const refreshData = () => {
    setLogs(notificationLogger.getLogs());
    setDiagnostics(notificationLogger.getDiagnostics());
  };
  
  useEffect(() => {
    refreshData();
  }, []);
  
  const handleExportLogs = async () => {
    try {
      const exportData = notificationLogger.exportLogs();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notification-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };
  
  const handleClearLogs = () => {
    notificationLogger.clearLogs();
    refreshData();
    toast.success('Logs cleared');
  };
  
  const errorLogs = logs.filter(log => log.status === 'error');
  const recentLogs = logs.slice(0, 10);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Diagnostics
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportLogs}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearLogs}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">All Logs ({logs.length})</TabsTrigger>
          <TabsTrigger value="errors">Errors ({errorLogs.length})</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {diagnostics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Platform Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Platform:</strong> {diagnostics.platform}
                    </div>
                    <div>
                      <strong>Browser:</strong> {diagnostics.browser}
                    </div>
                    {diagnostics.isPWA !== undefined && (
                      <div>
                        <strong>PWA Mode:</strong> {diagnostics.isPWA ? 'Yes' : 'No'}
                      </div>
                    )}
                    {diagnostics.isIOSPWA !== undefined && (
                      <div>
                        <strong>iOS PWA:</strong> {diagnostics.isIOSPWA ? 'Yes' : 'No'}
                      </div>
                    )}
                    {diagnostics.iosNativeWebPush !== undefined && (
                      <div>
                        <strong>iOS Native Web Push:</strong> {diagnostics.iosNativeWebPush ? 'Yes' : 'No'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {diagnostics.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Issues Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {diagnostics.issues.map((issue: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              {diagnostics.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Settings className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {diagnostics.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              {diagnostics.recentErrors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <Bug className="h-5 w-5" />
                      Recent Errors
                    </CardTitle>
                    <CardDescription>
                      Errors from the last 5 minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      {diagnostics.recentErrors.map((log: NotificationLogEntry) => (
                        <LogEntry key={log.id} log={log} />
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Notification Logs</CardTitle>
              <CardDescription>
                Complete history of notification events and debugging information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {logs.length > 0 ? (
                  logs.map(log => (
                    <LogEntry key={log.id} log={log} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No logs available. Try triggering some notifications to see logs here.
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error Logs</CardTitle>
              <CardDescription>
                All notification-related errors for debugging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {errorLogs.length > 0 ? (
                  errorLogs.map(log => (
                    <LogEntry key={log.id} log={log} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No errors logged. This is good!
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="capabilities" className="space-y-4">
          {diagnostics && (
            <Card>
              <CardHeader>
                <CardTitle>Platform Capabilities</CardTitle>
                <CardDescription>
                  Current notification capabilities for this device and browser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(diagnostics.capabilities).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                      <div className="flex items-center gap-2">
                        <StatusIcon status={value ? 'success' : 'error'} />
                        <span className="text-sm">{value ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};