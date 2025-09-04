
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
  // Filter out invalid alerts including undefined values
  const validAlerts = alerts.filter(alert => 
    alert && 
    alert.id && 
    alert.type && 
    alert.council && 
    alert.message &&
    alert.type !== 'undefined' &&
    alert.council !== 'undefined' &&
    alert.message !== 'undefined' &&
    alert.type.toString() !== 'undefined' &&
    alert.council.toString() !== 'undefined' &&
    alert.message.toString() !== 'undefined'
  );
  
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
    <div className={`${isMobile ? 'space-y-0 animate-fade-in' : 'space-y-3'}`}>
      {sortedAlerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} user={user} />
      ))}
    </div>
  ) : (
    <div className={`text-center p-6 bg-card rounded-lg shadow-sm border border-border ${isMobile ? 'animate-fade-in' : ''}`}>
      <p className="text-muted-foreground">
        {hideResolved ? 'No active alerts (resolved alerts are hidden)' : 'No active alerts'}
      </p>
    </div>
  );

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-foreground mb-3 flex items-center">
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
