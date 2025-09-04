
import React from 'react';
import { User } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Bell, BellOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

type AdminHeaderProps = {
  user: User | null;
  hideResolved: boolean;
  alertsMuted: boolean;
  toggleHideResolved: () => void;
  toggleAlertsMute: () => void;
  isMobile?: boolean;  // Added isMobile as an optional prop
};

export const AdminHeader = ({ 
  user, 
  hideResolved, 
  alertsMuted,
  toggleHideResolved,
  toggleAlertsMute,
  isMobile
}: AdminHeaderProps) => {
  return (
    <header className={`flex flex-col ${isMobile ? 'space-y-4' : 'md:flex-row'} justify-between items-start md:items-center mb-8`}>
      <div>
        <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
        <p className="text-muted-foreground mt-1">
          Welcome, {user?.name}
        </p>
      </div>
      
      <div className="flex items-center gap-2 mt-4 md:mt-0">
        <ThemeToggle />
        
        <button
          onClick={toggleAlertsMute}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            alertsMuted
              ? 'bg-muted text-muted-foreground hover:bg-muted/80'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          {alertsMuted ? <BellOff size={16} /> : <Bell size={16} />}
          {alertsMuted ? 'Unmute Alerts' : 'Mute Alerts'}
        </button>
        
        <button
          onClick={toggleHideResolved}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            hideResolved
              ? 'bg-muted text-muted-foreground hover:bg-muted/80'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          {hideResolved ? <Eye size={16} /> : <EyeOff size={16} />}
          {hideResolved ? 'Show All' : 'Hide Resolved'}
        </button>
      </div>
    </header>
  );
};
