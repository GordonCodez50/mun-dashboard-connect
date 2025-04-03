
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { QuickTimerWidget } from '@/components/ui/QuickTimerWidget';
import { Clock } from 'lucide-react';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/types/alerts';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ChairQuickActions } from '@/components/chair/ChairQuickActions';
import { CustomAlertForm } from '@/components/dashboard/CustomAlertForm';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';

const ChairDashboard = () => {
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
          <DashboardHeader title="Chair Dashboard" userName={user?.name} />
          
          <DashboardSection title="Quick Actions">
            <ChairQuickActions onAlertSent={handleAlertSent} />
          </DashboardSection>
          
          <DashboardSection title="">
            <CustomAlertForm onAlertSent={handleAlertSent} />
          </DashboardSection>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <RecentAlerts 
                alerts={recentAlerts} 
                onStatusChange={handleAlertStatusChange} 
              />
            </div>
            
            <Card className="border-gray-200 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="text-accent" size={20} />
                  Quick Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <QuickTimerWidget />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChairDashboard;
