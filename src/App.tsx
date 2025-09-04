import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, Suspense, lazy, useState } from "react";
import { TimerProvider } from "./context/TimerContext";
import { TourContextProvider } from "./context/TourContext";
import { toast } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { setUserRole } from "./services/crossPlatformNotificationManager";
import { realtimeService } from "./services/firebaseService";
import { OfflineIndicator } from "./components/ui/offline-indicator";
import Home from "./pages/Home";

// Eager loading critical components
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { initializeFirebase } from "./services/firebaseService";
import NotificationInitializer from "./components/NotificationInitializer";
import { HelmetProvider } from 'react-helmet-async';

// Enhanced error boundary fallback component with iOS-specific debugging
const ErrorFallback = () => {
  // Get current error from URL or localStorage if possible
  const error = typeof window !== 'undefined' ? new Error('App crashed - check console for details') : undefined;
  const errorInfo = undefined;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isDebugPage = window.location.pathname.includes('/debug');
  
  // Log error details for debugging
  console.error('[App Error Boundary]', { 
    error, 
    errorInfo, 
    isIOS, 
    isDebugPage,
    userAgent: navigator.userAgent,
    location: window.location.href
  });

  // Send error to online logger if possible
  try {
    import('./services/onlineNotificationLogger').then(({ onlineNotificationLogger }) => {
      onlineNotificationLogger.logError(
        `App Error Fallback Triggered: ${isDebugPage ? 'Debug Page Failed' : 'General App Error'}`,
        'No stack available - error boundary fallback triggered',
        {
          isAppCrash: true,
          isIOS,
          isDebugPage,
          userAgent: navigator.userAgent,
          location: window.location.href,
          timestamp: new Date().toISOString(),
          reason: 'ErrorBoundary fallback component rendered'
        }
      );
    });
  } catch (e) {
    console.warn('Failed to log app crash:', e);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl w-full border dark:border-gray-700">
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 text-center">
          Something went wrong
        </h2>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
          We're sorry, but there was an error loading this page. 
          {isIOS ? ' This appears to be an iOS-specific issue.' : ''}
        </p>

        {/* Error Details */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Details:</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div><strong>Message:</strong> {isDebugPage ? 'Debug page failed to load on this device' : 'App error occurred - check browser console for details'}</div>
            <div><strong>Location:</strong> {window.location.pathname}</div>
            <div><strong>Platform:</strong> {navigator.platform}</div>
            <div><strong>Browser:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</div>
            {isIOS && (
              <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                <strong>iOS Detected:</strong> This error is likely caused by iOS Safari limitations or memory constraints.
              </div>
            )}
          </div>
        </div>

        {/* iOS-specific guidance */}
        {isIOS && (
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">iOS Troubleshooting:</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Close other Safari tabs to free up memory</li>
              <li>Force-close Safari and reopen</li>
              <li>Clear Safari cache and cookies</li>
              <li>Update iOS to the latest version</li>
              <li>Try using Chrome or Edge on iOS instead</li>
              {isDebugPage && <li>Debug page requires more memory - try on desktop</li>}
            </ul>
          </div>
        )}

        {/* Error Stack (for developers) */}
        {error?.stack && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              Technical Details (Click to expand)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-32 text-gray-800 dark:text-gray-200">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Lazy loading less critical components
const ChairDashboard = lazy(() => import("./pages/ChairDashboard"));
const PressDashboard = lazy(() => import("./pages/PressDashboard"));
const PressCouncils = lazy(() => import("./pages/PressCouncils"));
const PressAttendance = lazy(() => import("./pages/PressAttendance"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const RTAdminDashboard = lazy(() => import("./pages/RTAdminDashboard"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const LogisticsDashboard = lazy(() => import("./pages/LogisticsDashboard").catch(() => ({ default: () => <div>Failed to load Logistics Dashboard</div> })));
const LogisticsParticipants = lazy(() => import("./pages/LogisticsParticipants").catch(() => ({ default: () => <div>Failed to load Logistics Participants</div> })));
const LogisticsCouncils = lazy(() => import("./pages/LogisticsCouncils").catch(() => ({ default: () => <div>Failed to load Logistics Councils</div> })));
const TimerManager = lazy(() => import("./pages/TimerManager"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const FileSharing = lazy(() => import("./pages/FileSharing"));
const ChairFileSharing = lazy(() => import("./pages/ChairFileSharing"));
const AdminFileSharing = lazy(() => import("./pages/AdminFileSharing"));
const RTAdminFileSharing = lazy(() => import("./pages/RTAdminFileSharing"));

const ChairAttendance = lazy(() => import("./pages/ChairAttendance"));
const AdminAttendance = lazy(() => import("./pages/AdminAttendance"));
const Debug = lazy(() => import("./pages/Debug"));
const Settings = lazy(() => import("./pages/Settings"));

// Setup loading fallback with network status
const LoadingFallback = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingTime, setLoadingTime] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">Loading...</p>
        {loadingTime > 5 && (
          <p className="text-sm text-muted-foreground">
            {isOnline ? "Loading is taking longer than usual" : "You appear to be offline"}
          </p>
        )}
        {!isOnline && (
          <p className="text-sm text-red-600 mt-2">
            Please check your internet connection
          </p>
        )}
      </div>
    </div>
  );
};

// Initialize query client with aggressive caching for low bandwidth
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // More aggressive retry for network errors
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
          return failureCount < 5;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
      networkMode: 'offlineFirst',
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
        },
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
          return failureCount < 3;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'offlineFirst',
      meta: {
        onError: (error: Error) => {
          console.error('Mutation error:', error);
        },
      },
    },
  },
});

// AlertHandler component to handle alert ID in URL
const AlertHandler = () => {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if there's an alert ID in the URL
    const params = new URLSearchParams(location.search);
    const alertId = params.get('alert');
    
    if (alertId) {
      console.log('Alert ID found in URL:', alertId);
      // Clear the alertId from the URL to prevent reprocessing
      navigate(location.pathname, { replace: true });
      
      // Inform user about the alert (you can customize this further)
      toast.info('Opening alert', {
        description: `Alert ID: ${alertId}`,
        duration: 3000,
      });
      
      // Additional logic to handle the alert (e.g., scroll to it, highlight it)
      // This depends on your specific implementation
    }
    
    // Always ensure alert listeners are initialized on every page navigation
    realtimeService.initializeAlertListeners();
    
    // Ensure user role is set for notifications on each page
    if (user) {
      const role = user.role === 'admin' ? 'admin' : 
                  user.role === 'logistics' ? 'logistics' :
                  (user.council === 'PRESS' ? 'press' : 'chair');
                  
      setUserRole(role);
    }
  }, [location, user, navigate]);
  
  return null;
};

// Protected route component with alert handling and notification initializer
const ProtectedRoute = ({ 
  element, 
  requiredRole,
}: { 
  element: React.ReactNode; 
  requiredRole?: 'chair' | 'admin' | 'logistics' | 'admin-rt' | 'member' | 'both';
}) => {
  const { isAuthenticated, user, loading = false } = useAuth();
  
  // Show loading indicator while authentication is being checked
  if (loading) {
    return <LoadingFallback />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole && requiredRole !== 'both') {
    // Handle member role (covers both member-hcc and member-fcc)
    if (requiredRole === 'member' && (user?.role === 'member-hcc' || user?.role === 'member-fcc')) {
      return (
        <ErrorBoundary fallback={<ErrorFallback />}>
          <AlertHandler />
          <NotificationInitializer />
          <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
        </ErrorBoundary>
      );
    }
    
    if (user?.role !== requiredRole) {
      // Special handling for press users who are chairs with council PRESS
      if (requiredRole === 'chair' && user?.role === 'chair' && user?.council === 'PRESS') {
        // Allow press users to access chair routes
        return (
          <ErrorBoundary fallback={<ErrorFallback />}>
            <AlertHandler />
            <NotificationInitializer />
            <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
          </ErrorBoundary>
        );
      }
      
      // Redirect to appropriate dashboard based on user role
      const redirectTo = user?.role === 'chair' ? 
                        (user?.council === 'PRESS' ? '/press-dashboard' : '/chair-dashboard') : 
                        user?.role === 'logistics' ? '/logistics-dashboard' : 
                        user?.role === 'admin-rt' ? '/rt-admin-dashboard' :
                        (user?.role === 'member-hcc' || user?.role === 'member-fcc') ? '/member-dashboard' :
                        '/admin-panel';
      return <Navigate to={redirectTo} replace />;
    }
  }
  
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <AlertHandler />
      <NotificationInitializer />
      <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
    </ErrorBoundary>
  );
};

// App wrapper to handle auth context
const AppWithAuth = () => {
  const navigate = useNavigate();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Listen for service worker navigation messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE') {
        console.log('Service worker navigation request:', event.data.url);
        navigate(event.data.url);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [navigate]);
  
  // Minimal initialization for mobile compatibility
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log(`${isMobile ? 'MOBILE' : 'DESKTOP'}: Initializing app with minimal setup`);
        
        // Initialize Firebase with timeout
        const initTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Initialization timeout')), 5000);
        });
        
        await Promise.race([initializeFirebase(), initTimeout]);
        console.log('Firebase initialized successfully');
        
        // Cross-platform notification system is initialized in AuthContext
        console.log('Cross-platform notification system will be initialized in AuthContext');
        
        // Basic alert listeners for all devices
        if (realtimeService?.initializeAlertListeners) {
          realtimeService.initializeAlertListeners();
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        // Don't show error toast on mobile to prevent blocking UI
        if (!isMobile) {
          toast.error('Connection failed. Please refresh.');
        }
      }
    };
    
    initApp();
  }, [isMobile]);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Regular routes */}
        <Route path="/login" element={
          <>
            <AlertHandler />
            <Login />
          </>
        } />

        {/* Chair Routes */}
        <Route
          path="/chair-dashboard"
          element={<ProtectedRoute element={<ChairDashboard />} requiredRole="chair" />}
        />
        <Route
          path="/timer"
          element={<ProtectedRoute element={<TimerManager />} requiredRole="chair" />}
        />
        <Route
          path="/chair-attendance"
          element={<ProtectedRoute element={<ChairAttendance />} requiredRole="chair" />}
        />
        <Route
          path="/chair/files"
          element={<ProtectedRoute element={<ChairFileSharing />} requiredRole="chair" />}
        />

        {/* Press Routes */}
        <Route
          path="/press-dashboard"
          element={<ProtectedRoute element={<PressDashboard />} requiredRole="chair" />}
        />
        <Route
          path="/press-councils"
          element={<ProtectedRoute element={<PressCouncils />} requiredRole="chair" />}
        />
        <Route
          path="/press-attendance"
          element={<ProtectedRoute element={<PressAttendance />} requiredRole="chair" />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin-panel"
          element={<ProtectedRoute element={<AdminPanel />} requiredRole="admin" />}
        />
        <Route
          path="/user-management"
          element={<ProtectedRoute element={<UserManagement />} requiredRole="admin" />}
        />
        <Route
          path="/admin-attendance"
          element={<ProtectedRoute element={<AdminAttendance />} requiredRole="admin" />}
        />
        <Route
          path="/admin/files"
          element={<ProtectedRoute element={<AdminFileSharing />} requiredRole="admin" />}
        />

        {/* Logistics Routes */}
        <Route
          path="/logistics-dashboard"
          element={<ProtectedRoute element={<LogisticsDashboard />} requiredRole="logistics" />}
        />
        <Route
          path="/logistics-councils"
          element={<ProtectedRoute element={<LogisticsCouncils />} requiredRole="logistics" />}
        />
        <Route
          path="/logistics-participants"
          element={<ProtectedRoute element={<LogisticsParticipants />} requiredRole="logistics" />}
        />

        {/* Settings Route - accessible to all authenticated users */}
        <Route
          path="/settings"
          element={<ProtectedRoute element={<Settings />} requiredRole="both" />}
        />
        
        {/* File Sharing Route - accessible to all authenticated users */}
        <Route
          path="/files"
          element={<ProtectedRoute element={<FileSharing />} requiredRole="both" />}
        />

        {/* Debug Route - Password protected but no auth requirement */}
        <Route path="/debug" element={
          <ErrorBoundary fallback={<ErrorFallback />}>
            <TourContextProvider>
              <Suspense fallback={<LoadingFallback />}><Debug /></Suspense>
            </TourContextProvider>
          </ErrorBoundary>
        } />

        {/* R&T Admin Routes */}
        <Route
          path="/rt-admin-dashboard"
          element={<ProtectedRoute element={<RTAdminDashboard />} requiredRole="admin-rt" />}
        />
        <Route
          path="/rt-admin/files"
          element={<ProtectedRoute element={<RTAdminFileSharing />} requiredRole="admin-rt" />}
        />

        {/* Member Routes */}
        <Route
          path="/member-dashboard"
          element={<ProtectedRoute element={<MemberDashboard />} requiredRole="member" />}
        />

        {/* Index route redirect */}
        <Route path="/index" element={<Navigate to="/" replace />} />

        {/* Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  // Add error handling for the entire app
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <TimerProvider>
                  <OfflineIndicator />
                  <AppWithAuth />
                </TimerProvider>
              </AuthProvider>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
