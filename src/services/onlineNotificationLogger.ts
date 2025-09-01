/**
 * Online notification logger service that sends all notification logs to Supabase
 * for remote access and centralized monitoring across all devices
 */

import { supabase } from "@/integrations/supabase/client";
import type { NotificationLogEntry } from "@/services/notificationLogger";

interface OnlineNotificationLog {
  id?: string;
  user_id?: string;
  device_id: string;
  timestamp: string;
  log_type: string;
  action: string;
  status: string;
  platform: string;
  browser?: string;
  os_version?: string;
  device_info?: any;
  notification_data?: any;
  error_message?: string;
  error_stack?: string;
  user_agent?: string;
  ip_address?: string;
}

class OnlineNotificationLoggerService {
  private deviceId: string;
  private retryQueue: OnlineNotificationLog[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.setupNetworkMonitoring();
    this.processRetryQueue();
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processRetryQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async processRetryQueue() {
    if (!this.isOnline || this.retryQueue.length === 0) return;

    const logs = [...this.retryQueue];
    this.retryQueue = [];

    for (const log of logs) {
      try {
        await this.sendLogDirectly(log);
      } catch (error) {
        console.error('Failed to send queued log:', error);
        this.retryQueue.push(log);
      }
    }
  }

  private async sendLogDirectly(log: OnlineNotificationLog): Promise<void> {
    const { error } = await supabase
      .from('notification_logs')
      .insert([log]);

    if (error) {
      throw error;
    }
  }

  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('auth_user');
      if (authData) {
        const user = JSON.parse(authData);
        return user?.id;
      }
    } catch (e) {
      console.warn('Failed to get user ID:', e);
    }
    return undefined;
  }

  private getDeviceInfo(): Record<string, any> {
    return {
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      memory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      connection: (navigator as any).connection?.effectiveType,
    };
  }

  private getPlatformInfo(): { platform: string; browser: string; osVersion: string } {
    const userAgent = navigator.userAgent;
    
    let platform = 'unknown';
    let browser = 'unknown';
    let osVersion = 'unknown';

    // Detect platform
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      platform = 'ios';
      const match = userAgent.match(/OS (\d+_\d+)/);
      osVersion = match ? match[1].replace('_', '.') : 'unknown';
    } else if (/Android/.test(userAgent)) {
      platform = 'android';
      const match = userAgent.match(/Android (\d+\.?\d*)/);
      osVersion = match ? match[1] : 'unknown';
    } else if (/Windows/.test(userAgent)) {
      platform = 'windows';
    } else if (/Mac/.test(userAgent)) {
      platform = 'macos';
    } else if (/Linux/.test(userAgent)) {
      platform = 'linux';
    }

    // Detect browser
    if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
      browser = 'chrome';
    } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      browser = 'safari';
    } else if (/Firefox/.test(userAgent)) {
      browser = 'firefox';
    } else if (/Edge/.test(userAgent)) {
      browser = 'edge';
    }

    return { platform, browser, osVersion };
  }

  public async logNotification(entry: NotificationLogEntry): Promise<void> {
    const { platform, browser, osVersion } = this.getPlatformInfo();
    
    const onlineLog: OnlineNotificationLog = {
      user_id: this.getCurrentUserId(),
      device_id: this.deviceId,
      timestamp: new Date(entry.timestamp).toISOString(),
      log_type: entry.type,
      action: entry.action,
      status: entry.status,
      platform,
      browser,
      os_version: osVersion,
      device_info: this.getDeviceInfo(),
      notification_data: entry.data,
      error_message: entry.error,
      error_stack: entry.stackTrace,
      user_agent: navigator.userAgent,
    };

    try {
      if (this.isOnline) {
        await this.sendLogDirectly(onlineLog);
      } else {
        this.retryQueue.push(onlineLog);
      }
    } catch (error) {
      console.error('Failed to send notification log online:', error);
      this.retryQueue.push(onlineLog);
    }
  }

  public async logError(message: string, stack?: string, additionalData?: Record<string, any>): Promise<void> {
    const { platform, browser, osVersion } = this.getPlatformInfo();
    
    const errorLog: OnlineNotificationLog = {
      user_id: this.getCurrentUserId(),
      device_id: this.deviceId,
      timestamp: new Date().toISOString(),
      log_type: 'error',
      action: 'console_error',
      status: 'error',
      platform,
      browser,
      os_version: osVersion,
      device_info: this.getDeviceInfo(),
      notification_data: additionalData,
      error_message: message,
      error_stack: stack,
      user_agent: navigator.userAgent,
    };

    try {
      if (this.isOnline) {
        await this.sendLogDirectly(errorLog);
      } else {
        this.retryQueue.push(errorLog);
      }
    } catch (error) {
      console.error('Failed to send error log online:', error);
      this.retryQueue.push(errorLog);
    }
  }

  public async getOnlineLogs(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch online logs:', error);
      return [];
    }
  }

  public async getDeviceLogs(deviceId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('device_id', deviceId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch device logs:', error);
      return [];
    }
  }

  public async getUserLogs(userId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch user logs:', error);
      return [];
    }
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getRetryQueueSize(): number {
    return this.retryQueue.length;
  }
}

export const onlineNotificationLogger = new OnlineNotificationLoggerService();
export type { OnlineNotificationLog };