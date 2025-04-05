
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNotifications } from '@/hooks/useNotifications';
import { getNotificationSettingsInstructions } from '@/utils/notificationPermission';
import { Button } from '@/components/ui/button';
import { Bell, Info, Settings } from 'lucide-react';

interface IOSNotificationModalProps {
  open: boolean;
  onClose: () => void;
}

const IOSNotificationModal: React.FC<IOSNotificationModalProps> = ({ 
  open, 
  onClose 
}) => {
  const { isIOS, iosVersion, permissionGranted } = useNotifications();
  
  // Don't show if not iOS or already granted
  if (!isIOS || permissionGranted || !open) {
    return null;
  }
  
  const instructions = getNotificationSettingsInstructions();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Enable Notifications on iOS
          </DialogTitle>
          <DialogDescription>
            {iosVersion >= 16.4 ? 
              "iOS 16.4+ supports push notifications, but you need to grant permission." :
              "iOS requires manual notification setup in your browser settings."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-start space-x-3 bg-blue-50 p-3 rounded-md">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-blue-800">
              <h4 className="font-medium">Important for iOS Users</h4>
              <p className="text-sm mt-1">
                {iosVersion >= 16.4 ? 
                  "On iOS 16.4+, you'll need to grant notification permissions when prompted." :
                  "On iOS 16-16.3, you'll need to manually enable notifications in your browser settings."
                }
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-medium">Instructions</h3>
            </div>
            <p className="text-sm text-gray-600 pl-6">{instructions}</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Later
          </Button>
          <Button onClick={onClose}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IOSNotificationModal;
