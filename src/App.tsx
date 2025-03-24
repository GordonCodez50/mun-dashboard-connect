
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import ChairDashboard from "./pages/ChairDashboard";
import AdminPanel from "./pages/AdminPanel";
import CouncilStatus from "./pages/CouncilStatus";
import TimerManager from "./pages/TimerManager";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ 
  element, 
  requiredRole,
}: { 
  element: React.ReactNode; 
  requiredRole?: 'chair' | 'admin' | 'both';
}) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole && requiredRole !== 'both') {
    if (user?.role !== requiredRole) {
      return <Navigate to={user?.role === 'chair' ? '/chair-dashboard' : '/admin-panel'} replace />;
    }
  }
  
  return <>{element}</>;
};

// App wrapper to handle auth context
const AppWithAuth = () => {
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
          path="/send-alert"
          element={<ProtectedRoute element={<ChairDashboard />} requiredRole="chair" />}
        />
        <Route
          path="/timer"
          element={<ProtectedRoute element={<TimerManager />} requiredRole="chair" />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin-panel"
          element={<ProtectedRoute element={<AdminPanel />} requiredRole="admin" />}
        />
        <Route
          path="/live-alerts"
          element={<ProtectedRoute element={<AdminPanel />} requiredRole="admin" />}
        />
        <Route
          path="/council-status"
          element={<ProtectedRoute element={<CouncilStatus />} requiredRole="admin" />}
        />
        <Route
          path="/timer-control"
          element={<ProtectedRoute element={<TimerManager />} requiredRole="admin" />}
        />

        {/* Shared Routes */}
        <Route
          path="/documents"
          element={<ProtectedRoute element={<Documents />} requiredRole="both" />}
        />

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
          <AppWithAuth />
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
