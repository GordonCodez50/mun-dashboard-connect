import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  RefreshCw, 
  Filter, 
  Search, 
  Calendar,
  User,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { auditLogService, AuditLogEntry, AuditAction } from '@/services/auditLogService';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AuditLogsViewerProps {
  onClose: () => void;
}

const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'LOGIN_ATTEMPT': 'Login Attempt',
  'LOGIN_SUCCESS': 'Successful Login',
  'LOGIN_FAILURE': 'Failed Login',
  'LOGOUT': 'Logout',
  'USER_CREATED': 'User Created',
  'USER_DELETED': 'User Deleted',
  'PASSWORD_CHANGE': 'Password Changed',
  'PERMISSION_CHANGE': 'Permission Changed',
  'SESSION_EXPIRED': 'Session Expired',
  'UNAUTHORIZED_ACCESS': 'Unauthorized Access',
  'DATA_EXPORT': 'Data Export',
  'ALERT_SENT': 'Alert Sent',
  'TIMER_CREATED': 'Timer Created',
  'TIMER_DELETED': 'Timer Deleted',
  'ATTENDANCE_MODIFIED': 'Attendance Modified',
  'CONSOLE_ERROR': 'Console Error'
};

const getActionIcon = (action: AuditAction) => {
  if (action.includes('LOGIN') || action === 'LOGOUT') return <User className="h-4 w-4" />;
  if (action.includes('USER')) return <Shield className="h-4 w-4" />;
  if (action === 'UNAUTHORIZED_ACCESS') return <AlertTriangle className="h-4 w-4" />;
  if (action === 'ALERT_SENT') return <Activity className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
};

const getStatusBadge = (success: boolean) => {
  return success ? (
    <Badge variant="default" className="text-green-700 bg-green-100 hover:bg-green-200">
      <CheckCircle className="h-3 w-3 mr-1" />
      Success
    </Badge>
  ) : (
    <Badge variant="destructive">
      <XCircle className="h-3 w-3 mr-1" />
      Failed
    </Badge>
  );
};

export const AuditLogsViewer: React.FC<AuditLogsViewerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);

  // Load logs on mount
  useEffect(() => {
    if (isAuthorized) {
      loadLogs();
    }
  }, [isAuthorized]);

  // Apply filters
  useEffect(() => {
    if (!isAuthorized) return;
    
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => 
        selectedStatus === 'success' ? log.success : !log.success
      );
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(log => log.timestamp >= startDate);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, selectedAction, selectedStatus, dateRange, isAuthorized]);

  const loadLogs = () => {
    const allLogs = auditLogService.getLogs();
    setLogs(allLogs);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "AuditGGEJT") {
      setIsAuthorized(true);
      toast.success("Access granted to audit logs");
    } else {
      toast.error("Incorrect password");
      setPassword("");
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  };

  const handleExportLogs = () => {
    try {
      const dataStr = auditLogService.exportLogs();
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Audit logs exported successfully");
      
      // Log the export action
      if (user) {
        auditLogService.log('DATA_EXPORT', 'Audit logs exported', {
          userId: user.id,
          username: user.username,
          success: true,
          metadata: { exportType: 'audit_logs' }
        });
      }
    } catch (error) {
      toast.error("Failed to export logs");
    }
  };

  const handleClearLogs = () => {
    if (user?.role === 'admin') {
      if (confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
        auditLogService.clearLogs();
        loadLogs();
        toast.success("All audit logs cleared");
      }
    } else {
      toast.error("Only administrators can clear audit logs");
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  const stats = auditLogService.getLogStats();

  // Password protection screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Audit Logs
                  </CardTitle>
                  <CardDescription>Secure access required</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="audit-password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    ref={passwordRef}
                    id="audit-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter audit logs password"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full">
                  Access Audit Logs
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Main audit logs viewer
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Audit Logs</h1>
              <p className="text-muted-foreground">System activity and security events</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadLogs} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportLogs} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {user?.role === 'admin' && (
              <Button variant="destructive" onClick={handleClearLogs} size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.successfulActions}</div>
              <p className="text-xs text-muted-foreground">Successful</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.failedActions}</div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">Unique Users</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(AUDIT_ACTION_LABELS).map(([action, label]) => (
                    <SelectItem key={action} value={action}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success Only</SelectItem>
                  <SelectItem value="failed">Failed Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Log ({filteredLogs.length} events)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found matching the current filters.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {AUDIT_ACTION_LABELS[log.action]}
                        </span>
                        {getStatusBadge(log.success)}
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {log.details}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        {log.username && (
                          <span>User: {log.username}</span>
                        )}
                        {log.deviceInfo && (
                          <>
                            {log.deviceInfo.deviceType && (
                              <span>Device: {log.deviceInfo.deviceType}</span>
                            )}
                            {log.deviceInfo.browser && (
                              <span>Browser: {log.deviceInfo.browser}</span>
                            )}
                            {log.deviceInfo.platform && (
                              <span>Platform: {log.deviceInfo.platform}</span>
                            )}
                            {log.deviceInfo.osVersion && (
                              <span>OS: {log.deviceInfo.osVersion}</span>
                            )}
                          </>
                        )}
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogsViewer;