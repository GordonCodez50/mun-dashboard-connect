
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useParticipants } from '@/hooks/useParticipants';
import { AttendanceAdminHeader } from '@/components/attendance/AttendanceAdminHeader';
import { AttendanceFilters } from '@/components/attendance/AttendanceFilters';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceViewTab } from '@/components/attendance/AttendanceViewTab';
import { AttendanceManageTab } from '@/components/attendance/AttendanceManageTab';
import { AttendanceExport } from '@/components/attendance/AttendanceExport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, UserPlus, Download } from 'lucide-react';
import { toast } from 'sonner';

const AdminAttendance = () => {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<'day1' | 'day2'>('day1');
  const [selectedCouncil, setSelectedCouncil] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    participants, 
    loading, 
    error, 
    isDay1, 
    isDay2, 
    addParticipant,
    addMultipleParticipants,
    markAttendance, 
    batchMarkAttendance 
  } = useParticipants();

  // Get list of councils for filtering
  const councils = Array.from(new Set(participants.map(p => p.council))).sort();
  
  // Filter participants by selected council
  const filteredParticipants = selectedCouncil === 'all'
    ? participants
    : participants.filter(p => p.council === selectedCouncil);
  
  // Handle refresh data
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    
    try {
      // This would be replaced with actual API call in production
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Attendance data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-x-hidden">
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 overflow-y-auto w-full">
        <div className={`p-4 ${isMobile ? 'pb-24' : 'p-8'} animate-fade-in`}>
          <AttendanceAdminHeader 
            isRefreshing={isRefreshing}
            handleRefreshData={handleRefreshData}
          />
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-3 text-gray-600">Loading attendance data...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <AttendanceFilters
                  selectedCouncil={selectedCouncil}
                  setSelectedCouncil={setSelectedCouncil}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  councils={councils}
                  isDay1={isDay1}
                  isDay2={isDay2}
                />
              </div>
              
              <AttendanceSummary 
                participants={filteredParticipants} 
                selectedDate={selectedDate}
                council={selectedCouncil !== 'all' ? selectedCouncil : undefined}
              />
              
              <div className="mt-6">
                <Tabs defaultValue="view" className="w-full">
                  <TabsList className="grid grid-cols-3 md:w-[600px] mb-4">
                    <TabsTrigger value="view" className="flex items-center gap-2">
                      <Users size={16} /> 
                      <span>View Attendance</span>
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="flex items-center gap-2">
                      <UserPlus size={16} /> 
                      <span>Manage Participants</span>
                    </TabsTrigger>
                    <TabsTrigger value="export" className="flex items-center gap-2">
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
                    />
                  </TabsContent>
                  
                  <TabsContent value="export" className="space-y-4">
                    <AttendanceExport
                      participants={participants}
                      councils={councils}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
