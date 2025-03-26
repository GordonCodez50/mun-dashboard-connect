
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';

export type CouncilStatus = 'in-session' | 'on-break' | 'technical-issue';

export type StatusBadgeProps = {
  status: CouncilStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  councilId?: string;
  onStatusChange?: (status: CouncilStatus) => void;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status: initialStatus,
  className,
  size = 'md',
  councilId,
  onStatusChange
}) => {
  const [status, setStatus] = useState<CouncilStatus>(initialStatus);
  
  // If councilId is provided, listen for status updates via Firebase
  const { data: statusUpdate } = useFirebaseRealtime<{status: CouncilStatus}>('COUNCIL_STATUS_UPDATE', councilId);
  
  useEffect(() => {
    if (statusUpdate?.status) {
      setStatus(statusUpdate.status);
      if (onStatusChange) {
        onStatusChange(statusUpdate.status);
      }
    }
  }, [statusUpdate, onStatusChange]);

  const getStatusLabel = () => {
    switch (status) {
      case 'in-session': return 'In Session';
      case 'on-break': return 'On Break';
      case 'technical-issue': return 'Technical Issue';
      default: return '';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'in-session': return 'bg-green-100 text-green-800';
      case 'on-break': return 'bg-yellow-100 text-yellow-800';
      case 'technical-issue': return 'bg-red-100 text-red-800';
      default: return '';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-0.5';
      case 'lg': return 'text-sm px-3 py-1';
      default: return 'text-xs px-2.5 py-0.5';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        getStatusClass(),
        getSizeClass(),
        className
      )}
    >
      <span className={cn(
        'w-2 h-2 rounded-full mr-1.5',
        status === 'in-session' ? 'bg-green-500' : 
        status === 'on-break' ? 'bg-yellow-500' : 
        'bg-red-500'
      )} />
      {getStatusLabel()}
    </span>
  );
};
