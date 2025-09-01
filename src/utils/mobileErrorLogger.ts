/**
 * iOS and Mobile-specific error logging utility
 * Captures errors that might not appear in regular console logs on mobile devices
 */

interface MobileError {
  timestamp: number;
  type: 'javascript' | 'network' | 'resource' | 'render';
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  isIOS: boolean;
  isMobile: boolean;
}

const STORAGE_KEY = 'mobile_error_logs';
const MAX_LOGS = 50;

class MobileErrorLogger {
  private isIOS: boolean;
  private isMobile: boolean;

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.initializeErrorHandlers();
  }

  private initializeErrorHandlers() {
    // Global JavaScript error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        url: event.filename || window.location.href
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'javascript',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href
      });
    });

    // Resource loading error handler
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        this.logError({
          type: 'resource',
          message: `Failed to load resource: ${target.tagName} - ${(target as any).src || (target as any).href}`,
          url: window.location.href
        });
      }
    }, true);

    // iOS-specific viewport change handler (can cause rendering issues)
    if (this.isIOS) {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.logError({
            type: 'render',
            message: `iOS orientation change: ${window.orientation}°, viewport: ${window.innerWidth}x${window.innerHeight}`,
            url: window.location.href
          });
        }, 100);
      });
    }
  }

  private logError(errorData: Partial<MobileError>) {
    const error: MobileError = {
      timestamp: Date.now(),
      type: errorData.type || 'javascript',
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      userAgent: navigator.userAgent,
      url: errorData.url || window.location.href,
      isIOS: this.isIOS,
      isMobile: this.isMobile
    };

    // Log to console for immediate debugging
    console.error('[Mobile Error Logger]', error);

    // Log to audit service if user is a chair
    try {
      const authData = localStorage.getItem('auth_user');
      if (authData) {
        const user = JSON.parse(authData);
        if (user && user.role === 'chair') {
          import('@/services/auditLogService').then(({ auditLogService }) => {
            auditLogService.logConsoleError(error.message, error.stack, user);
          });
        }
      }
    } catch (e) {
      console.warn('Failed to log error to audit service:', e);
    }

    // Send to online notification logger
    try {
      import('@/services/onlineNotificationLogger').then(({ onlineNotificationLogger }) => {
        onlineNotificationLogger.logError(error.message, error.stack, {
          type: error.type,
          isIOS: error.isIOS,
          isMobile: error.isMobile,
          url: error.url
        });
      });
    } catch (e) {
      console.warn('Failed to send error to online logger:', e);
    }

    // Store in localStorage for persistence
    try {
      const existingLogs = this.getLogs();
      existingLogs.unshift(error);
      
      // Keep only the most recent logs
      const trimmedLogs = existingLogs.slice(0, MAX_LOGS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (e) {
      console.error('Failed to store error log:', e);
    }
  }

  public getLogs(): MobileError[] {
    try {
      const logs = localStorage.getItem(STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      console.error('Failed to retrieve error logs:', e);
      return [];
    }
  }

  public clearLogs() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Mobile error logs cleared');
    } catch (e) {
      console.error('Failed to clear error logs:', e);
    }
  }

  public getRecentLogs(count: number = 10): MobileError[] {
    return this.getLogs().slice(0, count);
  }

  public logInfo(message: string) {
    // Only log to console for info messages, don't treat as errors
    console.log('[Mobile Info]', message);
  }

  public logExternalError(errorData: Partial<MobileError>) {
    // Public method to log errors from external components
    return this.logError(errorData);
  }

  public exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

export const mobileErrorLogger = new MobileErrorLogger();
export type { MobileError };
