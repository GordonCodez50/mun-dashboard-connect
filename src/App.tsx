
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useEffect, Suspense } from "react";
import { TimerProvider } from "./context/TimerContext";

import Login from "./pages/Login";
import ChairDashboard from "./pages/ChairDashboard";
import PressDashboard from "./pages/PressDashboard";
import AdminPanel from "./pages/AdminPanel";
import TimerManager from "./pages/TimerManager";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import { initializeFirebase } from "./services/firebaseService";

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

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-accent/20"></div>
      <div className="h-2 w-24 bg-accent/20 rounded"></div>
    </div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ 
  element, 
  requiredRole,
  requiredCouncil,
}: { 
  element: React.ReactNode; 
  requiredRole?: 'chair' | 'admin' | 'both';
  requiredCouncil?: string;
}) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/" replace />;
  }
  
  // Check if this is a press route that requires PRESS council
  if (requiredCouncil === 'PRESS') {
    if (!user?.council || user.council.toUpperCase() !== 'PRESS') {
      console.log('User does not have PRESS council, redirecting:', user);
      return <Navigate to={user?.role === 'chair' ? '/chair-dashboard' : '/admin-panel'} replace />;
    }
    return <>{element}</>;
  }
  
  // Check other role requirements
  if (requiredRole && requiredRole !== 'both') {
    if (user?.role !== requiredRole) {
      console.log('User does not have required role, redirecting:', user);
      return <Navigate to={user?.role === 'chair' ? '/chair-dashboard' : '/admin-panel'} replace />;
    }
    
    // Special case for press users trying to access chair routes
    if (requiredRole === 'chair' && user?.council && user.council.toUpperCase() === 'PRESS') {
      console.log('Press user trying to access chair route, redirecting to press dashboard:', user);
      return <Navigate to="/press-dashboard" replace />;
    }
  }
  
  return <>{element}</>;
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
      <Suspense fallback={<LoadingFallback />}>
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
            element={<ProtectedRoute element={<PressDashboard />} requiredCouncil="PRESS" />}
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

          {/* Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
