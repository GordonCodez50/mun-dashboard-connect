/**
 * Notification Test Page
 * 
 * Comprehensive testing interface for cross-platform notifications
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Smartphone,
  Monitor,
  Wifi,
  Settings
} from 'lucide-react';
import { 
  getNotificationStatus,
  requestNotificationPermission,
  showCrossPlatformNotification,
  sendAlert,
  showTimerNotification,
  showReplyNotification,
  testNotification
} from '@/services/crossPlatformNotificationManager';
import DeviceSpecificGuidance from '@/components/DeviceSpecificGuidance';
import { toast } from 'sonner';

export default function NotificationTest() {
  const [status, setStatus] = useState<any>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);

  useEffect(() => {
    refreshStatus();
  }, []);

  const refreshStatus = () => {
    const currentStatus = getNotificationStatus();
    setStatus(currentStatus);
    console.log('Current notification status:', currentStatus);
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestNotificationPermission();
      
      if (result.granted) {
        toast.success('Notification permission granted!');
      } else {
        toast.error(result.error || 'Permission not granted');
      }
      
      refreshStatus();
    } catch (error) {
      toast.error('Failed to request permission');
    } finally {
      setIsRequesting(false);
    }
  };

  const runTest = async (testName: string, testFn: () => boolean | void | Promise<boolean>) => {
    try {
      const result = await testFn();
      if (result !== false) {
        toast.success(`${testName} test completed`);
      } else {
        toast.error(`${testName} test failed`);
      }
    } catch (error) {
      toast.error(`${testName} test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification System Test</h1>
          <p className="text-muted-foreground">Test cross-platform notification functionality</p>
        </div>
        <Button onClick={refreshStatus} variant="outline">
          Refresh Status
        </Button>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Current Status
          </CardTitle>
          <CardDescription>
            Platform: {status.platform} | User Role: {status.userRole || 'Not set'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${status.isSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium">Browser Support</p>
              <p className="text-xs text-muted-foreground">{status.isSupported ? 'Supported' : 'Not supported'}</p>
            </div>
            
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${status.hasPermission ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <p className="text-sm font-medium">Permission</p>
              <p className="text-xs text-muted-foreground">{status.hasPermission ? 'Granted' : 'Not granted'}</p>
            </div>
            
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${status.isFCMAvailable ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <p className="text-sm font-medium">FCM</p>
              <p className="text-xs text-muted-foreground">{status.isFCMAvailable ? 'Available' : 'Limited'}</p>
            </div>
            
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${status.initialized ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <p className="text-sm font-medium">System</p>
              <p className="text-xs text-muted-foreground">{status.initialized ? 'Initialized' : 'Not initialized'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Capabilities:</h4>
            <div className="flex flex-wrap gap-2">
              {status.capabilities.map((capability: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>

          {status.token && (
            <div className="space-y-2">
              <h4 className="font-medium">FCM Token:</h4>
              <code className="text-xs bg-muted p-2 rounded block break-all">
                {status.token.substring(0, 50)}...
              </code>
            </div>
          )}

          {status.recommendations.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Recommendations:</strong>
                <ul className="mt-2 space-y-1">
                  {status.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm">• {rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Permission Management */}
      {!status.hasPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permission Required
            </CardTitle>
            <CardDescription>
              Grant notification permission to enable alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRequestPermission} 
              disabled={isRequesting || !status.isSupported}
              className="w-full"
            >
              {isRequesting ? 'Requesting...' : 'Request Notification Permission'}
            </Button>
            
            <Button 
              onClick={() => setShowGuidance(true)} 
              variant="outline"
              className="w-full"
            >
              Show Device-Specific Setup Guide
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      {status.hasPermission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Notification Tests
            </CardTitle>
            <CardDescription>
              Test different types of notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => runTest('Basic', () => testNotification())}
                variant="outline"
              >
                Basic Test
              </Button>
              
              <Button 
                onClick={() => runTest('Custom', () => 
                  showCrossPlatformNotification('Custom Test', {
                    body: 'This is a custom notification test with all features',
                    data: { type: 'test' }
                  })
                )}
                variant="outline"
              >
                Custom Test
              </Button>
              
              <Button 
                onClick={() => runTest('Alert', () => 
                  sendAlert('Security Alert', 'TEST COUNCIL', 'This is a test security alert notification', [], false)
                )}
                variant="outline"
              >
                Alert Test
              </Button>
              
              <Button 
                onClick={() => runTest('Urgent Alert', () => 
                  sendAlert('Emergency', 'TEST COUNCIL', 'This is a test emergency notification', [], true)
                )}
                variant="outline"
              >
                Urgent Alert Test
              </Button>
              
              <Button 
                onClick={() => runTest('Timer', () => 
                  showTimerNotification('Test Timer')
                )}
                variant="outline"
              >
                Timer Test
              </Button>
              
              <Button 
                onClick={() => runTest('Reply', () => 
                  showReplyNotification('Test User', 'This is a test reply message', 'test-alert-123')
                )}
                variant="outline"
              >
                Reply Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Guidance Modal */}
      {showGuidance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <DeviceSpecificGuidance 
            onClose={() => setShowGuidance(false)}
            showCloseButton={true}
          />
        </div>
      )}
    </div>
  );
}