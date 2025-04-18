
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceHeaderProps {
  userCouncil: string;
  selectedDate: 'day1' | 'day2';
  setSelectedDate: (date: 'day1' | 'day2') => void;
  isRefreshing: boolean;
  setIsRefreshing: (value: boolean) => void;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  userCouncil,
  selectedDate,
  setSelectedDate,
  isRefreshing,
  setIsRefreshing,
}) => {
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    toast.info('Refreshing page...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-500 mt-1">
          Manage participants and track attendance for {userCouncil}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={selectedDate === 'day1' ? 'default' : 'outline'}
          onClick={() => setSelectedDate('day1')}
          className="whitespace-nowrap"
        >
          Day 1 (16th March)
        </Button>
        <Button
          variant={selectedDate === 'day2' ? 'default' : 'outline'}
          onClick={() => setSelectedDate('day2')}
          className="whitespace-nowrap"
        >
          Day 2 (17th March)
        </Button>
      </div>
      
      <Button 
        onClick={handleRefreshData} 
        variant="outline" 
        disabled={isRefreshing}
        className="w-full md:w-auto"
      >
        {isRefreshing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
      </Button>
    </div>
  );
};
