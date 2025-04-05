import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, Suspense, lazy } from "react";
import { TimerProvider } from "./context/TimerContext";
import { toast } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { notificationService } from "./services/notificationService";
import { requestAndSaveFcmToken } from "./utils/fcmUtils";

// Eager loading critical components
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { initializeFirebase } from "./services/firebaseService";

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

// Protected route component
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
      <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
    </ErrorBoundary>
  );
};

// App wrapper to handle auth context
const AppWithAuth = () => {
  // Initialize Firebase and check notification permissions when the app mounts
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize Firebase
        await initializeFirebase();
        
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
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast.error('Failed to connect to the server. Please refresh and try again.');
      }
    };
    
    initApp();
  }, []);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Chair Routes */}
        <Route
          path="/chair-dashboard"
          element={<ProtectedRoute element={<ChairDashboard />} requiredRole="chair" />}
        />
        <Route
          path="/timer"
          element={<ProtectedRoute element={<TimerManager />} requiredRole="chair" />}
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
