
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bell } from 'lucide-react';
import { Alert } from '@/types/alerts';
import { AlertItem } from './AlertItem';

interface RecentAlertsProps {
  alerts: Alert[];
  onStatusChange: (alertId: string, newStatus: 'acknowledged' | 'resolved') => void;
}

export const RecentAlerts: React.FC<RecentAlertsProps> = ({ alerts, onStatusChange }) => {
  return (
    <Card className="border-gray-200 shadow-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bell className="text-accent" size={20} />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {alerts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {alerts.slice(0, 3).map((alert) => (
              <AlertItem 
                key={alert.id} 
                alert={alert} 
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p>No recent alerts</p>
            <p className="text-sm mt-1">Alerts will appear here when they are created</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
