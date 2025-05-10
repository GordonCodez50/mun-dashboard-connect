
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface AttendanceAdminHeaderProps {
  isRefreshing: boolean;
  handleRefreshData: () => void;
}

export const AttendanceAdminHeader: React.FC<AttendanceAdminHeaderProps> = ({
  isRefreshing,
  handleRefreshData
}) => {
  return (
    <motion.div 
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <motion.h1 
          className="text-2xl font-bold text-gray-900"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Attendance Administration
        </motion.h1>
        <motion.p 
          className="text-gray-500 mt-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Manage participants and monitor attendance across all councils
        </motion.p>
      </div>
      
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button 
          onClick={handleRefreshData} 
          variant="outline" 
          disabled={isRefreshing} 
          className="w-full sm:w-auto bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw size={16} className="mr-2" />
          )}
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </motion.div>
    </motion.div>
  );
};
