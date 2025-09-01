import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { notificationDeliveryTracker, type DeliveryStatus } from '@/services/notificationDeliveryTracker';
import { notificationService } from '@/services/notificationService';

export const NotificationDeliveryStatus: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryStatus[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    clicked: 0,
    deliveryRate: 0,
    avgDeliveryTime: 0
  });

  const updateStats = () => {
    const newStats = notificationDeliveryTracker.getStats();
    const recentDeliveries = notificationDeliveryTracker.getAllDeliveries().slice(0, 10);
    setStats(newStats);
    setDeliveries(recentDeliveries);
  };

  useEffect(() => {
    updateStats();
    
    // Update every 2 seconds
    const interval = setInterval(updateStats, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: DeliveryStatus['status']) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'clicked': return 'bg-blue-500';
      case 'dismissed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const testDeliveryTracking = () => {
    notificationService.showNotification('Delivery Test', {
      body: 'Testing notification delivery tracking system',
      tag: `test_${Date.now()}`,
      data: { type: 'test' }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Notification Delivery Status
          <Button onClick={testDeliveryTracking} size="sm">
            Test Delivery
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-muted-foreground">Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.clicked}</div>
            <div className="text-sm text-muted-foreground">Clicked</div>
          </div>
        </div>

        <Separator />

        {/* Delivery Rate & Timing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-semibold">
              {stats.deliveryRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Delivery Rate</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold">
              {stats.avgDeliveryTime}ms
            </div>
            <div className="text-sm text-muted-foreground">Avg Delivery Time</div>
          </div>
        </div>

        <Separator />

        {/* Recent Deliveries */}
        <div>
          <h4 className="font-medium mb-3">Recent Deliveries</h4>
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications tracked yet</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(delivery.status)} text-white`}>
                        {delivery.status}
                      </Badge>
                      <span className="font-medium">{delivery.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {delivery.platform} • {new Date(delivery.timestamp).toLocaleTimeString()}
                      {delivery.deliveryTime && (
                        <span> • {delivery.deliveryTime}ms</span>
                      )}
                      {delivery.error && (
                        <span className="text-red-600"> • {delivery.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};