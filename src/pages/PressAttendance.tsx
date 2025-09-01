import React, { useState, useEffect } from 'react';
import { PressLayout } from '@/components/layout/PressLayout';
import { AttendanceHeader } from '@/components/attendance/AttendanceHeader';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceContent } from '@/components/attendance/AttendanceContent';
import { useAuth } from '@/context/AuthContext';
import { useParticipants } from '@/hooks/useParticipants';
import { motion } from 'framer-motion';
import { getCurrentDateInfo } from '@/utils/participantUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { firestoreService } from '@/services/firebaseService';
import { toast } from 'sonner';

const PressAttendance = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedDate, setSelectedDate] = useState<'day1' | 'day2'>('day1');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allCouncils, setAllCouncils] = useState<string[]>([]);

  // Get current date info to set default
  const { isDay1, isDay2 } = getCurrentDateInfo();
  
  // Initialize with current day
  useEffect(() => {
    if (isDay2) {
      setSelectedDate('day2');
    } else {
      setSelectedDate('day1');
    }
  }, [isDay1, isDay2]);

  // Fetch councils for participant form
  useEffect(() => {
    const fetchCouncils = async () => {
      try {
        const councils = await firestoreService.getCouncilsFromUsers();
        setAllCouncils(councils.map(c => c.name));
      } catch (error) {
        console.error('Error fetching councils:', error);
      }
    };

    fetchCouncils();
  }, []);

  // Use participants hook with press access (all councils)
  const {
    participants,
    loading,
    error,
    addParticipant,
    addMultipleParticipants,
    markAttendance: originalMarkAttendance,
    batchMarkAttendance: originalBatchMarkAttendance
  } = useParticipants();

  // Wrap attendance functions to add source tracking
  const markAttendance = async (participantId: string, date: 'day1' | 'day2', status: any) => {
    try {
      await originalMarkAttendance(participantId, date, status);
      // Log that this was marked by press
      console.log(`Attendance marked by Press user: ${user?.name} for participant: ${participantId}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  };

  const batchMarkAttendance = async (participantIds: string[], date: 'day1' | 'day2', status: any) => {
    try {
      await originalBatchMarkAttendance(participantIds, date, status);
      // Log that this was batch marked by press
      console.log(`Batch attendance marked by Press user: ${user?.name} for ${participantIds.length} participants`);
    } catch (error) {
      console.error('Error batch marking attendance:', error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force component re-render to refresh data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <PressLayout activeItem="/press-attendance">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading attendance data...</p>
          </div>
        </div>
      </PressLayout>
    );
  }

  if (error) {
    return (
      <PressLayout activeItem="/press-attendance">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load attendance data</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      </PressLayout>
    );
  }

  return (
    <PressLayout activeItem="/press-attendance">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <AttendanceHeader
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          userCouncil="PRESS"
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
        />

        {/* Summary */}
        <AttendanceSummary
          participants={participants}
          selectedDate={selectedDate}
          council="PRESS" // Press can see all councils
          showCouncilsOverview={true}
        />

        {/* Main Content */}
        <AttendanceContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedDate={selectedDate}
          participants={participants}
          userCouncil="PRESS"
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
    </PressLayout>
  );
};

export default PressAttendance;