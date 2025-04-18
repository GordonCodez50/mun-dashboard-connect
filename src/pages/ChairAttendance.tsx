
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { useParticipants } from '@/hooks/useParticipants';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceTroubleshoot } from '@/components/attendance/AttendanceTroubleshoot';
import { AttendanceHeader } from '@/components/attendance/AttendanceHeader';
import { AttendanceContent } from '@/components/attendance/AttendanceContent';
import { getCurrentDateInfo } from '@/utils/participantUtils';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="flex h-full bg-gray-50 overflow-x-hidden">
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 overflow-y-auto w-full">
        <div className={`p-4 ${isMobile ? 'pb-24' : 'p-8'} animate-fade-in`}>
          <AttendanceHeader
            userCouncil={userCouncil}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isRefreshing={isRefreshing}
            setIsRefreshing={setIsRefreshing}
          />
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-3 text-gray-600">Loading participants...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              {error}
            </div>
          ) : (
            <>
              <AttendanceSummary 
                participants={participants} 
                selectedDate={selectedDate}
                council={userCouncil}
              />
              
              <div className="mt-6">
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
              </div>
              
              <div className="mt-10">
                <AttendanceTroubleshoot />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChairAttendance;
