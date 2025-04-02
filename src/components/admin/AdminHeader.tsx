
import React from 'react';
import { User } from '@/types/auth';
import { Bell, BellOff, EyeOff, Eye } from 'lucide-react';

type AdminHeaderProps = {
  user: User | null;
  hideResolved: boolean;
  alertsMuted: boolean;
  toggleHideResolved: () => void;
  toggleAlertsMute: () => void;
};

export const AdminHeader = ({ 
  user, 
  hideResolved, 
  alertsMuted, 
  toggleHideResolved, 
  toggleAlertsMute 
}: AdminHeaderProps) => {
  return (
    <header className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.name}
        </p>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={toggleHideResolved}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
            hideResolved
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          } button-transition`}
        >
          {hideResolved ? (
            <>
              <Eye size={18} />
              Show Resolved
            </>
          ) : (
            <>
              <EyeOff size={18} />
              Hide Resolved
            </>
          )}
        </button>
        
        <button
          onClick={toggleAlertsMute}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
            alertsMuted 
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
              : 'bg-accent text-white hover:bg-accent/90'
          } button-transition`}
        >
          {alertsMuted ? (
            <>
              <BellOff size={18} />
              Alerts Muted
            </>
          ) : (
            <>
              <Bell size={18} />
              Mute Alerts
            </>
          )}
        </button>
      </div>
    </header>
  );
};
