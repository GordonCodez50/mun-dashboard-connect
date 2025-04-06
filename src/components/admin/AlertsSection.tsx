
import React from 'react';
import { AlertItem, Alert } from './AlertItem';
import { User } from '@/types/auth';
import { ScrollArea } from '@/components/ui/scroll-area';

type AlertsSectionProps = {
  alerts: Alert[];
  hideResolved: boolean;
  user: User | null;
  isMobile?: boolean;
};

export const AlertsSection = ({ alerts, hideResolved, user, isMobile = false }: AlertsSectionProps) => {
  // Filter out invalid alerts
  const validAlerts = alerts.filter(alert => alert && alert.id);
  
  // Filter alerts based on hideResolved setting
  const filteredAlerts = hideResolved 
    ? validAlerts.filter(alert => alert.status !== 'resolved')
    : validAlerts;
    
  // Sort alerts by timestamp, latest first
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return timeB - timeA; // Descending order (latest first)
  });

  const alertsContent = sortedAlerts.length > 0 ? (
    <div className={`space-y-3 ${isMobile ? 'animate-fade-in' : ''}`}>
      {sortedAlerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} user={user} />
      ))}
    </div>
  ) : (
    <div className={`text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100 ${isMobile ? 'animate-fade-in' : ''}`}>
      <p className="text-gray-500">
        {hideResolved ? 'No active alerts (resolved alerts are hidden)' : 'No active alerts'}
      </p>
    </div>
  );

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-primary mb-3 flex items-center">
        Live Alerts
        <div className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </h2>
      
      {isMobile ? (
        <div className="max-h-[40vh] overflow-y-auto rounded-lg">
          {alertsContent}
        </div>
      ) : (
        alertsContent
      )}
    </div>
  );
};
