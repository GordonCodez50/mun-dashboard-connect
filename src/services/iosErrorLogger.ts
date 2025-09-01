/**
 * iOS-specific error logger and diagnostics
 * Captures iOS Safari-specific issues that might cause the debug page to fail
 */

import { onlineNotificationLogger } from '@/services/onlineNotificationLogger';

interface IOSError {
  type: 'ios_debug_error' | 'ios_api_error' | 'ios_memory_error' | 'ios_compatibility_error';
  message: string;
  stack?: string;
  context: {
    userAgent: string;
    viewport: string;
    memoryInfo?: any;
    storage?: any;
    apis: Record<string, boolean>;
  };
}

class IOSErrorLogger {
  private isIOS: boolean;
  
  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.setupIOSErrorHandlers();
  }

  private setupIOSErrorHandlers() {
    if (!this.isIOS) return;

    // Capture iOS-specific unhandled rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logIOSError({
        type: 'ios_debug_error',
        message: `iOS Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: this.getIOSContext()
      });
    });

    // Capture iOS memory warnings
    window.addEventListener('pagehide', () => {
      this.logIOSError({
        type: 'ios_memory_error',
        message: 'iOS page being unloaded - possible memory pressure',
        context: this.getIOSContext()
      });
    });

    // Check for iOS compatibility issues on load
    this.checkIOSCompatibility();
  }

  public getIOSContext() {
    const context: any = {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      apis: {}
    };

    // Check storage availability
    try {
      const testKey = 'ios_test_storage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      context.storage = { localStorage: true };
    } catch (e) {
      context.storage = { localStorage: false, error: e.message };
    }

    // Check memory info (Chrome on Android/Desktop only)
    if ((navigator as any).deviceMemory) {
      context.memoryInfo = {
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency
      };
    }

    // Test various APIs
    context.apis = {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'serviceWorker' in navigator && 'PushManager' in window,
      notification: 'Notification' in window,
      battery: 'getBattery' in navigator,
      connection: 'connection' in navigator,
      share: 'share' in navigator,
      clipboard: 'clipboard' in navigator,
      vibrate: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      webGL: this.testWebGL(),
      indexedDB: 'indexedDB' in window,
      webWorker: typeof Worker !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      crypto: 'crypto' in window,
      performance: 'performance' in window
    };

    return context;
  }

  private testWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  private checkIOSCompatibility() {
    const issues: string[] = [];
    const context = this.getIOSContext();

    // Check for common iOS issues
    if (!context.apis.serviceWorker) {
      issues.push('Service Workers not supported');
    }

    if (!context.apis.notification) {
      issues.push('Notifications API not available');
    }

    if (!context.apis.indexedDB) {
      issues.push('IndexedDB not available');
    }

    if (context.storage && !context.storage.localStorage) {
      issues.push('localStorage not available or quota exceeded');
    }

    // Check viewport size (iOS Safari has specific constraints)
    if (window.innerWidth < 320 || window.innerHeight < 480) {
      issues.push('Viewport size may be too small for debug interface');
    }

    // Check for iOS version-specific issues
    const iosVersion = this.getIOSVersion();
    if (iosVersion && iosVersion < 14) {
      issues.push(`iOS ${iosVersion} may have compatibility issues`);
    }

    if (issues.length > 0) {
      this.logIOSError({
        type: 'ios_compatibility_error',
        message: `iOS Compatibility Issues Detected: ${issues.join(', ')}`,
        context
      });
    }
  }

  private getIOSVersion(): number | null {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  public logIOSError(error: IOSError) {
    if (!this.isIOS) return;

    console.error('[iOS Error Logger]', error);

    // Send to online logger
    onlineNotificationLogger.logError(
      `iOS Debug Error: ${error.message}`,
      error.stack,
      {
        type: error.type,
        iosContext: error.context,
        timestamp: new Date().toISOString(),
        debugPageError: true
      }
    ).catch(e => {
      console.warn('Failed to send iOS error to online logger:', e);
    });
  }

  public logDebugPageLoad() {
    if (!this.isIOS) return;

    this.logIOSError({
      type: 'ios_debug_error',
      message: 'iOS Debug page load attempt',
      context: this.getIOSContext()
    });
  }

  public testIOSFeatures(): Record<string, any> {
    const context = this.getIOSContext();
    
    // Test specific features that might cause issues
    const tests = {
      memoryTest: this.testMemoryUsage(),
      storageTest: this.testStorageQuota(),
      apiTest: context.apis,
      performanceTest: this.testPerformance()
    };

    this.logIOSError({
      type: 'ios_debug_error',
      message: 'iOS Feature Test Results',
      context: { ...context, tests }
    });

    return tests;
  }

  private testMemoryUsage(): any {
    try {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      }
      return { available: false };
    } catch (e) {
      return { error: e.message };
    }
  }

  private testStorageQuota(): any {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return navigator.storage.estimate();
      }
      return { available: false };
    } catch (e) {
      return { error: e.message };
    }
  }

  private testPerformance(): any {
    try {
      const start = performance.now();
      // Simple CPU test
      let sum = 0;
      for (let i = 0; i < 100000; i++) {
        sum += Math.random();
      }
      const end = performance.now();
      
      return {
        cpuTestTime: end - start,
        performanceAvailable: true,
        timingAvailable: 'timing' in performance
      };
    } catch (e) {
      return { error: e.message };
    }
  }
}

export const iosErrorLogger = new IOSErrorLogger();