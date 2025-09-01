
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AdminMobileNav } from '@/components/layout/AdminMobileNav';
import NotificationInitializer from '@/components/NotificationInitializer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useParticipants } from '@/hooks/useParticipants';
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime';
import { useAlertsSound } from '@/hooks/useAlertsSound';
import { AttendanceAdminHeader } from '@/components/attendance/AttendanceAdminHeader';
import { AttendanceFilters } from '@/components/attendance/AttendanceFilters';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceViewTab } from '@/components/attendance/AttendanceViewTab';
import { AttendanceManageTab } from '@/components/attendance/AttendanceManageTab';
import { AdminAttendanceTable } from '@/components/attendance/AdminAttendanceTable';
import { AttendanceExport } from '@/components/attendance/AttendanceExport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, UserPlus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { AttendanceTroubleshoot } from '@/components/attendance/AttendanceTroubleshoot';
import { getCurrentDateInfo } from '@/utils/participantUtils';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const AdminAttendance = () => {
  const isMobile = useIsMobile();
  
  // Get the current date info to set default selected date
  const { isDay1, isDay2 } = getCurrentDateInfo();
  
  // Set the default selected date based on current date, default to day1 if neither
  const defaultSelectedDate = isDay2 ? 'day2' : 'day1';
  const [selectedDate, setSelectedDate] = useState<'day1' | 'day2'>(defaultSelectedDate);
  
  const [selectedCouncil, setSelectedCouncil] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [councils, setCouncils] = useState<string[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [alertsMuted, setAlertsMuted] = useState(false);

  // Add alert notification system
  const { data: alertsData } = useFirebaseRealtime<any[]>('NEW_ALERT');
  useAlertsSound(liveAlerts, alertsMuted);

  // Process alerts data
  useEffect(() => {
    if (alertsData && Array.isArray(alertsData)) {
      const validAlerts = alertsData.filter(alert => 
        alert && 
        alert.id && 
        alert.type && 
        alert.council && 
        alert.message &&
        alert.type !== 'undefined' &&
        alert.council !== 'undefined'
      );
      setLiveAlerts(validAlerts);
    }
  }, [alertsData]);
  
  const { 
    participants, 
    loading, 
    error, 
    addParticipant,
    addMultipleParticipants,
    deleteParticipant,
    markAttendance, 
    batchMarkAttendance
  } = useParticipants();

  // Fetch councils from chair profiles
  React.useEffect(() => {
    const fetchCouncils = async () => {
      try {
        const { data: chairProfiles, error } = await supabase
          .from('profiles')
          .select('council')
          .eq('role', 'chair')
          .not('council', 'is', null);

        if (error) {
          console.error('Error fetching councils:', error);
          return;
        }

        const chairCouncils = chairProfiles
          .map(profile => profile.council)
          .filter(council => council) // Remove null/undefined values
          .filter((council, index, arr) => arr.indexOf(council) === index); // Remove duplicates

        // Also include any councils from existing participants
        const existingCouncils = Array.from(new Set(participants.map(p => p.council)));
        const allCouncils = Array.from(new Set([...chairCouncils, ...existingCouncils])).sort();
        
        setCouncils(allCouncils);
      } catch (error) {
        console.error('Error fetching councils:', error);
      }
    };

    fetchCouncils();
  }, [participants]);

  
  const filteredParticipants = selectedCouncil === 'all'
    ? participants
    : participants.filter(p => p.council === selectedCouncil);
  
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    toast.info('Refreshing page...');
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      <AdminMobileNav />
      <NotificationInitializer />
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={`flex-1 w-full`}
        style={{ marginLeft: !isMobile ? 'var(--sidebar-width, 256px)' : '0' }}
      >
        <div className={`p-4 ${isMobile ? 'pb-24' : 'p-8'}`}>
          <motion.div variants={itemVariants}>
            <AttendanceAdminHeader 
              isRefreshing={isRefreshing}
              handleRefreshData={handleRefreshData}
            />
          </motion.div>

          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <span className="ml-3 text-gray-600 animate-pulse">Loading attendance data...</span>
            </motion.div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-100 p-4 rounded-md text-red-800 shadow-sm"
            >
              {error}
            </motion.div>
          ) : (
            <>
              <motion.div variants={itemVariants} className="mb-6">
                <AttendanceFilters
                  selectedCouncil={selectedCouncil}
                  setSelectedCouncil={setSelectedCouncil}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  councils={councils}
                  isDay1={true} // Always enable both days
                  isDay2={true} // Always enable both days
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <AttendanceSummary 
                  participants={filteredParticipants} 
                  selectedDate={selectedDate}
                  showCouncilsOverview={false}
                />
              </motion.div>
              
              <motion.div variants={itemVariants} className="mt-6">
                <Tabs defaultValue="view" className="w-full">
                  <TabsList className="grid grid-cols-3 md:w-[600px] mb-4 bg-white/80 backdrop-blur-sm shadow-md">
                    <TabsTrigger value="view" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <Users size={16} /> 
                      <span>View Attendance</span>
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <UserPlus size={16} /> 
                      <span>Manage Participants</span>
                    </TabsTrigger>
                    <TabsTrigger value="export" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
                      <Download size={16} /> 
                      <span>Export Data</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="view" className="space-y-4">
                    <AttendanceViewTab
                      filteredParticipants={filteredParticipants}
                      selectedDate={selectedDate}
                      selectedCouncil={selectedCouncil}
                      markAttendance={markAttendance}
                      batchMarkAttendance={batchMarkAttendance}
                    />
                  </TabsContent>
                  
                  <TabsContent value="manage" className="space-y-4">
                    <AttendanceManageTab
                      addParticipant={addParticipant}
                      addMultipleParticipants={addMultipleParticipants}
                      councils={councils}
                      participants={participants}
                      deleteParticipant={deleteParticipant}
                    />
                  </TabsContent>
                  
                  <TabsContent value="export" className="space-y-4">
                    <AttendanceExport
                      participants={participants}
                      councils={councils}
                    />
                  </TabsContent>
                </Tabs>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="mt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <AttendanceTroubleshoot />
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminAttendance;
