
import React from 'react';
import { 
  isIOS, 
  isAndroid, 
  isChrome, 
  isSafari,
  getIOSVersion,
  getNotificationSettingsInstructions,
  canPotentiallyEnableNotifications
} from '@/utils/notificationPermission';
import { Bell, Settings, AlertTriangle, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface NotificationPermissionGuideProps {
  onClose?: () => void;
}

const NotificationPermissionGuide: React.FC<NotificationPermissionGuideProps> = ({ onClose }) => {
  const { 
    isSupported, 
    permissionGranted, 
    requestPermission, 
    requestInProgress 
  } = useNotifications();
  
  const iosVersion = getIOSVersion();
  const canEnableNotifications = canPotentiallyEnableNotifications();
  
  // Determine platform-specific information
  let platformMessage = '';
  let showManualInstructions = false;
  
  if (isIOS()) {
    if (iosVersion >= 16.4) {
      platformMessage = "iOS 16.4+ supports web push notifications";
      showManualInstructions = !permissionGranted;
    } else if (iosVersion >= 16) {
      platformMessage = "iOS 16.0-16.3 have limited notification support";
      showManualInstructions = true;
    } else {
      platformMessage = "Your iOS version doesn't support web push notifications";
      showManualInstructions = false;
    }
  } else if (isAndroid()) {
    platformMessage = `Android ${isChrome() ? 'Chrome' : ''} detected`;
    showManualInstructions = !permissionGranted;
  }
  
  // Handle request permission click
  const handleRequestPermission = async () => {
    await requestPermission();
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notification Setup</CardTitle>
          </div>
          {permissionGranted && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Check className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          )}
        </div>
        <CardDescription>
          {permissionGranted 
            ? "Notifications are enabled for this application"
            : "Enable notifications to stay updated with important alerts"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isSupported && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">Your browser doesn't support notifications</p>
              <p className="text-sm mt-1">Try using a modern browser like Chrome, Firefox, or Safari.</p>
            </div>
          </div>
        )}
        
        {isSupported && !permissionGranted && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-md">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Device information</p>
                <p className="text-sm mt-1">{platformMessage}</p>
                {isIOS() && iosVersion < 16.4 && (
                  <p className="text-xs mt-2 text-gray-500">
                    Web push notifications are only supported on iOS 16.4 and above.
                  </p>
                )}
              </div>
            </div>
            
            {canEnableNotifications && (
              <Button 
                onClick={handleRequestPermission}
                disabled={requestInProgress}
                className="w-full"
              >
                {requestInProgress ? "Requesting..." : "Request Notification Permission"}
              </Button>
            )}
            
            {showManualInstructions && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <h3 className="font-medium text-sm">Manual setup instructions</h3>
                </div>
                <Separator className="my-2" />
                <p className="text-sm text-gray-600">
                  {getNotificationSettingsInstructions()}
                </p>
              </div>
            )}
          </div>
        )}
        
        {permissionGranted && (
          <div className="flex items-start gap-3 p-3 bg-green-50 text-green-700 rounded-md">
            <Check className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Notifications enabled</p>
              <p className="text-sm mt-1">
                You will now receive important alerts and updates.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      {onClose && (
        <CardFooter className="flex justify-end pt-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default NotificationPermissionGuide;
