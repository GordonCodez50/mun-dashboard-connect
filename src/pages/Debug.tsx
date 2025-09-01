import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Info, Clipboard, Bell, Smartphone, Globe, Vibrate, Database, FileCode, Settings, Wifi, WifiOff, Network, Signal, ArrowLeft, BookOpen, Bug, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import {
  isAndroid, 
  isChrome, 
  isIOS,
  isSafari,
  isMacOS,
  isPwa,
  isIOSPwa,
  isIOSPwaWithNativeWebPush,
  isNotificationSupported,
  isWebPushSupported,
  isIOS164PlusWithWebPush,
  requestNotificationPermission,
  testNotification,
  playNotificationSound
} from "@/utils/crossPlatformNotifications";
import { getNotificationPermissionStatus } from "@/utils/notificationPermission";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { useTourContext } from "@/context/TourContext";
import { NotificationDiagnostics } from "@/components/debug/NotificationDiagnostics";
import { NotificationDeliveryStatus } from "@/components/debug/NotificationDeliveryStatus";
import { OnlineNotificationLogs } from "@/components/debug/OnlineNotificationLogs";
import {
  showCrossPlatformNotification, 
  testNotification as enhancedTestNotification,
  getNotificationStatus
} from "@/services/crossPlatformNotificationManager";
import { notificationLogger } from "@/services/notificationLogger";
import { iosErrorLogger } from "@/services/iosErrorLogger";
import { useBulkProfileSync } from "@/hooks/useBulkProfileSync";

// Status icons with colors
const StatusIcon = ({ status }: { status: 'success' | 'error' | 'info' | 'pending' }) => {
  if (status === 'success') return <Check className="h-5 w-5 text-green-500" />;
  if (status === 'error') return <X className="h-5 w-5 text-red-500" />;
  if (status === 'info') return <Info className="h-5 w-5 text-blue-500" />;
  return <span className="h-5 w-5 block bg-gray-200 rounded-full animate-pulse"></span>;
};

// Define browser detection function
const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";
  
  // Chrome detection
  if (/Chrome/.test(userAgent) && !/Chromium|Edge|Edg/.test(userAgent)) {
    browserName = "Chrome";
    browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || "Unknown";
  } 
  // Edge detection
  else if (/Edg/.test(userAgent)) {
    browserName = "Edge";
    browserVersion = userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || "Unknown";
  } 
  // Firefox detection
  else if (/Firefox/.test(userAgent)) {
    browserName = "Firefox";
    browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || "Unknown";
  } 
  // Safari detection
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browserName = "Safari";
    browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || "Unknown";
  } 
  // Opera detection
  else if (/OPR|Opera/.test(userAgent)) {
    browserName = "Opera";
    browserVersion = userAgent.match(/OPR\/(\d+\.\d+)/)?.[1] || 
                    userAgent.match(/Opera\/(\d+\.\d+)/)?.[1] || "Unknown";
  } 
  // IE detection
  else if (/MSIE|Trident/.test(userAgent)) {
    browserName = "Internet Explorer";
    browserVersion = userAgent.match(/MSIE (\d+\.\d+)/)?.[1] || "11.0";
  }
  
  return { browserName, browserVersion };
};

// Define OS detection function
const detectOS = () => {
  const userAgent = navigator.userAgent;
  let osName = "Unknown";
  let osVersion = "Unknown";
  
  if (/Windows NT/.test(userAgent)) {
    osName = "Windows";
    const version = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1];
    if (version === "10.0") osVersion = "10/11";
    else if (version === "6.3") osVersion = "8.1";
    else if (version === "6.2") osVersion = "8";
    else if (version === "6.1") osVersion = "7";
    else if (version === "6.0") osVersion = "Vista";
    else if (version === "5.1") osVersion = "XP";
    else osVersion = version || "Unknown";
  } else if (/Macintosh/.test(userAgent)) {
    osName = "macOS";
    osVersion = userAgent.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace("_", ".") || "Unknown";
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    osName = "iOS";
    osVersion = userAgent.match(/OS (\d+[._]\d+)/)?.[1]?.replace("_", ".") || "Unknown";
  } else if (/Android/.test(userAgent)) {
    osName = "Android";
    osVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] || "Unknown";
  } else if (/Linux/.test(userAgent)) {
    osName = "Linux";
    osVersion = "Unknown"; // Linux version not typically exposed in UA
  }
  
  return { osName, osVersion };
};

const Debug = () => {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("browser");
  const [browserInfo, setBrowserInfo] = useState({ browserName: "", browserVersion: "" });
  const [osInfo, setOsInfo] = useState({ osName: "", osVersion: "" });
  const { isSupported, permissionGranted, requestPermission } = useNotifications();
  const { startTour } = useTourContext();
  const navigate = useNavigate();
  
  // Bulk sync hook
  const { syncAllFirebaseUsersToSupabase, loading: syncLoading } = useBulkProfileSync();

  // Test result states
  const [vibrationSupported, setVibrationSupported] = useState<boolean | null>(null);
  const [clipboardStatus, setClipboardStatus] = useState<'success' | 'error' | 'info' | 'pending'>('info');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'success' | 'error' | 'info' | 'pending'>('info');
  const [localStorageStatus, setLocalStorageStatus] = useState<'success' | 'error' | 'info' | 'pending'>('info');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  
  // Benchmarker states
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, { status: 'success' | 'error' | 'info'; message: string; time?: number }>>({});
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  
  // Network status states
  const [pingStatus, setPingStatus] = useState<'success' | 'error' | 'info' | 'pending'>('info');
  const [pingTime, setPingTime] = useState<number | null>(null);
  const [connectionType, setConnectionType] = useState<string>("unknown");
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  const passwordRef = useRef<HTMLInputElement>(null);

  // Run comprehensive benchmark
  const runBenchmark = async () => {
    setBenchmarkRunning(true);
    setBenchmarkProgress(0);
    setBenchmarkResults({});
    
    const tests = [
      {
        name: 'Environment Detection',
        test: async () => {
          const browser = detectBrowser();
          const os = detectOS();
          return `${browser.browserName} ${browser.browserVersion} on ${os.osName} ${os.osVersion}`;
        }
      },
      {
        name: 'Notification Permission',
        test: async () => {
          if (!isNotificationSupported()) throw new Error('Notifications not supported');
          return `Permission: ${getNotificationPermissionStatus()}`;
        }
      },
      {
        name: 'FCM Support',
        test: async () => {
          // Skip FCM test on iOS Safari to prevent Firebase errors
          if (isIOS() && isSafari() && !isPwa()) {
            throw new Error('FCM not supported on iOS Safari');
          }
          if (!notificationService.isFcmSupported()) throw new Error('FCM not supported');
          return 'FCM is supported';
        }
      },
      {
        name: 'Sound Playback',
        test: async () => {
          try {
            await playNotificationSound();
            return 'Sound playback works';
          } catch (e) {
            throw new Error('Sound playback failed');
          }
        }
      },
      {
        name: 'Vibration API',
        test: async () => {
          if (!('vibrate' in navigator)) throw new Error('Vibration not supported');
          navigator.vibrate(100);
          return 'Vibration works';
        }
      },
      {
        name: 'Clipboard API',
        test: async () => {
          if (!navigator.clipboard) throw new Error('Clipboard API not available');
          await navigator.clipboard.writeText('Benchmark test');
          return 'Clipboard write successful';
        }
      },
      {
        name: 'LocalStorage',
        test: async () => {
          const testKey = 'benchmark-test';
          const testValue = 'working';
          localStorage.setItem(testKey, testValue);
          const retrieved = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          if (retrieved !== testValue) throw new Error('Storage test failed');
          return 'LocalStorage works';
        }
      },
      {
        name: 'Service Workers',
        test: async () => {
          if (!('serviceWorker' in navigator)) throw new Error('Service Workers not supported');
          const registrations = await navigator.serviceWorker.getRegistrations();
          return `${registrations.length} service workers registered`;
        }
      },
      {
        name: 'Network Latency',
        test: async () => {
          const startTime = performance.now();
          await fetch('https://www.google.com/favicon.ico', { 
            method: 'HEAD', 
            cache: 'no-store', 
            mode: 'no-cors' 
          });
          const latency = Math.round(performance.now() - startTime);
          return `${latency}ms latency`;
        }
      },
      {
        name: 'Device APIs',
        test: async () => {
          const apis = [];
          if ('geolocation' in navigator) apis.push('Geolocation');
          if ('mediaDevices' in navigator) apis.push('MediaDevices');
          if ('share' in navigator) apis.push('WebShare');
          if ('credentials' in navigator) apis.push('Credentials');
          return apis.length > 0 ? `${apis.join(', ')} available` : 'No advanced APIs';
        }
      }
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const startTime = performance.now();
      
      try {
        const result = await test.test();
        const time = Math.round(performance.now() - startTime);
        setBenchmarkResults(prev => ({
          ...prev,
          [test.name]: { status: 'success', message: result, time }
        }));
      } catch (error) {
        const time = Math.round(performance.now() - startTime);
        setBenchmarkResults(prev => ({
          ...prev,
          [test.name]: { status: 'error', message: (error as Error).message, time }
        }));
      }
      
      setBenchmarkProgress(Math.round(((i + 1) / tests.length) * 100));
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setBenchmarkRunning(false);
    toast.success('Benchmark completed!');
  };

  // Copy benchmark results to clipboard
  const copyBenchmarkResults = async () => {
    const report = Object.entries(benchmarkResults)
      .map(([name, result]) => `${name}: ${result.status.toUpperCase()} - ${result.message} (${result.time}ms)`)
      .join('\n');
    
    const fullReport = `MUN Dashboard Debug Benchmark Report
Generated: ${new Date().toISOString()}
Browser: ${browserInfo.browserName} ${browserInfo.browserVersion}
OS: ${osInfo.osName} ${osInfo.osVersion}

Test Results:
${report}

Environment Details:
- PWA Mode: ${isPwa() ? 'Yes' : 'No'}
- Notification Support: ${isNotificationSupported() ? 'Yes' : 'No'}
- FCM Support: ${notificationService.isFcmSupported() ? 'Yes' : 'No'}
- Connection Type: ${connectionType}
- Online Status: ${isOnline ? 'Online' : 'Offline'}`;

    try {
      await navigator.clipboard.writeText(fullReport);
      toast.success('Benchmark report copied to clipboard');
    } catch (e) {
      toast.error('Failed to copy report');
    }
  };

  // Handle going back to the settings page
  const handleGoBack = () => {
    navigate('/settings');
  };

  // Initialize with browser and OS detection
  useEffect(() => {
    if (authorized) {
      const browser = detectBrowser();
      const os = detectOS();
      setBrowserInfo(browser);
      setOsInfo(os);
      
      // Log iOS detection for debugging
      if (isIOS()) {
        const iosContext = {
          isIOS: isIOS(),
          isSafari: isSafari(),
          isPwa: isPwa(),
          isIOSPwa: isIOS() && isPwa(),
          isIOSPwaWithNativeWebPush: isIOS() && isPwa() && isIOS164PlusWithWebPush(),
          iosVersion: navigator.userAgent.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || 'Unknown',
          webPushSupported: isWebPushSupported(),
          notificationSupported: isNotificationSupported(),
          serviceWorkerSupported: 'serviceWorker' in navigator,
          pushManagerSupported: 'PushManager' in window,
          userAgent: navigator.userAgent
        };
        
        console.log('iOS device detected in Debug page:', iosContext);
        
        // Log that we're on iOS to help with debugging
        iosErrorLogger.logDebugPageLoad();
      }
      
      // Check vibration support
      setVibrationSupported('vibrate' in navigator);
      
      // Check service worker support
      setServiceWorkerStatus('serviceWorker' in navigator ? 'success' : 'error');
      
      // Check localStorage
      try {
        localStorage.setItem('debug-test', 'working');
        const testValue = localStorage.getItem('debug-test');
        setLocalStorageStatus(testValue === 'working' ? 'success' : 'error');
        localStorage.removeItem('debug-test');
      } catch (e) {
        setLocalStorageStatus('error');
      }
      
      // Gather test results for additional info
      setTestResults({
        'User Agent': navigator.userAgent,
        'Platform': navigator.platform,
        'Window Width': `${window.innerWidth}px`,
        'Window Height': `${window.innerHeight}px`,
        'Device Pixel Ratio': `${window.devicePixelRatio}`,
        'Color Depth': `${window.screen.colorDepth} bits`,
        'Is PWA': isPwa() ? 'Yes' : 'No',
        'iOS PWA Mode': isIOS() && isPwa() ? 'Yes' : 'No',
        'iOS PWA Native Push': isIOS() && isPwa() && isIOS164PlusWithWebPush() ? 'Yes' : 'No',
        'Media Session API': 'mediaSession' in navigator ? 'Yes' : 'No',
        'Web Push Support': isWebPushSupported() ? 'Yes' : 'No',
        'Notification Support': isNotificationSupported() ? 'Yes' : 'No',
        'iOS 16.4+ PWA': isIOS164PlusWithWebPush() ? 'Yes' : 'No',
        'Permission Status': getNotificationPermissionStatus(),
        'FCM Supported': notificationService.isFcmSupported() ? 'Yes' : 'No',
      });

      // Check connection type (with iOS safety)
      if ('connection' in navigator && !isIOS()) {
        try {
          // @ts-ignore - TypeScript doesn't know about navigator.connection
          const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
          if (conn) {
            setConnectionType(conn.effectiveType || "unknown");
            // Update connection type when it changes
            conn.addEventListener('change', () => {
              setConnectionType(conn.effectiveType || "unknown");
              determineConnectionQuality(conn.effectiveType);
            });
            determineConnectionQuality(conn.effectiveType);
          }
        } catch (e) {
          console.log('Connection API not available or failed:', e);
          if (isIOS()) {
            iosErrorLogger.logIOSError({
              type: 'ios_api_error',
              message: `Connection API error on iOS: ${e.message}`,
              context: iosErrorLogger.getIOSContext()
            });
          }
        }
      } else if (isIOS()) {
        // iOS doesn't support navigator.connection, use alternative detection
        setConnectionType("iOS - Detection Limited");
      }

      // Online/offline detection
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
      
      // Run initial ping test
      testNetworkLatency();
    }
  }, [authorized]);

  // Handle password verification
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "DebugGGEJT") {
      setAuthorized(true);
    } else {
      toast.error("Incorrect password");
      setPassword("");
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  };

  // Test vibration
  const testVibration = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
        toast.success("Vibration triggered");
        return true;
      } catch (e) {
        toast.error("Vibration failed: " + (e as Error).message);
        return false;
      }
    } else {
      toast.info("Vibration API not supported");
      return false;
    }
  };

  // Test clipboard
  const testClipboard = async () => {
    setClipboardStatus('pending');
    try {
      await navigator.clipboard.writeText("Debug test: Clipboard working!");
      setClipboardStatus('success');
      toast.success("Text copied to clipboard");
      return true;
    } catch (e) {
      setClipboardStatus('error');
      toast.error("Clipboard access failed: " + (e as Error).message);
      return false;
    }
  };

  // Test localStorage
  const testLocalStorage = () => {
    setLocalStorageStatus('pending');
    try {
      const testValue = `test-${Date.now()}`;
      localStorage.setItem('debug-test-key', testValue);
      const readValue = localStorage.getItem('debug-test-key');
      
      if (readValue === testValue) {
        setLocalStorageStatus('success');
        localStorage.removeItem('debug-test-key');
        toast.success("LocalStorage working correctly");
        return true;
      } else {
        setLocalStorageStatus('error');
        toast.error("LocalStorage read/write mismatch");
        return false;
      }
    } catch (e) {
      setLocalStorageStatus('error');
      toast.error("LocalStorage error: " + (e as Error).message);
      return false;
    }
  };

  // Test service worker registration
  const testServiceWorker = async () => {
    setServiceWorkerStatus('pending');
    
    if (!('serviceWorker' in navigator)) {
      setServiceWorkerStatus('error');
      toast.error("Service Workers not supported");
      return false;
    }
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      setTestResults(prev => ({
        ...prev,
        'Service Workers': `${registrations.length} registered`,
        'Service Worker Scopes': registrations.map(r => r.scope).join(', ') || 'None'
      }));
      
      setServiceWorkerStatus('success');
      toast.success(`${registrations.length} service worker(s) registered`);
      return true;
    } catch (e) {
      setServiceWorkerStatus('error');
      toast.error("Service Worker error: " + (e as Error).message);
      return false;
    }
  };

  // Enhanced notification test with comprehensive logging and Android diagnostics
  const handleNotificationTest = async () => {
    try {
      // Log notification test attempt
      notificationLogger.logDebug('notification_test_start', 'Starting comprehensive notification test');
      
      // Special handling for iOS Safari to prevent Firebase messaging errors
      if (isIOS() && isSafari() && !isPwa()) {
        toast.info("iOS Safari detected - using fallback notification mechanism");
        notificationLogger.logDebug('ios_safari_fallback', 'Using fallback for iOS Safari');
        
        // Use fallback notification mechanism
        const fallbackResult = await testNotification();
        if (fallbackResult) {
          toast.success("Fallback notification test completed");
        } else {
          toast.error("Fallback notification test failed");
        }
        return;
      }
      
      // Check notification status first
      const status = getNotificationStatus();
      console.log('Notification status:', status);
      
      if (!permissionGranted) {
        toast.error("Notification permission not granted");
        notificationLogger.logPermissionRequest('error', Notification.permission, 'Permission not granted during test');
        return;
      }

      // Test with enhanced notification service
      const testResult = await enhancedTestNotification();
      
      if (testResult) {
        // Wait a moment then check if notification was actually visible
        setTimeout(async () => {
          await checkNotificationVisibility();
        }, 2000);
        
        toast.success("Test notification sent - checking visibility in 2 seconds...");
        notificationLogger.logDebug('notification_test_success', 'Test notification sent successfully');
      } else {
        toast.error("Failed to show notification - check Notification Logs tab for details");
        notificationLogger.logDebug('notification_test_failure', 'Test notification failed to send');
      }
      
    } catch (error) {
      console.error('Enhanced notification test failed:', error);
      notificationLogger.logDebug('notification_test_error', 'Test failed with exception', error);
      toast.error(`Notification test failed: ${error}`);
    }
  };

  // Check if notification was actually visible (platform-specific detection)
  const checkNotificationVisibility = async () => {
    try {
      if (isAndroid() && !isIOS()) {
        // Android-specific visibility checks (exclude iOS Safari that might report as Android)
        const androidChecks = await performAndroidNotificationChecks();
        
        if (androidChecks.potentialIssues.length > 0) {
          toast.warning(`Android issues detected: ${androidChecks.potentialIssues.join(', ')}`);
          notificationLogger.logDebug('android_visibility_check', 'Issues detected', androidChecks);
        } else {
          toast.success("No Android notification blocking detected");
          notificationLogger.logDebug('android_visibility_check', 'No issues detected');
        }
      } else if (isIOS()) {
        // iOS-specific checks (simplified to avoid API compatibility issues)
        toast.info("iOS notification test completed - check system notification settings if needed");
        notificationLogger.logDebug('ios_visibility_check', 'iOS notification test completed');
      }
      
      // Generic visibility check using document visibility
      if (document.hidden) {
        toast.info("App was backgrounded - notification should be visible");
        notificationLogger.logDebug('visibility_check', 'App backgrounded, notification should show');
      } else {
        toast.info("App still focused - notification might be suppressed by system");
        notificationLogger.logDebug('visibility_check', 'App focused, potential suppression');
      }
    } catch (error) {
      console.error('Visibility check failed:', error);
      notificationLogger.logDebug('visibility_check_error', 'Visibility check failed', error);
    }
  };

  // Android-specific notification diagnostic checks
  const performAndroidNotificationChecks = async () => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Early exit for iOS to prevent any potential conflicts
    if (isIOS()) {
      console.log('Skipping Android checks on iOS device');
      return { potentialIssues: [], recommendations: [] };
    }
    
    try {
      // Check battery optimization (only on Android with proper API check)
      if (isAndroid() && typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          // Additional safety check for iOS devices that might report false positives
          if (!isIOS() && typeof (navigator as any).getBattery === 'function') {
            const battery = await (navigator as any).getBattery();
            if (battery && typeof battery.level === 'number' && !battery.charging && battery.level < 0.15) {
              issues.push('Low battery may suppress notifications');
              recommendations.push('Charge device or disable battery optimization');
            }
          }
        } catch (e) {
          // Battery API not available, permission denied, or not supported on this platform
          console.log('Battery API check failed (this is normal on iOS):', e);
        }
      }
      
      // Check service worker status
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) {
          issues.push('No service worker registered');
          recommendations.push('Service worker required for reliable notifications');
        } else {
          const activeWorker = registrations.find(reg => reg.active);
          if (!activeWorker) {
            issues.push('Service worker not active');
          }
        }
      }
      
      // Check if we're in a PWA or regular browser
      if (!isPwa()) {
        recommendations.push('Install as PWA for better notification reliability');
      }
      
      // Try a visibility test with a silent notification (only on Android, not iOS)
      if (isAndroid() && !isIOS() && Notification.permission === 'granted') {
        try {
          // Additional check to ensure we're really on Android and not iOS Safari
          if (navigator.userAgent.toLowerCase().includes('android')) {
            // Use ServiceWorkerRegistration.showNotification for Android
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.ready;
              if (registration) {
                await registration.showNotification('Visibility Test', {
                  body: 'Testing Android notification visibility',
                  icon: '/logo.png',
                  silent: true,
                  requireInteraction: false,
                  tag: 'visibility-test'
                });
              }
            } else {
              // Fallback for browsers without service worker support
              const testNotif = new Notification('Visibility Test', {
                body: 'Testing Android notification visibility',
                icon: '/logo.png',
                silent: true,
                requireInteraction: false,
                tag: 'visibility-test'
              });
              
              // Close immediately to avoid spam
              setTimeout(() => testNotif.close(), 100);
            }
            
            notificationLogger.logDebug('android_visibility_test', 'Silent test notification created');
          }
        } catch (e) {
          issues.push('Failed to create test notification');
          notificationLogger.logDebug('android_visibility_test_error', 'Failed to create test notification', e);
        }
      }
      
    } catch (error) {
      console.error('Android checks failed:', error);
      issues.push('Could not complete all Android checks');
      notificationLogger.logDebug('android_checks_error', 'Android diagnostic checks failed', error);
    }
    
    return {
      potentialIssues: issues,
      recommendations: recommendations
    };
  };

  // Run comprehensive Android diagnostics
  const runAndroidDiagnostics = async () => {
    if (!isAndroid() || isIOS()) {
      toast.info("Android diagnostics are only available on Android devices");
      return;
    }

    toast.info("Running comprehensive Android notification diagnostics...");
    notificationLogger.logDebug('android_diagnostics_start', 'Starting comprehensive Android diagnostics');

    try {
      const diagnostics = await performAndroidNotificationChecks();
      
      // Show results
      if (diagnostics.potentialIssues.length === 0) {
        toast.success("✅ No Android notification issues detected!");
      } else {
        toast.warning(`⚠️ Found ${diagnostics.potentialIssues.length} potential issues`);
      }

      // Show recommendations
      if (diagnostics.recommendations.length > 0) {
        setTimeout(() => {
          toast.info(`💡 Recommendations: ${diagnostics.recommendations.join('; ')}`);
        }, 1000);
      }

      // Log detailed results
      notificationLogger.logDebug('android_diagnostics_complete', 'Android diagnostics completed', {
        issuesFound: diagnostics.potentialIssues.length,
        recommendationsProvided: diagnostics.recommendations.length,
        issues: diagnostics.potentialIssues,
        recommendations: diagnostics.recommendations
      });

      // Test notification delivery with detailed tracking
      setTimeout(async () => {
        toast.info("Testing notification delivery...");
        await testNotificationWithDeliveryTracking();
      }, 2000);

    } catch (error) {
      console.error('Android diagnostics failed:', error);
      toast.error(`Diagnostics failed: ${error}`);
      notificationLogger.logDebug('android_diagnostics_error', 'Android diagnostics failed', error);
    }
  };

  // Run comprehensive iOS diagnostics (only in PWA mode)
  const runIOSDiagnostics = async () => {
    if (!isIOS() || !isPwa()) {
      toast.info("iOS diagnostics are only available on iOS devices in PWA mode");
      return;
    }

    toast.info("Running comprehensive iOS notification diagnostics...");
    notificationLogger.logDebug('ios_diagnostics_start', 'Starting comprehensive iOS diagnostics');

    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check iOS-specific capabilities
      const context = iosErrorLogger.getIOSContext();
      
      // Check PWA installation
      if (isPwa()) {
        recommendations.push('✅ Running as PWA - optimal for notifications');
      } else {
        issues.push('Not running as PWA - limited notification support');
        recommendations.push('Install as PWA for full notification support');
      }

      // Check iOS version for Web Push support
      if (isIOS164PlusWithWebPush()) {
        recommendations.push('✅ iOS 16.4+ detected - Web Push supported');
      } else {
        issues.push('iOS version may not support Web Push');
        recommendations.push('Update to iOS 16.4+ for better notification support');
      }

      // Check notification permission
      if (Notification.permission === 'granted') {
        recommendations.push('✅ Notification permission granted');
      } else if (Notification.permission === 'denied') {
        issues.push('Notification permission denied');
        recommendations.push('Enable notifications in iOS Settings > Safari > Notifications');
      } else {
        issues.push('Notification permission not requested');
        recommendations.push('Request notification permission first');
      }

      // Check service worker support
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          recommendations.push('✅ Service Worker registered');
        } else {
          issues.push('No service worker registered');
          recommendations.push('Service worker needed for reliable notifications');
        }
      } else {
        issues.push('Service Worker not supported');
      }

      // Check for Safari-specific limitations
      if (isSafari() && isPwa()) {
        recommendations.push('✅ Running in Safari PWA mode');
      } else if (isSafari()) {
        issues.push('Running in Safari browser - limited features');
        recommendations.push('Add to Home Screen for full PWA experience');
      }

      // Show results
      if (issues.length === 0) {
        toast.success("✅ No iOS notification issues detected!");
      } else {
        toast.warning(`⚠️ Found ${issues.length} potential issues`);
      }

      // Show recommendations
      if (recommendations.length > 0) {
        setTimeout(() => {
          toast.info(`💡 iOS Recommendations: ${recommendations.join('; ')}`);
        }, 1000);
      }

      // Log detailed results
      notificationLogger.logDebug('ios_diagnostics_complete', 'iOS diagnostics completed', {
        issuesFound: issues.length,
        recommendationsProvided: recommendations.length,
        issues: issues,
        recommendations: recommendations,
        iosContext: context
      });

      // Run iOS feature test
      setTimeout(() => {
        toast.info("Running iOS compatibility test...");
        const testResults = iosErrorLogger.testIOSFeatures();
        console.log('iOS Feature Test Results:', testResults);
        toast.success("iOS compatibility test completed - check console and logs");
      }, 2000);

    } catch (error) {
      console.error('iOS diagnostics failed:', error);
      toast.error(`iOS diagnostics failed: ${error}`);
      notificationLogger.logDebug('ios_diagnostics_error', 'iOS diagnostics failed', error);
      iosErrorLogger.logIOSError({
        type: 'ios_debug_error',
        message: `iOS diagnostics failed: ${error}`,
        context: iosErrorLogger.getIOSContext()
      });
    }
  };

  // Test notification with delivery tracking
  const testNotificationWithDeliveryTracking = async () => {
    try {
      const deliveryId = `delivery_${Date.now()}`;
      let notificationShown = false;
      let notificationClicked = false;

      // Create notification with special tracking
      if (Notification.permission === 'granted') {
        let notification: Notification | null = null;
        
        // Use ServiceWorkerRegistration.showNotification for Android
        if (isAndroid() && 'serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            if (registration) {
              await registration.showNotification('🔍 Delivery Test', {
                body: 'Testing notification delivery tracking - this will auto-close',
                icon: '/logo.png',
                tag: deliveryId,
                data: { deliveryId },
                requireInteraction: false,
                silent: false
              });
              notificationShown = true;
            }
          } catch (swError) {
            console.warn('ServiceWorker notification failed, falling back to direct Notification:', swError);
            notification = new Notification('🔍 Delivery Test', {
              body: 'Testing notification delivery tracking - this will auto-close',
              icon: '/logo.png',
              tag: deliveryId,
              requireInteraction: false,
              silent: false
            });
            notificationShown = true;
          }
        } else {
          // For non-Android or when service worker not supported
          notification = new Notification('🔍 Delivery Test', {
            body: 'Testing notification delivery tracking - this will auto-close',
            icon: '/logo.png',
            tag: deliveryId,
            requireInteraction: false,
            silent: false
          });
          notificationShown = true;
        }

        notificationLogger.logNotificationShow('success', 'Delivery Test', {
          body: 'Testing notification delivery tracking',
          data: { deliveryId, trackingTest: true }
        });

        // Track click (only if using direct notification)
        if (notification) {
          notification.onclick = () => {
            notificationClicked = true;
            notificationLogger.logNotificationClick({
              title: 'Delivery Test',
              data: { deliveryId, trackingTest: true },
              timestamp: Date.now()
            });
            toast.success("✅ Notification click detected!");
            notification!.close();
          };

          // Auto-close after 3 seconds and show results
          setTimeout(() => {
            notification!.close();
            
            if (notificationShown && !notificationClicked) {
              toast.info("📱 Notification shown but not clicked - this is normal for auto-close");
            }
            
            // Final delivery report
            setTimeout(() => {
              toast.success(`📊 Delivery Test Complete: Shown=${notificationShown}, Clicked=${notificationClicked}`);
            }, 500);
            
          }, 3000);
        } else {
          // For service worker notifications, just show completion message
          setTimeout(() => {
            toast.success(`📊 Delivery Test Complete: Shown=${notificationShown}, Clicked=N/A (Service Worker)`);
          }, 3500);
        }

      } else {
        throw new Error('Notification permission not granted');
      }

    } catch (error) {
      console.error('Delivery tracking test failed:', error);
      toast.error(`Delivery test failed: ${error}`);
      notificationLogger.logDebug('delivery_tracking_error', 'Delivery tracking test failed', error);
    }
  };

  // Handle tour start
  const handleStartTour = () => {
    if (startTour) {
      startTour();
      toast.success("Tutorial started! Navigate to chair dashboard to see it.");
    } else {
      toast.error("Tour context not available");
    }
  };

  // Determine connection quality based on network type
  const determineConnectionQuality = (type: string) => {
    switch (type) {
      case '4g':
        setConnectionQuality('excellent');
        break;
      case '3g':
        setConnectionQuality('good');
        break;
      case '2g':
        setConnectionQuality('fair');
        break;
      case 'slow-2g':
        setConnectionQuality('poor');
        break;
      default:
        setConnectionQuality('good');
    }
  };

  // Test network latency by pinging multiple endpoints
  const testNetworkLatency = async () => {
    setPingStatus('pending');
    setPingTime(null);

    try {
      const startTime = performance.now();
      
      // Use a combination of techniques to test connection
      // 1. Fetch a small resource with cache busting parameter
      const fetchPromise = fetch(`https://www.google.com/favicon.ico?_=${Date.now()}`, { 
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors'
      });
      
      // Add a timeout to the fetch
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      // Race between fetch and timeout
      await Promise.race([fetchPromise, timeoutPromise]);
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      setPingTime(latency);
      setPingStatus('success');
      
      // Set connection quality based on latency
      if (latency < 100) {
        setConnectionQuality('excellent');
      } else if (latency < 300) {
        setConnectionQuality('good');
      } else if (latency < 600) {
        setConnectionQuality('fair');
      } else {
        setConnectionQuality('poor');
      }
      
      toast.success(`Network latency: ${latency}ms`);
    } catch (error) {
      console.error('Ping test failed:', error);
      setPingStatus('error');
      setConnectionQuality('poor');
      toast.error('Network test failed');
    }
  };

  // Get icon for connection quality
  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-5 w-5 text-red-500" />;
    
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'good':
        return <Signal className="h-5 w-5 text-green-400" />;
      case 'fair':
        return <Signal className="h-5 w-5 text-yellow-500" />;
      case 'poor':
        return <Signal className="h-5 w-5 text-red-500" />;
      default:
        return <Network className="h-5 w-5 text-blue-500" />;
    }
  };

  // Password protection screen
  if (!authorized) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* New standalone Go Back button at top left */}
        <div className="p-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2" 
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
        
        <div className="flex items-center justify-center flex-grow">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Debug Console</CardTitle>
              <CardDescription>Password protected area</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent>
                {/* iOS Safari Warning */}
                {isIOS() && isSafari() && !isPwa() && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                        iOS Safari Limitation
                      </p>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Some debug features may be limited on iOS Safari. Firebase messaging is disabled for compatibility.
                    </p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Password
                    </label>
                    <input
                      ref={passwordRef}
                      id="password"
                      type="password"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">Access Debug Console</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Main debug console UI
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={handleGoBack}
            aria-label="Go back to settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Debug Console</h1>
        </div>
        <Button variant="outline" onClick={() => setAuthorized(false)}>Lock Console</Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative mb-6 flex items-center gap-2">
          <button 
            className="hidden md:flex h-10 w-8 bg-background border border-border rounded-lg items-center justify-center shadow-sm hover:bg-accent transition-colors flex-shrink-0"
            onClick={() => {
              const tabsList = document.querySelector('[role="tablist"]');
              if (tabsList) {
                tabsList.scrollBy({ left: -100, behavior: 'smooth' });
              }
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex-1 overflow-hidden">
            <TabsList className="flex w-full h-12 overflow-x-auto scrollbar-hide gap-1 p-1 md:pl-3 md:pr-3 bg-muted rounded-lg justify-start"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <TabsTrigger value="browser" className="whitespace-nowrap flex-shrink-0 h-10">
                <Globe className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Browser & OS</span>
                <span className="sm:hidden">Browser</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="whitespace-nowrap flex-shrink-0 h-10">
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Notif</span>
              </TabsTrigger>
              <TabsTrigger value="notif-logs" className="whitespace-nowrap flex-shrink-0 h-10">
                <Bug className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Notification Logs</span>
                <span className="sm:hidden">Logs</span>
              </TabsTrigger>
              <TabsTrigger value="storage" className="whitespace-nowrap flex-shrink-0 h-10">
                <Database className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Storage & Workers</span>
                <span className="sm:hidden">Storage</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="whitespace-nowrap flex-shrink-0 h-10">
                <Network className="h-4 w-4 mr-2" />
                Network
              </TabsTrigger>
              <TabsTrigger value="benchmarker" className="whitespace-nowrap flex-shrink-0 h-10">
                <Check className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Benchmarker</span>
                <span className="sm:hidden">Bench</span>
              </TabsTrigger>
              <TabsTrigger value="apis" className="whitespace-nowrap flex-shrink-0 h-10">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">API Tests</span>
                <span className="sm:hidden">API</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="whitespace-nowrap flex-shrink-0 h-10">
                <Database className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Database</span>
                <span className="sm:hidden">DB</span>
              </TabsTrigger>
              <TabsTrigger value="tour" className="whitespace-nowrap flex-shrink-0 h-10">
                <BookOpen className="h-4 w-4 mr-2" />
                Tour
              </TabsTrigger>
            </TabsList>
          </div>

          <button 
            className="hidden md:flex h-10 w-8 bg-background border border-border rounded-lg items-center justify-center shadow-sm hover:bg-accent transition-colors flex-shrink-0"
            onClick={() => {
              const tabsList = document.querySelector('[role="tablist"]');
              if (tabsList) {
                tabsList.scrollBy({ left: 100, behavior: 'smooth' });
              }
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Browser & OS Tab */}
        <TabsContent value="browser" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browser Information</CardTitle>
              <CardDescription>Details about the current browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Browser Name</p>
                  <p className="text-lg">{browserInfo.browserName}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Browser Version</p>
                  <p className="text-lg">{browserInfo.browserVersion}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Operating System</p>
                  <p className="text-lg">{osInfo.osName}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">OS Version</p>
                  <p className="text-lg">{osInfo.osVersion}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Device Type</p>
                  <p className="text-lg">
                    {isIOS() ? "iOS Device" : 
                     isAndroid() ? "Android Device" : 
                     "Desktop"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Mode</p>
                  <p className="text-lg">{isPwa() ? "PWA Mode" : "Browser Mode"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Platform Capabilities</CardTitle>
              <CardDescription>Feature detection for current browser</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-3">
                <div className="flex items-center">
                  <StatusIcon status={isIOS() ? 'success' : 'info'} />
                  <span className="ml-2">iOS Device</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={isAndroid() ? 'success' : 'info'} />
                  <span className="ml-2">Android Device</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={isChrome() ? 'success' : 'info'} />
                  <span className="ml-2">Chrome Browser</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={isSafari() ? 'success' : 'info'} />
                  <span className="ml-2">Safari Browser</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={isMacOS() ? 'success' : 'info'} />
                  <span className="ml-2">macOS Platform</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={isPwa() ? 'success' : 'info'} />
                  <span className="ml-2">PWA Mode</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Capabilities</CardTitle>
              <CardDescription>Browser notification support and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Notifications Supported</p>
                  <div className="flex items-center mt-1">
                    <StatusIcon status={isSupported ? 'success' : 'error'} />
                    <span className="ml-2">{isSupported ? 'Supported' : 'Not Supported'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Permission Status</p>
                  <div className="flex items-center mt-1">
                    <StatusIcon 
                      status={
                        getNotificationPermissionStatus() === 'granted' ? 'success' : 
                        getNotificationPermissionStatus() === 'denied' ? 'error' : 
                        getNotificationPermissionStatus() === 'unsupported' ? 'error' : 'info'
                      } 
                    />
                    <span className="ml-2 capitalize">{getNotificationPermissionStatus()}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Web Push Supported</p>
                  <div className="flex items-center mt-1">
                    <StatusIcon status={isWebPushSupported() ? 'success' : 'error'} />
                    <span className="ml-2">{isWebPushSupported() ? 'Supported' : 'Not Supported'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">FCM Support</p>
                  <div className="flex items-center mt-1">
                    <StatusIcon status={notificationService.isFcmSupported() ? 'success' : 'error'} />
                    <span className="ml-2">{notificationService.isFcmSupported() ? 'Supported' : 'Not Supported'}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">iOS 16.4+ Web Push</p>
                  <div className="flex items-center mt-1">
                    <StatusIcon status={isIOS164PlusWithWebPush() ? 'success' : 'info'} />
                    <span className="ml-2">{isIOS164PlusWithWebPush() ? 'Available' : 'Not Available'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Safari Limitations</p>
                  <div className="flex items-center mt-1">
                    <StatusIcon status={notificationService.hasSafariLimitations() ? 'info' : 'success'} />
                    <span className="ml-2">
                      {notificationService.hasSafariLimitations() ? 'Has Limitations' : 'No Limitations'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={requestPermission} disabled={!isSupported || permissionGranted}>
                  Request Permission
                </Button>
                {isAndroid() ? (
                  <Button onClick={runAndroidDiagnostics} variant="outline">
                    Android Diagnostics
                  </Button>
                ) : isIOS() && isPwa() ? (
                  <Button onClick={runIOSDiagnostics} variant="outline">
                    iOS Diagnostics
                  </Button>
                ) : (
                  <Button onClick={handleNotificationTest} disabled={!permissionGranted}>
                    Test Notification
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    playNotificationSound();
                    toast.success("Sound played");
                  }}
                >
                  Test Sound
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Service Workers</CardTitle>
              <CardDescription>Service worker registration details</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={async () => {
                if ('serviceWorker' in navigator) {
                  try {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    setTestResults(prev => ({
                      ...prev,
                      'Service Workers': `${regs.length} registered`
                    }));
                    
                    toast.success(`Found ${regs.length} service workers`, {
                      description: regs.map(r => r.scope).join(', ') || 'No scopes'
                    });
                    
                  } catch (err) {
                    toast.error("Error checking service workers");
                  }
                } else {
                  toast.error("Service Workers not supported");
                }
              }}>
                Refresh Service Worker Status
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tests Tab */}
        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vibration API</CardTitle>
              <CardDescription>Test device vibration capability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <StatusIcon status={vibrationSupported ? 'success' : 'error'} />
                  <span className="ml-2">
                    {vibrationSupported 
                      ? 'Vibration API is supported' 
                      : 'Vibration API is not supported'}
                  </span>
                </div>
                <Button onClick={testVibration} disabled={!vibrationSupported}>
                  <Vibrate className="mr-2 h-4 w-4" />
                  Test Vibration
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clipboard API</CardTitle>
              <CardDescription>Test clipboard write functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <StatusIcon status={clipboardStatus} />
                  <span className="ml-2">
                    {clipboardStatus === 'success' ? 'Last test was successful' : 
                     clipboardStatus === 'error' ? 'Last test failed' :
                     clipboardStatus === 'pending' ? 'Test in progress...' :
                     'Not tested yet'}
                  </span>
                </div>
                <Button onClick={testClipboard}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  Write to Clipboard
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Browser APIs</CardTitle>
              <CardDescription>Additional browser capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <StatusIcon status={'geolocation' in navigator ? 'success' : 'error'} />
                  <span className="ml-2">Geolocation API</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={'mediaDevices' in navigator ? 'success' : 'error'} />
                  <span className="ml-2">Media Devices API</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={'Bluetooth' in navigator ? 'success' : 'error'} />
                  <span className="ml-2">Bluetooth API</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={'share' in navigator ? 'success' : 'error'} />
                  <span className="ml-2">Web Share API</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={'locks' in navigator ? 'success' : 'error'} />
                  <span className="ml-2">Web Locks API</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={'credentials' in navigator ? 'success' : 'error'} />
                  <span className="ml-2">Credentials API</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage & Workers Tab */}
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Local Storage</CardTitle>
              <CardDescription>Test browser storage capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <StatusIcon status={localStorageStatus} />
                  <span className="ml-2">
                    {localStorageStatus === 'success' ? 'LocalStorage is working' : 
                     localStorageStatus === 'error' ? 'LocalStorage test failed' :
                     localStorageStatus === 'pending' ? 'Test in progress...' :
                     'Not tested yet'}
                  </span>
                </div>
                <Button onClick={testLocalStorage}>
                  <Database className="mr-2 h-4 w-4" />
                  Test LocalStorage
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Workers</CardTitle>
              <CardDescription>Check service worker support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <StatusIcon status={serviceWorkerStatus} />
                  <span className="ml-2">
                    {serviceWorkerStatus === 'success' ? 'Service Workers supported' : 
                     serviceWorkerStatus === 'error' ? 'Service Workers not available' :
                     serviceWorkerStatus === 'pending' ? 'Checking service workers...' :
                     'Not tested yet'}
                  </span>
                </div>
                <Button onClick={testServiceWorker}>
                  <FileCode className="mr-2 h-4 w-4" />
                  Check Service Workers
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Debug Data</CardTitle>
              <CardDescription>Extended debug information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-64 text-sm">
                <table className="min-w-full">
                  <tbody>
                    {Object.entries(testResults).map(([key, value]) => (
                      <tr key={key} className="border-b border-gray-200">
                        <td className="py-2 pr-4 font-medium">{key}</td>
                        <td className="py-2">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Logs Tab */}
        <TabsContent value="notif-logs">
          <NotificationDiagnostics />
          
          <NotificationDeliveryStatus />
          
          <OnlineNotificationLogs />
          
          {/* iOS-specific debugging section */}
          {isIOS() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  iOS Debug Information
                </CardTitle>
                <CardDescription>
                  iOS-specific debugging and error tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => {
                    const results = iosErrorLogger.testIOSFeatures();
                    console.log('iOS Feature Test Results:', results);
                    toast("iOS Feature Test completed - Results logged to console and online logger");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Run iOS Compatibility Test
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  This will test iOS-specific features and log any compatibility issues.
                  Check the online logs for detailed results.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Status</CardTitle>
              <CardDescription>Connection type and latency information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Connection Status</p>
                  <div className="flex items-center mt-2">
                    {isOnline ? 
                      <span className="flex items-center text-green-600">
                        <Check className="h-5 w-5 mr-2" /> Online
                      </span> : 
                      <span className="flex items-center text-red-600">
                        <X className="h-5 w-5 mr-2" /> Offline
                      </span>
                    }
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Connection Type</p>
                  <div className="flex items-center mt-2">
                    {getConnectionIcon()}
                    <span className="ml-2 capitalize">{connectionType}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Connection Quality</p>
                  <div className="flex items-center mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          connectionQuality === 'excellent' ? 'bg-green-500 w-full' : 
                          connectionQuality === 'good' ? 'bg-green-400 w-3/4' : 
                          connectionQuality === 'fair' ? 'bg-yellow-500 w-2/4' : 
                          'bg-red-500 w-1/4'
                        }`}
                      ></div>
                    </div>
                    <span className="ml-2 capitalize">{connectionQuality}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-500">Last Ping Latency</p>
                  <div className="flex items-center mt-2">
                    <StatusIcon status={pingStatus} />
                    <span className="ml-2">
                      {pingStatus === 'pending' ? 'Testing...' : 
                       pingStatus === 'error' ? 'Failed' : 
                       pingTime !== null ? `${pingTime}ms` : 'Not tested'}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button onClick={testNetworkLatency} disabled={pingStatus === 'pending'}>
                {pingStatus === 'pending' ? 'Testing...' : 'Test Network Speed'}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Network Information</CardTitle>
              <CardDescription>Additional network capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center">
                  <StatusIcon status={'connection' in navigator ? 'success' : 'info'} />
                  <span className="ml-2">Network Information API</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={'onLine' in navigator ? 'success' : 'info'} />
                  <span className="ml-2">Online Status Detection</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={isOnline ? 'success' : 'error'} />
                  <span className="ml-2">Current Status: {isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <div className="flex items-center">
                  <StatusIcon status={'sendBeacon' in navigator ? 'success' : 'error'} />
                  <span className="ml-2">Beacon API Support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benchmarker Tab */}
        <TabsContent value="benchmarker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Benchmarker</CardTitle>
              <CardDescription>Comprehensive testing of all website features and capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Run a complete benchmark test that validates all major website features including 
                  notifications, device APIs, storage, network connectivity, and more.
                </p>
                
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={runBenchmark}
                    disabled={benchmarkRunning}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Check className="h-5 w-5" />
                    {benchmarkRunning ? 'Running Benchmark...' : 'Run Full Benchmark'}
                  </Button>
                  
                  {Object.keys(benchmarkResults).length > 0 && (
                    <Button 
                      onClick={copyBenchmarkResults}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Clipboard className="h-4 w-4" />
                      Copy Report
                    </Button>
                  )}
                </div>
                
                {benchmarkRunning && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{benchmarkProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${benchmarkProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              {Object.keys(benchmarkResults).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Benchmark Results</h3>
                  <div className="grid gap-3">
                    {Object.entries(benchmarkResults).map(([name, result]) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={result.status} />
                          <span className="font-medium">{name}</span>
                        </div>
                        <div className="text-right text-sm">
                          <div className={`font-medium ${
                            result.status === 'success' ? 'text-green-600' : 
                            result.status === 'error' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {result.message}
                          </div>
                          {result.time && (
                            <div className="text-gray-500">{result.time}ms</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-green-600 font-medium">
                          {Object.values(benchmarkResults).filter(r => r.status === 'success').length}
                        </span>
                        <span className="text-gray-600 ml-1">Passed</span>
                      </div>
                      <div>
                        <span className="text-red-600 font-medium">
                          {Object.values(benchmarkResults).filter(r => r.status === 'error').length}
                        </span>
                        <span className="text-gray-600 ml-1">Failed</span>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">
                          {Object.values(benchmarkResults).filter(r => r.time).reduce((sum, r) => sum + (r.time || 0), 0)}ms
                        </span>
                        <span className="text-gray-600 ml-1">Total Time</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tour Tab */}
        <TabsContent value="tour" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tutorial System</CardTitle>
              <CardDescription>Control the interactive tutorial tour</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The tutorial system guides new users through the dashboard features. 
                  Use this button to manually start the tour for testing purposes.
                </p>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={handleStartTour}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Start Tutorial Tour
                  </Button>
                  
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> After clicking "Start Tutorial Tour", navigate to the chair dashboard 
                    to see the tutorial in action. The tour will automatically begin once you're on the dashboard page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Operations</CardTitle>
              <CardDescription>Tools for managing database synchronization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> These operations affect the database. Use with caution.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Profile Synchronization</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Sync all Firebase users to Supabase profiles table. This ensures all chair accounts 
                    are properly represented in the profiles table for logistics tracking.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const result = await syncAllFirebaseUsersToSupabase();
                      console.log('Sync result:', result);
                    }}
                    disabled={syncLoading}
                    className="gap-2"
                  >
                    <UserPlus className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                    {syncLoading ? 'Syncing...' : 'Sync Firebase Users to Profiles'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Debug;
