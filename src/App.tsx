
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ChairDashboard from './pages/ChairDashboard';
import AdminPanel from './pages/AdminPanel';
import PressDashboard from './pages/PressDashboard';
import ChairAttendance from './pages/ChairAttendance';
import AdminAttendance from './pages/AdminAttendance';
import TimerManager from './pages/TimerManager';
import Documents from './pages/Documents';
import FileShare from './pages/FileShare';
import UserManagement from './pages/UserManagement';
import ErrorBoundary from './components/ErrorBoundary';
import { AlertHandler } from '@/components/notifications/AlertHandler';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Register service worker early in the app lifecycle
  useEffect(() => {
    // Test service worker if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PING',
        timestamp: Date.now()
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TimerProvider>
            <Router>
              {/* Global notification handler that works across all pages */}
              <AlertHandler />
              
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/chair-dashboard" element={<ChairDashboard />} />
                <Route path="/admin-panel" element={<AdminPanel />} />
                <Route path="/press-dashboard" element={<PressDashboard />} />
                <Route path="/chair-attendance" element={<ChairAttendance />} />
                <Route path="/admin-attendance" element={<AdminAttendance />} />
                <Route path="/timer-manager" element={<TimerManager />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/file-share" element={<FileShare />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              <Toaster />
            </Router>
          </TimerProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
