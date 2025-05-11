
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { isAuthenticated, user, loading = false } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only navigate programmatically if we're not still loading auth state
    if (!loading) {
      if (isAuthenticated) {
        // Determine where to navigate based on user role
        let destination = '/';
        
        if (user?.role === 'admin') {
          destination = '/admin-panel';
        } else if (user?.role === 'chair') {
          destination = user.council === 'PRESS' ? '/press-dashboard' : '/chair-dashboard';
        }
        
        navigate(destination, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  // While auth is loading, show a loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Default fallback redirect
  return <Navigate to="/" replace />;
};

export default Index;
