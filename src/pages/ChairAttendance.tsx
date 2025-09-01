
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { useParticipants } from '@/hooks/useParticipants';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceTroubleshoot } from '@/components/attendance/AttendanceTroubleshoot';
import { AttendanceHeader } from '@/components/attendance/AttendanceHeader';
import { AttendanceContent } from '@/components/attendance/AttendanceContent';
import { getCurrentDateInfo } from '@/utils/participantUtils';
import { Loader2 } from 'lucide-react';
import { realtimeService } from '@/services/firebaseService';
import { notificationService } from '@/services/notificationService';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChairTutorialPopup from '@/components/tutorial/ChairTutorialPopup';
import { ChairMobileNav } from '@/components/layout/ChairMobileNav';

const ChairAttendance = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('attendance');
  
  const { isDay1, isDay2 } = getCurrentDateInfo();
  const defaultSelectedDate = isDay2 ? 'day2' : 'day1';
  const [selectedDate, setSelectedDate] = useState<'day1' | 'day2'>(defaultSelectedDate);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    participants, 
    loading, 
    error, 
    addParticipant, 
    addMultipleParticipants, 
    markAttendance, 
    batchMarkAttendance
  } = useParticipants();

  const allCouncils = Array.from(new Set(participants.map(p => p.council))).sort();
  const userCouncil = user?.council || '';
  
  // Alerts integration - same as ChairDashboard
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [alertsMuted, setAlertsMuted] = useState(false);

  // Use Firebase Realtime Database for alerts
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  useAlertsSound(liveAlerts, alertsMuted);

  // Process alerts data
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      const userAlerts = alertsData
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          ...item,
          timestamp: item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp || Date.now())
        }))
        .filter(alert => 
          alert && 
          alert.id && 
          alert.type && 
          alert.council && 
          alert.message &&
          alert.type !== 'undefined' &&
          alert.council !== 'undefined' &&
          alert.message !== 'undefined' &&
          (alert.council === user?.council || alert.type === 'system' || alert.replyFrom === 'admin' || alert.replyFrom === 'press' || alert.replyFrom === 'logistics')
        );

      setLiveAlerts(userAlerts);
    }
  }, [alertsData, user?.council]);
  useEffect(() => {
    // Ensure global alert listeners are initialized
    realtimeService.initializeAlertListeners();
    
    // Set user role in service worker
    if (user && navigator.serviceWorker.controller) {
      const notificationRole = user.role === 'admin' ? 'admin' : 
                              (user.council === 'PRESS' ? 'press' : 'chair');
                              
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_USER_ROLE',
        role: notificationRole
      });
      
      // Also set in notification service
      notificationService.setUserRole(notificationRole);
    }
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100/80 overflow-hidden">
      {!isMobile && <Sidebar />}
      
      {/* Tutorial popup for first-time Chair users */}
      <ChairTutorialPopup />
      
      <div className={`flex-1 overflow-hidden w-full transition-all duration-300`}
           style={{ marginLeft: !isMobile ? 'var(--sidebar-width, 256px)' : '0' }}>
        <ScrollArea className="h-full w-full">
          <div className={`${isMobile ? 'p-3 pb-24 pt-16' : 'p-8'}`}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={`space-y-${isMobile ? '4' : '6'}`}
            >
              <motion.div variants={itemVariants}>
                <AttendanceHeader
                  userCouncil={userCouncil}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  isRefreshing={isRefreshing}
                  setIsRefreshing={setIsRefreshing}
                />
              </motion.div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <span className="ml-3 text-gray-600 mt-2">Loading participants...</span>
                  </motion.div>
                </div>
              ) : error ? (
                <motion.div 
                  className="bg-red-50 p-4 rounded-md text-red-800"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {error}
                </motion.div>
              ) : (
                <>
                  <motion.div variants={itemVariants}>
                    <AttendanceSummary 
                      participants={participants} 
                      selectedDate={selectedDate}
                      council={userCouncil}
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
                    <AttendanceContent
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      selectedDate={selectedDate}
                      participants={participants}
                      userCouncil={userCouncil}
                      userName={user?.name}
                      allCouncils={allCouncils}
                      isSaving={isSaving}
                      setIsSaving={setIsSaving}
                      addParticipant={addParticipant}
                      addMultipleParticipants={addMultipleParticipants}
                      markAttendance={markAttendance}
                      batchMarkAttendance={batchMarkAttendance}
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className={`${isMobile ? 'mt-6' : 'mt-10'}`}>
                    <AttendanceTroubleshoot />
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
        </ScrollArea>
        <ChairMobileNav />
      </div>
    </div>
  );
};

export default ChairAttendance;
