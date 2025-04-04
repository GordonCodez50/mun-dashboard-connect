
import React from 'react';
import { Bell, Volume2, VolumeX, Eye, EyeOff, Check } from 'lucide-react';
import { User } from '@/types/auth';

type AdminHeaderProps = {
  user: User | null;
  hideResolved: boolean;
  alertsMuted: boolean;
  toggleHideResolved: () => void;
  toggleAlertsMute: () => void;
  resolveAllAlerts?: () => void; // Added new prop for resolving all alerts
};

export const AdminHeader = ({
  user,
  hideResolved,
  alertsMuted,
  toggleHideResolved,
  toggleAlertsMute,
  resolveAllAlerts
}: AdminHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between mb-8 p-5 rounded-lg bg-white shadow-sm border border-gray-100">
      <div>
        <h1 className="text-2xl font-bold text-primary mb-1">
          Admin Dashboard
        </h1>
        <p className="text-gray-500">
          Welcome back, {user?.name || 'Admin'}
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
        <button
          onClick={toggleHideResolved}
          className="px-3 py-1.5 flex items-center gap-2 text-sm rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          title={hideResolved ? "Show all alerts" : "Hide resolved alerts"}
        >
          {hideResolved ? <Eye size={16} /> : <EyeOff size={16} />}
          {hideResolved ? "Show Resolved" : "Hide Resolved"}
        </button>
        
        <button
          onClick={toggleAlertsMute}
          className="px-3 py-1.5 flex items-center gap-2 text-sm rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          title={alertsMuted ? "Unmute alerts" : "Mute alerts"}
        >
          {alertsMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {alertsMuted ? "Unmute Alerts" : "Mute Alerts"}
        </button>
        
        {resolveAllAlerts && (
          <button
            onClick={resolveAllAlerts}
            className="px-3 py-1.5 flex items-center gap-2 text-sm rounded-md bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors"
            title="Resolve all pending alerts"
          >
            <Check size={16} />
            Resolve All Alerts
          </button>
        )}
      </div>
    </div>
  );
};
