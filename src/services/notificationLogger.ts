/**
 * Mobile Push Notification Logger Service
 * 
 * Comprehensive logging system for debugging mobile push notification issues
 * Tracks all notification attempts, failures, permissions, and platform-specific issues
 */

import { mobileErrorLogger } from '@/utils/mobileErrorLogger';
import { auditLogService } from '@/services/auditLogService';
import { 
  isIOS, 
  isAndroid, 
  isPwa, 
  isSafari, 
  isChrome, 
  isMacOS,
  getIOSVersion,
  isIOS164PlusWithWebPush 
} from '@/utils/crossPlatformNotifications';

export interface NotificationLogEntry {
  id: string;
  timestamp: number;
  type: 'permission_request' | 'token_request' | 'notification_show' | 'notification_click' | 'service_worker' | 'error' | 'debug';
  action: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  error?: string;
  stackTrace?: string;
  
  // Device/Platform info
  platform: string;
  browser: string;
  browserVersion: string;
  osVersion: string;
  isPWA: boolean;
  userAgent: string;
  
  // Notification specific
  permissionStatus?: NotificationPermission;
  fcmTokenAvailable?: boolean;
  serviceWorkerActive?: boolean;
  notificationSupported?: boolean;
  webPushSupported?: boolean;
  
  // Additional context
  data?: Record<string, any>;
  userId?: string;
  userRole?: 'admin' | 'chair' | 'press';
}

class NotificationLoggerService {
  private logs: NotificationLogEntry[] = [];
  private readonly MAX_LOGS = 100;
  private readonly STORAGE_KEY = 'notification_logs';
  
  constructor() {
    this.loadLogs();
  }
  
  /**
   * Get device and platform information
   */
  private getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    // Detect browser
    let browser = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (isChrome()) {
      browser = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (isSafari()) {
      browser = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (/Firefox/.test(userAgent)) {
      browser = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (/Edg/.test(userAgent)) {
      browser = 'Edge';
      browserVersion = userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
    }
    
    // Detect platform and OS version
    let platform = 'Unknown';
    let osVersion = 'Unknown';
    
    if (isIOS()) {
      platform = isPwa() ? 'iOS PWA' : 'iOS Safari';
      const iosVersion = getIOSVersion();
      osVersion = iosVersion ? `${iosVersion.major}.${iosVersion.minor}` : 'Unknown';
    } else if (isAndroid()) {
      platform = 'Android';
      osVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (isMacOS()) {
      platform = 'macOS';
      osVersion = userAgent.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || 'Unknown';
    } else if (/Windows/.test(userAgent)) {
      platform = 'Windows';
      osVersion = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (/Linux/.test(userAgent)) {
      platform = 'Linux';
    }
    
    return {
      platform,
      browser,
      browserVersion,
      osVersion,
      isPWA: isPwa(),
      userAgent
    };
  }
  
  /**
   * Get current notification status
   */
  private getNotificationStatus() {
    return {
      permissionStatus: 'Notification' in window ? Notification.permission : 'default' as NotificationPermission,
      notificationSupported: 'Notification' in window,
      webPushSupported: 'PushManager' in window,
      serviceWorkerActive: 'serviceWorker' in navigator,
      fcmTokenAvailable: !!localStorage.getItem('fcmToken')
    };
  }
  
  /**
   * Create a new log entry
   */
  private createLogEntry(
    type: NotificationLogEntry['type'],
    action: string,
    status: NotificationLogEntry['status'],
    message: string,
    error?: string | Error,
    data?: Record<string, any>
  ): NotificationLogEntry {
    const deviceInfo = this.getDeviceInfo();
    const notificationStatus = this.getNotificationStatus();
    
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      action,
      status,
      message,
      error: error instanceof Error ? error.message : error,
      stackTrace: error instanceof Error ? error.stack : undefined,
      ...deviceInfo,
      ...notificationStatus,
      data,
      userId: this.getCurrentUserId(),
      userRole: this.getCurrentUserRole()
    };
  }
  
  /**
   * Get current user ID from auth context or localStorage
   */
  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id || parsed.userId;
      }
    } catch (e) {
      // Ignore
    }
    return undefined;
  }
  
  /**
   * Get current user role
   */
  private getCurrentUserRole(): 'admin' | 'chair' | 'press' | undefined {
    try {
      const authData = localStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.role || parsed.role;
      }
    } catch (e) {
      // Ignore
    }
    return undefined;
  }
  
  /**
   * Add a log entry
   */
  public log(
    type: NotificationLogEntry['type'],
    action: string,
    status: NotificationLogEntry['status'],
    message: string,
    error?: string | Error,
    data?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(type, action, status, message, error, data);
    
    // Add to logs array
    this.logs.unshift(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }
    
    // Save to localStorage
    this.saveLogs();
    
    // Console log for debugging
    const logLevel = status === 'error' ? 'error' : status === 'warning' ? 'warn' : 'log';
    console[logLevel](`[NotificationLogger] ${action}:`, message, entry);
    
    // Send critical errors to audit log service (for chairs only)
    if (status === 'error' && entry.userRole === 'chair') {
      this.sendToAuditLog(entry);
    }
    
    // Send to mobile error logger for iOS/Android errors
    if (status === 'error' && (isIOS() || isAndroid()) && error) {
      mobileErrorLogger.logExternalError({
        type: 'javascript',
        message: `${action}: ${message}`,
        stack: entry.stackTrace,
        timestamp: entry.timestamp
      });
    }

    // Send to online notification logger for centralized storage
    try {
      import('@/services/onlineNotificationLogger').then(({ onlineNotificationLogger }) => {
        onlineNotificationLogger.logNotification(entry).catch(e => {
          console.warn('Failed to send log to online logger:', e);
        });
      });
    } catch (e) {
      console.warn('Failed to send log to online logger:', e);
    }
  }
  
  /**
   * Send critical notification errors to audit log
   */
  private async sendToAuditLog(entry: NotificationLogEntry): Promise<void> {
    try {
      await auditLogService.log(
        'CONSOLE_ERROR',
        `Notification Error - ${entry.action}: ${entry.message} | Platform: ${entry.platform} ${entry.browser} | Error: ${entry.error}`,
        {
          userId: entry.userId || 'unknown',
          success: false,
          metadata: {
            notificationType: entry.type,
            notificationAction: entry.action,
            platform: entry.platform,
            browser: entry.browser,
            browserVersion: entry.browserVersion,
            osVersion: entry.osVersion,
            isPWA: entry.isPWA,
            permissionStatus: entry.permissionStatus,
            ...entry.data
          }
        }
      );
    } catch (auditError) {
      console.error('Failed to send notification error to audit log:', auditError);
    }
  }
  
  /**
   * Log permission request attempts
   */
  public logPermissionRequest(
    status: 'success' | 'error' | 'warning',
    result: NotificationPermission,
    error?: string | Error
  ): void {
    this.log(
      'permission_request',
      'request_permission',
      status,
      `Permission request result: ${result}`,
      error,
      { 
        permissionResult: result,
        previousPermission: Notification.permission
      }
    );
  }
  
  /**
   * Log FCM token generation attempts
   */
  public logTokenRequest(
    status: 'success' | 'error',
    token?: string,
    error?: string | Error
  ): void {
    this.log(
      'token_request',
      'fcm_token_generation',
      status,
      token ? 'FCM token generated successfully' : 'FCM token generation failed',
      error,
      { 
        tokenPresent: !!token,
        tokenLength: token?.length,
        tokenPrefix: token?.substring(0, 10)
      }
    );
  }
  
  /**
   * Log notification display attempts
   */
  public logNotificationShow(
    status: 'success' | 'error',
    title: string,
    options?: any,
    error?: string | Error
  ): void {
    this.log(
      'notification_show',
      'show_notification',
      status,
      status === 'success' ? `Notification "${title}" displayed` : `Failed to show notification "${title}"`,
      error,
      {
        notificationTitle: title,
        notificationBody: options?.body,
        notificationTag: options?.tag,
        hasIcon: !!options?.icon,
        requireInteraction: options?.requireInteraction,
        silent: options?.silent
      }
    );
  }
  
  /**
   * Log notification click events
   */
  public logNotificationClick(notificationData: any): void {
    this.log(
      'notification_click',
      'notification_clicked',
      'info',
      'User clicked on notification',
      undefined,
      {
        notificationData,
        currentUrl: window.location.href
      }
    );
  }
  
  /**
   * Log service worker events
   */
  public logServiceWorker(
    action: string,
    status: 'success' | 'error' | 'info',
    message: string,
    error?: string | Error,
    data?: Record<string, any>
  ): void {
    this.log(
      'service_worker',
      action,
      status,
      message,
      error,
      data
    );
  }
  
  /**
   * Log debug information
   */
  public logDebug(action: string, message: string, data?: Record<string, any>): void {
    this.log('debug', action, 'info', message, undefined, data);
  }
  
  /**
   * Get all logs
   */
  public getLogs(): NotificationLogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Get logs filtered by type
   */
  public getLogsByType(type: NotificationLogEntry['type']): NotificationLogEntry[] {
    return this.logs.filter(log => log.type === type);
  }
  
  /**
   * Get error logs only
   */
  public getErrorLogs(): NotificationLogEntry[] {
    return this.logs.filter(log => log.status === 'error');
  }
  
  /**
   * Get recent logs (last N entries)
   */
  public getRecentLogs(count: number = 20): NotificationLogEntry[] {
    return this.logs.slice(0, count);
  }
  
  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
    this.saveLogs();
  }
  
  /**
   * Export logs as JSON string
   */
  public exportLogs(): string {
    const exportData = {
      exportTimestamp: Date.now(),
      exportDate: new Date().toISOString(),
      platform: this.getDeviceInfo(),
      notificationStatus: this.getNotificationStatus(),
      logs: this.logs
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Get notification diagnostics summary
   */
  public getDiagnostics(): {
    platform: string;
    browser: string;
    capabilities: Record<string, boolean>;
    issues: string[];
    recommendations: string[];
    recentErrors: NotificationLogEntry[];
  } {
    const deviceInfo = this.getDeviceInfo();
    const notificationStatus = this.getNotificationStatus();
    const recentErrors = this.logs.filter(log => 
      log.status === 'error' && 
      Date.now() - log.timestamp < 300000 // Last 5 minutes
    ).slice(0, 5);
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze common issues
    if (!notificationStatus.notificationSupported) {
      issues.push('Notifications not supported in this browser');
      recommendations.push('Use a modern browser that supports notifications');
    }
    
    if (notificationStatus.permissionStatus === 'denied') {
      issues.push('Notification permission denied');
      recommendations.push('Enable notifications in browser settings');
    }
    
    if (!notificationStatus.webPushSupported && (isIOS() || isAndroid())) {
      issues.push('Web Push not supported on this mobile platform');
      if (isIOS() && !isPwa()) {
        recommendations.push('Add to home screen for better notification support');
      }
    }
    
    if (isIOS() && !isIOS164PlusWithWebPush()) {
      issues.push('iOS version may not support web push notifications');
      recommendations.push('Update to iOS 16.4+ for full notification support');
    }
    
    if (!notificationStatus.serviceWorkerActive) {
      issues.push('Service worker not available');
      recommendations.push('Check if service workers are blocked');
    }
    
    return {
      platform: `${deviceInfo.platform} ${deviceInfo.browser} ${deviceInfo.browserVersion}`,
      browser: deviceInfo.browser,
      capabilities: {
        notificationSupported: notificationStatus.notificationSupported,
        webPushSupported: notificationStatus.webPushSupported,
        serviceWorkerActive: notificationStatus.serviceWorkerActive,
        permissionGranted: notificationStatus.permissionStatus === 'granted',
        fcmTokenAvailable: notificationStatus.fcmTokenAvailable,
        isPWA: deviceInfo.isPWA
      },
      issues,
      recommendations,
      recentErrors
    };
  }
  
  /**
   * Save logs to localStorage
   */
  private saveLogs(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save notification logs:', error);
    }
  }
  
  /**
   * Load logs from localStorage
   */
  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification logs:', error);
      this.logs = [];
    }
  }
}

// Export singleton instance
export const notificationLogger = new NotificationLoggerService();
