
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface AttendanceAdminHeaderProps {
  isRefreshing: boolean;
  handleRefreshData: () => void;
}

export const AttendanceAdminHeader: React.FC<AttendanceAdminHeaderProps> = ({
  isRefreshing,
  handleRefreshData
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Administration</h1>
        <p className="text-gray-500 mt-1">
          Manage participants and monitor attendance across all councils
        </p>
      </div>
      
      <Button 
        onClick={handleRefreshData} 
        variant="outline" 
        disabled={isRefreshing} 
        className="w-full sm:w-auto"
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <RefreshCw size={16} className="mr-2" />
        )}
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </Button>
    </div>
  );
};
