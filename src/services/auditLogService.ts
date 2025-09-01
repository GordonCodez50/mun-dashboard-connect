import { User } from '@/types/auth';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  username?: string;
  action: AuditAction;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
  success: boolean;
  metadata?: Record<string, any>;
}

export type AuditAction = 
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED_ACCESS'
  | 'DATA_EXPORT'
  | 'ALERT_SENT'
  | 'TIMER_CREATED'
  | 'TIMER_DELETED'
  | 'ATTENDANCE_MODIFIED'
  | 'CONSOLE_ERROR';

class AuditLogService {
  private logs: AuditLogEntry[] = [];
  private readonly maxLogs = 1000; // Keep last 1000 logs
  private readonly storageKey = 'audit_logs';

  constructor() {
    this.loadLogsFromStorage();
  }

  /**
   * Log an audit event
   */
  log(action: AuditAction, details: string, options: {
    userId?: string;
    username?: string;
    success: boolean;
    metadata?: Record<string, any>;
  }): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      userId: options.userId,
      username: options.username,
      action,
      details,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      deviceInfo: this.getDeviceInfo(),
      success: options.success,
      metadata: options.metadata
    };

    this.logs.unshift(entry); // Add to beginning
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.saveLogsToStorage();
    console.log('Audit Log:', entry);
  }

  /**
   * Log authentication attempt
   */
  logAuthAttempt(username: string, success: boolean, details?: string): void {
    this.log(
      success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      details || (success ? 'User logged in successfully' : 'Login attempt failed'),
      {
        username,
        success,
        metadata: { loginTimestamp: new Date().toISOString() }
      }
    );
  }

  /**
   * Log user logout
   */
  logLogout(user: User): void {
    this.log('LOGOUT', `User ${user.name} logged out`, {
      userId: user.id,
      username: user.username,
      success: true,
      metadata: { logoutTimestamp: new Date().toISOString() }
    });
  }

  /**
   * Log user creation
   */
  logUserCreated(createdUser: User, createdBy: User): void {
    this.log('USER_CREATED', `User ${createdUser.name} (${createdUser.username}) created by ${createdBy.name}`, {
      userId: createdBy.id,
      username: createdBy.username,
      success: true,
      metadata: {
        createdUserId: createdUser.id,
        createdUserRole: createdUser.role,
        createdUserCouncil: createdUser.council
      }
    });
  }

  /**
   * Log user deletion
   */
  logUserDeleted(deletedUserId: string, deletedUsername: string, deletedBy: User): void {
    this.log('USER_DELETED', `User ${deletedUsername} (ID: ${deletedUserId}) deleted by ${deletedBy.name}`, {
      userId: deletedBy.id,
      username: deletedBy.username,
      success: true,
      metadata: {
        deletedUserId,
        deletedUsername
      }
    });
  }

  /**
   * Log unauthorized access attempt
   */
  logUnauthorizedAccess(path: string, user?: User): void {
    this.log('UNAUTHORIZED_ACCESS', `Unauthorized access attempt to ${path}`, {
      userId: user?.id,
      username: user?.username,
      success: false,
      metadata: { attemptedPath: path }
    });
  }

  /**
   * Log alert sent
   */
  logAlertSent(alertType: string, recipients: string[], sentBy: User): void {
    this.log('ALERT_SENT', `Alert \"${alertType}\" sent to ${recipients.length} recipients`, {
      userId: sentBy.id,
      username: sentBy.username,
      success: true,
      metadata: {
        alertType,
        recipientCount: recipients.length,
        recipients: recipients.slice(0, 10) // Log first 10 recipients only
      }
    });
  }

  /**
   * Get all audit logs
   */
  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get filtered logs
   */
  getFilteredLogs(filters: {
    action?: AuditAction;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
  }): AuditLogEntry[] {
    return this.logs.filter(log => {
      if (filters.action && log.action !== filters.action) return false;
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.success !== undefined && log.success !== filters.success) return false;
      if (filters.startDate && log.timestamp < filters.startDate) return false;
      if (filters.endDate && log.timestamp > filters.endDate) return false;
      return true;
    });
  }

  /**
   * Get recent logs (last 24 hours)
   */
  getRecentLogs(): AuditLogEntry[] {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.getFilteredLogs({ startDate: yesterday });
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    uniqueUsers: number;
    lastActivity: Date | null;
  } {
    const uniqueUserIds = new Set(this.logs.map(log => log.userId).filter(Boolean));
    const successfulActions = this.logs.filter(log => log.success).length;
    const failedActions = this.logs.filter(log => !log.success).length;
    const lastActivity = this.logs.length > 0 ? this.logs[0].timestamp : null;

    return {
      totalLogs: this.logs.length,
      successfulActions,
      failedActions,
      uniqueUsers: uniqueUserIds.size,
      lastActivity
    };
  }

  /**
   * Clear all logs (admin only)
   */
  clearLogs(): void {
    this.logs = [];
    this.saveLogsToStorage();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Log console error from chairs
   */
  logConsoleError(errorMessage: string, stack?: string, user?: any): void {
    // Only log errors from chairs
    if (!user || user.role !== 'chair') return;
    
    this.log('CONSOLE_ERROR', `Console error from chair: ${errorMessage}`, {
      userId: user.id,
      username: user.username,
      success: false,
      metadata: {
        errorStack: stack,
        errorType: 'console',
        userRole: user.role,
        deviceInfo: this.getDeviceInfo()
      }
    });
  }

  /**
   * Private helper methods
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getClientIP(): string {
    // In a real application, you would get this from the server
    // For now, we'll use a placeholder
    return 'client';
  }

  private getDeviceInfo(): Record<string, any> {
    const userAgent = navigator.userAgent;
    const deviceInfo: Record<string, any> = {
      userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };

    // Detect device type
    if (/Mobi|Android/i.test(userAgent)) {
      deviceInfo.deviceType = 'mobile';
      if (/iPhone|iPad|iPod/i.test(userAgent)) {
        deviceInfo.platform = 'iOS';
        const match = userAgent.match(/OS (\d+)_(\d+)/);
        if (match) {
          deviceInfo.osVersion = `${match[1]}.${match[2]}`;
        }
      } else if (/Android/i.test(userAgent)) {
        deviceInfo.platform = 'Android';
        const match = userAgent.match(/Android (\d+\.?\d*)/);
        if (match) {
          deviceInfo.osVersion = match[1];
        }
      }
    } else {
      deviceInfo.deviceType = 'desktop';
      if (/Mac/i.test(userAgent)) {
        deviceInfo.platform = 'macOS';
      } else if (/Win/i.test(userAgent)) {
        deviceInfo.platform = 'Windows';
      } else if (/Linux/i.test(userAgent)) {
        deviceInfo.platform = 'Linux';
      }
    }

    // Browser detection
    if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) {
      deviceInfo.browser = 'Chrome';
    } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
      deviceInfo.browser = 'Safari';
    } else if (/Firefox/i.test(userAgent)) {
      deviceInfo.browser = 'Firefox';
    } else if (/Edge/i.test(userAgent)) {
      deviceInfo.browser = 'Edge';
    }

    return deviceInfo;
  }

  private loadLogsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = parsed.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load audit logs from storage:', error);
      this.logs = [];
    }
  }

  private saveLogsToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save audit logs to storage:', error);
    }
  }
}

export const auditLogService = new AuditLogService();
