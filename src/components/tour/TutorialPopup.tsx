import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, X } from 'lucide-react';

interface TutorialPopupProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkip: () => void;
  userName?: string;
}

export const TutorialPopup: React.FC<TutorialPopupProps> = ({
  isOpen,
  onStartTour,
  onSkip,
  userName
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Welcome{userName ? `, ${userName}` : ''}!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            It looks like you're new here! Would you like to take a quick tour to learn how to use the dashboard?
          </p>
          
          <p className="text-sm text-muted-foreground">
            The tutorial will show you:
          </p>
          
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• How to manage participants</li>
            <li>• Creating and responding to alerts</li>
            <li>• Using the timer system</li>
            <li>• File sharing features</li>
          </ul>
          
          <div className="flex gap-3 pt-4">
            <Button onClick={onStartTour} className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              Start Tutorial
            </Button>
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Skip for Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};