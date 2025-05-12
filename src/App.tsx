import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, Suspense, lazy, useState } from "react";
import { TimerProvider } from "./context/TimerContext";
import { toast } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { notificationService } from "./services/notificationService";
import { requestAndSaveFcmToken } from "./utils/fcmUtils";
import { realtimeService } from "./services/realtimeService";
import Home from "./pages/Home";

// Eager loading critical components
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { initializeFirebase } from "./services/firebaseService";
import NotificationInitializer from "./components/NotificationInitializer";

// Error boundary fallback component
const ErrorFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-700 mb-4">
        We're sorry, but there was an error loading this page. Please try refreshing.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Lazy loading less critical components
const ChairDashboard = lazy(() => import("./pages/ChairDashboard"));
const PressDashboard = lazy(() => import("./pages/PressDashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const TimerManager = lazy(() => import("./pages/TimerManager"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const FileShare = lazy(() => import("./pages/FileShare"));
const ChairAttendance = lazy(() => import("./pages/ChairAttendance"));
const AdminAttendance = lazy(() => import("./pages/AdminAttendance"));
const Debug = lazy(() => import("./pages/Debug"));
const Settings = lazy(() => import("./pages/Settings"));

// Setup loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    <span className="ml-3 text-gray-600">Loading...</span>
  </div>
);

// Initialize query client with production settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      gcTime: 60000,
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
        },
      },
    },
    mutations: {
      retry: 1,
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
                  (user.council === 'PRESS' ? 'press' : 'chair');
                  
      notificationService.setUserRole(role);
      
      // Also inform service worker about user role
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_USER_ROLE',
          role
        });
      }
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
  requiredRole?: 'chair' | 'admin' | 'both';
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
    if (user?.role !== requiredRole) {
      return <Navigate to={user?.role === 'chair' ? '/chair-dashboard' : '/admin-panel'} replace />;
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
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  
  // Initialize Firebase and check notification permissions when the app mounts
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize Firebase
        await initializeFirebase();
        
        // Check if service worker is registered
        const checkServiceWorker = async () => {
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const hasFirebaseMessagingSW = registrations.some(reg => 
              reg.scope.includes(window.location.origin) && 
              reg.active && 
              reg.active.scriptURL.includes('firebase-messaging-sw.js')
            );
            
            setServiceWorkerRegistered(hasFirebaseMessagingSW);
            
            if (!hasFirebaseMessagingSW) {
              console.log('Firebase messaging service worker not found, registering...');
              try {
                const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                  scope: '/'
                });
                console.log('Firebase messaging service worker registered:', reg.scope);
                setServiceWorkerRegistered(true);
              } catch (error) {
                console.error('Failed to register service worker:', error);
              }
            } else {
              console.log('Firebase messaging service worker already registered');
            }
          }
        };
        
        await checkServiceWorker();
        
        // Check if notification permission is already granted
        if (notificationService.isNotificationSupported()) {
          if (notificationService.hasPermission()) {
            console.log("Notification permission already granted");
            
            // Initialize FCM if supported
            if (notificationService.isFcmSupported()) {
              await requestAndSaveFcmToken();
            }
          } else {
            console.log("Notification permission not granted yet");
          }
        }
        
        // Initialize global alert listeners
        realtimeService.initializeAlertListeners();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast.error('Failed to connect to the server. Please refresh and try again.');
      }
    };
    
    initApp();
    
    // Periodically check if alert listeners are active
    const alertListenerCheck = setInterval(() => {
      if (!realtimeService.areAlertListenersActive()) {
        console.log('Alert listeners not active, reinitializing...');
        realtimeService.reinitializeAlertListeners();
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(alertListenerCheck);
    };
  }, []);
  
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
          path="/file-share"
          element={<ProtectedRoute element={<FileShare />} requiredRole="chair" />}
        />

        {/* Press Route */}
        <Route
          path="/press-dashboard"
          element={<ProtectedRoute element={<PressDashboard />} requiredRole="chair" />}
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

        {/* Settings Route - accessible to all authenticated users */}
        <Route
          path="/settings"
          element={<ProtectedRoute element={<Settings />} requiredRole="both" />}
        />

        {/* Debug Route - Password protected but no auth requirement */}
        <Route path="/debug" element={
          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense fallback={<LoadingFallback />}><Debug /></Suspense>
          </ErrorBoundary>
        } />

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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <TimerProvider>
                <AppWithAuth />
              </TimerProvider>
            </AuthProvider>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
