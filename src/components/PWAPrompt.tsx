import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Smartphone, Download, Bell } from 'lucide-react';
import { isIOS, isSafari, isPwa } from '@/utils/crossPlatformNotifications';

interface PWAPromptProps {
  onClose?: () => void;
  showForNotifications?: boolean;
}

export function PWAPrompt({ onClose, showForNotifications = false }: PWAPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed this prompt
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      setHasBeenDismissed(true);
      return;
    }

    // Only show for iOS Safari users who haven't installed as PWA
    if (isIOS() && isSafari() && !isPwa()) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    onClose?.();
  };

  const handleInstallInstructions = () => {
    // Don't auto-dismiss when showing install instructions
    // User can manually close if they want
  };

  if (!isVisible || hasBeenDismissed || !isIOS() || !isSafari() || isPwa()) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {showForNotifications ? (
                <>
                  <Bell className="h-5 w-5 text-primary" />
                  Enable Lock Screen Notifications
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5 text-primary" />
                  Install BMUNIS App
                </>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showForNotifications ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                To receive notifications on your lock screen, you need to add BMUNIS to your home screen as an app.
              </p>
              
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800 font-medium mb-1">
                  Why install as an app?
                </p>
                <p className="text-xs text-amber-700">
                  iOS only shows push notifications on the lock screen for apps installed to the home screen, not regular websites.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Get the best experience with faster loading and notifications by adding BMUNIS to your home screen.
            </p>
          )}
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-xs">
                1
              </div>
              <div>
                <p className="font-medium">Tap the Share button</p>
                <p className="text-muted-foreground text-xs">Located at the bottom of Safari</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-xs">
                2
              </div>
              <div>
                <p className="font-medium">Select "Add to Home Screen"</p>
                <p className="text-muted-foreground text-xs">Scroll down in the share menu to find this option</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium text-xs">
                3
              </div>
              <div>
                <p className="font-medium">Tap "Add"</p>
                <p className="text-muted-foreground text-xs">Confirm to add BMUNIS to your home screen</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleDismiss} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleInstallInstructions} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Got It
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PWAPrompt;