import React from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface ConnectionAwareProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showOnSlowConnection?: boolean;
}

export function ConnectionAware({ 
  children, 
  fallback = null, 
  showOnSlowConnection = true 
}: ConnectionAwareProps) {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (!isOnline) {
    return <>{fallback}</>;
  }

  if (isSlowConnection && !showOnSlowConnection) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}