
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
    toast.info('Refreshing attendance data...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <motion.div 
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          Attendance Management
        </h1>
        <motion.div 
          className="flex items-center text-gray-500 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Calendar size={14} className="mr-1.5" />
          <span>
            Track attendance for
          </span> 
          <motion.span 
            className="font-medium ml-1 text-primary"
            initial={{ color: "#666" }}
            animate={{ color: "var(--primary)" }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {userCouncil}
          </motion.span>
          <ChevronRight size={14} className="mx-1 opacity-70" />
          <span className="text-sm italic opacity-80">
            {selectedDate === 'day1' ? 'Day 1 (16th March)' : 'Day 2 (17th March)'}
          </span>
        </motion.div>
      </motion.div>

      <motion.div 
        className="flex flex-col sm:flex-row items-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ y: 1 }}
          >
            <Button
              variant={selectedDate === 'day1' ? 'default' : 'ghost'}
              onClick={() => setSelectedDate('day1')}
              className={`whitespace-nowrap rounded-md ${selectedDate === 'day1' ? 'shadow-md' : ''} transition-all duration-300`}
              size="sm"
            >
              Day 1 (16th March)
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ y: 1 }}
          >
            <Button
              variant={selectedDate === 'day2' ? 'default' : 'ghost'}
              onClick={() => setSelectedDate('day2')}
              className={`whitespace-nowrap rounded-md ${selectedDate === 'day2' ? 'shadow-md' : ''} transition-all duration-300`}
              size="sm"
            >
              Day 2 (17th March)
            </Button>
          </motion.div>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button 
            onClick={handleRefreshData} 
            variant="outline" 
            disabled={isRefreshing}
            size="sm"
            className="bg-white shadow-sm hover:shadow-md transition-all"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 10 }}
              >
                <RefreshCw size={14} className="mr-2" />
              </motion.div>
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
