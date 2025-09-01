
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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 10 
      }
    }
  };

  return (
    <motion.div 
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div>
        <motion.h1 
          className="text-2xl md:text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
          variants={itemVariants}
        >
          Attendance Administration
        </motion.h1>
        <motion.p 
          className="text-gray-500 mt-1"
          variants={itemVariants}
        >
          Manage participants and monitor attendance across all councils
        </motion.p>
      </div>
      
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button 
          onClick={handleRefreshData} 
          variant="outline" 
          disabled={isRefreshing} 
          className="w-full sm:w-auto bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
        >
          <motion.span
            className="absolute inset-0 w-0 bg-primary/10 transition-all duration-300 ease-out group-hover:w-full"
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
          />
          <span className="relative flex items-center">
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 10 }}
              >
                <RefreshCw size={16} className="mr-2" />
              </motion.div>
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </span>
        </Button>
      </motion.div>
    </motion.div>
  );
};
