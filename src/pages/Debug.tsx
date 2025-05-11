import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Info, Clipboard, Bell, Smartphone, Globe, Vibrate, Database, FileCode, Settings, Wifi, WifiOff, Network, Signal } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { 
  isAndroid, 
  isChrome, 
  isIOS,
  isSafari,
  isMacOS,
  isPwa,
  isNotificationSupported,
  isWebPushSupported,
  isIOS164PlusWithWebPush,
  requestNotificationPermission,
  testNotification,
  playNotificationSound
} from "@/utils/crossPlatformNotifications";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";

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

  // Test result states
  const [vibrationSupported, setVibrationSupported] = useState<boolean | null>(null);
  const [clipboardStatus, setClipboardStatus] = useState<'success' | 'error' | 'info' | 'pending'>('info');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'success' | 'error' | 'info' | 'pending'>('info');
  const [localStorageStatus, setLocalStorageStatus] = useState<'success' | 'error' | 'info' | 'pending'>('info');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  
  // Network status states
  const [pingStatus, setPingStatus] = useState<'success' | 'error' | 'info' | 'pending'>('info');
  const [pingTime, setPingTime] = useState<number | null>(null);
  const [connectionType, setConnectionType] = useState<string>("unknown");
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  const passwordRef = useRef<HTMLInputElement>(null);

  // Initialize with browser and OS detection
  useEffect(() => {
    if (authorized) {
      const browser = detectBrowser();
      const os = detectOS();
      setBrowserInfo(browser);
      setOsInfo(os);
      
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
        'Web Push Support': isWebPushSupported() ? 'Yes' : 'No',
        'Notification Support': isNotificationSupported() ? 'Yes' : 'No',
        'iOS 16.4+ PWA': isIOS164PlusWithWebPush() ? 'Yes' : 'No',
        'Permission Status': Notification.permission,
        'FCM Supported': notificationService.isFcmSupported() ? 'Yes' : 'No',
      });

      // Check connection type
      if ('connection' in navigator) {
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
    if (password === "NiniRebekAdwe") {
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

  // Handle notification test
  const handleNotificationTest = async () => {
    if (permissionGranted) {
      const notificationShown = await testNotification();
      if (notificationShown) {
        toast.success("Test notification sent");
      } else {
        toast.error("Failed to show notification");
      }
    } else {
      toast.error("Notification permission not granted");
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Debug Console</CardTitle>
            <CardDescription>Password protected area</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent>
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
    );
  }

  // Main debug console UI
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Debug Console</h1>
        <Button variant="outline" onClick={() => setAuthorized(false)}>Lock Console</Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="browser">
            <Globe className="h-4 w-4 mr-2" />
            Browser & OS
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="apis">
            <Settings className="h-4 w-4 mr-2" />
            API Tests
          </TabsTrigger>
          <TabsTrigger value="storage">
            <Database className="h-4 w-4 mr-2" />
            Storage & Workers
          </TabsTrigger>
          <TabsTrigger value="network">
            <Network className="h-4 w-4 mr-2" />
            Network
          </TabsTrigger>
        </TabsList>

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
                        Notification.permission === 'granted' ? 'success' : 
                        Notification.permission === 'denied' ? 'error' : 'info'
                      } 
                    />
                    <span className="ml-2 capitalize">{Notification.permission}</span>
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
                <Button onClick={handleNotificationTest} disabled={!permissionGranted}>
                  Test Notification
                </Button>
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
      </Tabs>
    </div>
  );
};

export default Debug;
