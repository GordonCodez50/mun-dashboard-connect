
import React from 'react';
import { AlertItem, Alert } from './AlertItem';
import { User } from '@/types/auth';

type AlertsSectionProps = {
  alerts: Alert[];
  hideResolved: boolean;
  user: User | null;
};

export const AlertsSection = ({ alerts, hideResolved, user }: AlertsSectionProps) => {
  // Filter alerts based on hideResolved setting
  const filteredAlerts = hideResolved 
    ? alerts.filter(alert => alert.status !== 'resolved')
    : alerts;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-medium text-primary mb-4 flex items-center">
        Live Alerts
        <div className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </h2>
      {filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} user={user} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500">
            {hideResolved ? 'No active alerts (resolved alerts are hidden)' : 'No active alerts'}
          </p>
        </div>
      )}
    </div>
  );
};
