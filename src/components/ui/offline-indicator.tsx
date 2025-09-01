import React from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  if (isOnline && !isSlowConnection) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium ${
          isOnline ? 'bg-yellow-500 text-yellow-900' : 'bg-red-500 text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isOnline ? (
            <>
              <Signal className="w-4 h-4" />
              <span>Slow connection detected ({effectiveType}) - Some features may be limited</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You are offline - Limited functionality available</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}