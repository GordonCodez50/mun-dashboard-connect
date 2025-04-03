
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, Suspense, lazy } from "react";
import { TimerProvider } from "./context/TimerContext";

// Eager loading critical components
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { initializeFirebase } from "./services/firebaseService";

// Lazy loading less critical components for code splitting
const ChairDashboard = lazy(() => import("./pages/ChairDashboard"));
const PressDashboard = lazy(() => import("./pages/PressDashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const TimerManager = lazy(() => import("./pages/TimerManager"));
const UserManagement = lazy(() => import("./pages/UserManagement"));

// Setup loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

// Initialize query client with production settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
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
  
  return <Suspense fallback={<LoadingFallback />}>{element}</Suspense>;
};

// App wrapper to handle auth context
const AppWithAuth = () => {
  // Initialize Firebase when the app mounts
  useEffect(() => {
    const initFirebase = async () => {
      await initializeFirebase();
    };
    
    initFirebase();
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

const App = () => (
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
);

export default App;
