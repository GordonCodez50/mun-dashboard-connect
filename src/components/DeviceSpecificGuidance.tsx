/**
 * Device-Specific Guidance Component
 * 
 * Shows platform-specific instructions for enabling notifications
 * and getting the best experience on each device type
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Monitor, 
  Wifi, 
  Bell, 
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { 
  isIOS, 
  isAndroid, 
  isSafari, 
  isMacOS, 
  isPwa, 
  isChrome,
  isIOS164PlusWithWebPush 
} from '@/utils/crossPlatformNotifications';
import { getNotificationStatus } from '@/services/crossPlatformNotificationManager';

interface DeviceGuidanceProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const DeviceSpecificGuidance = ({ onClose, showCloseButton = true }: DeviceGuidanceProps) => {
  const [status, setStatus] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const notificationStatus = getNotificationStatus();
    setStatus(notificationStatus);
    
    // Only show guidance if notifications aren't fully set up or on limited platforms
    const shouldShow = !notificationStatus.hasPermission || 
                      notificationStatus.recommendations.length > 0 ||
                      (isIOS() && !isPwa());
    
    setIsVisible(shouldShow);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !status) return null;

  const getPlatformIcon = () => {
    if (isIOS()) return <Smartphone className="h-5 w-5" />;
    if (isAndroid()) return <Smartphone className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getPlatformColor = () => {
    if (isIOS()) return 'bg-blue-500';
    if (isAndroid()) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const renderIOSGuidance = () => {
    if (!isIOS()) return null;

    if (isPwa() && isIOS164PlusWithWebPush()) {
      return (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ Great! You're using the app as a PWA on iOS 16.4+. Full notification support is available.
          </AlertDescription>
        </Alert>
      );
    }

    if (isPwa() && !isIOS164PlusWithWebPush()) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You're using the PWA, but your iOS version may have limited notification support. 
            Update to iOS 16.4 or later for full functionality.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Download className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Add to Home Screen for best experience:</strong>
          </AlertDescription>
        </Alert>
        
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
            <span>Tap the Share button <span className="inline-block mx-1">⬆️</span> at the bottom of Safari</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
            <span>Scroll down and tap "Add to Home Screen"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
            <span>Tap "Add" to confirm</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
            <span>Launch the app from your home screen and allow notifications when prompted</span>
          </li>
        </ol>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> iOS 16.4+ required for full notification support in PWA mode.
          </p>
        </div>
      </div>
    );
  };

  const renderAndroidGuidance = () => {
    if (!isAndroid()) return null;

    if (isChrome()) {
      return (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ Chrome on Android provides excellent notification support. You're all set!
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          For the best notification experience on Android, consider using Chrome browser.
        </AlertDescription>
      </Alert>
    );
  };

  const renderSafariMacOSGuidance = () => {
    if (!isSafari() || !isMacOS()) return null;

    return (
      <div className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Bell className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Enable Safari Notifications:</strong>
          </AlertDescription>
        </Alert>
        
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
            <span>Click Safari in the menu bar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
            <span>Select "Settings" (or "Preferences" in older versions)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
            <span>Click the "Websites" tab</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
            <span>Select "Notifications" from the left panel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">5</span>
            <span>Find this website and select "Allow"</span>
          </li>
        </ol>
      </div>
    );
  };

  const renderCapabilitiesBadges = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {status.capabilities.map((capability: string, index: number) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {capability}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getPlatformColor()} text-white`}>
              {getPlatformIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{status.platform} Setup</CardTitle>
              <CardDescription>
                Optimize notifications for your device
              </CardDescription>
            </div>
          </div>
          {showCloseButton && (
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Current Status
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              {status.hasPermission ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <span>Permission: {status.hasPermission ? 'Granted' : 'Not granted'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {status.isFCMAvailable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
              <span>FCM: {status.isFCMAvailable ? 'Available' : 'Limited'}</span>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Capabilities:</h5>
            {renderCapabilitiesBadges()}
          </div>
        </div>

        {/* Platform-specific guidance */}
        <div className="space-y-4">
          {renderIOSGuidance()}
          {renderAndroidGuidance()}
          {renderSafariMacOSGuidance()}
        </div>

        {/* General recommendations */}
        {status.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Recommendations:</h4>
            <ul className="space-y-2">
              {status.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Connection status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wifi className="h-4 w-4" />
          <span>Real-time alerts active when connected</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceSpecificGuidance;