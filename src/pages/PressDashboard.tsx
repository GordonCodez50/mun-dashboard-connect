
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { Alert } from '@/types/alerts';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { PressQuickActions } from '@/components/press/PressQuickActions';
import { CustomAlertForm } from '@/components/dashboard/CustomAlertForm';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';

const PressDashboard = () => {
  const { user } = useAuth();
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  const { data: alertStatusData } = useFirebaseRealtime<any>('ALERT_STATUS_UPDATE');

  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      const userAlerts = alertsData
        .filter(alert => alert.council === user?.council || 
                        (alert.type === 'DirectMessage' && alert.toCouncil === user?.council))
        .map(alert => ({
          id: alert.id,
          type: alert.type === 'DirectMessage' ? 'Message from Admin' : alert.type,
          message: alert.message,
          timestamp: alert.timestamp ? new Date(alert.timestamp) : new Date(),
          status: alert.status,
          reply: alert.reply,
          admin: alert.admin
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
      
      setRecentAlerts(userAlerts);
    }
  }, [alertsData, user?.council]);

  const handleAlertSent = (alertId: string, alertType: string, message: string) => {
    const newAlert: Alert = {
      id: alertId,
      type: alertType,
      message: message,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setRecentAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  const handleAlertStatusChange = (alertId: string, newStatus: 'acknowledged' | 'resolved') => {
    setRecentAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: newStatus }
        : alert
    ));
  };

  return (
    <div className="flex h-screen bg-gradient-radial">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <DashboardHeader title="Press Dashboard" userName={user?.name} />
          
          <DashboardSection title="Quick Actions">
            <PressQuickActions onAlertSent={handleAlertSent} />
          </DashboardSection>
          
          <DashboardSection title="">
            <CustomAlertForm onAlertSent={handleAlertSent} />
          </DashboardSection>
          
          <RecentAlerts 
            alerts={recentAlerts} 
            onStatusChange={handleAlertStatusChange} 
          />
        </div>
      </div>
    </div>
  );
};

export default PressDashboard;
