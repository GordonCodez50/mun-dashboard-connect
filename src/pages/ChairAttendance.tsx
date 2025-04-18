
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { useParticipants } from '@/hooks/useParticipants';
import { ParticipantForm } from '@/components/attendance/ParticipantForm';
import { CSVImport } from '@/components/attendance/CSVImport';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { AttendanceTroubleshoot } from '@/components/attendance/AttendanceTroubleshoot';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CheckCircle, UserCog, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { canEditDate } from '@/utils/participantUtils';

const ChairAttendance = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('attendance');
  const [selectedDate, setSelectedDate] = useState<'day1' | 'day2'>('day1');
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    participants, 
    loading, 
    error, 
    isDay1, 
    isDay2, 
    addParticipant, 
    addMultipleParticipants, 
    markAttendance, 
    batchMarkAttendance,
    deleteParticipant
  } = useParticipants();

  const allCouncils = Array.from(new Set(participants.map(p => p.council))).sort();
  
  const userCouncil = user?.council || '';

  const [isRefreshing, setIsRefreshing] = useState(false);

  const canEdit = canEditDate(selectedDate);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    toast.info('Refreshing page...');
    
    // Short timeout to allow the toast to show before refresh
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  const handleSubmitAttendance = async () => {
    setIsSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dayField = selectedDate === 'day1' ? 'day1' : 'day2';
      const markedCount = participants.filter(p => p.attendance[dayField] !== 'not-marked').length;
      const totalCount = participants.length;
      
      toast.success(
        `Attendance submitted successfully`, 
        { description: `${markedCount} of ${totalCount} participants marked` }
      );
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error('Failed to submit attendance');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-x-hidden">
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 overflow-y-auto w-full">
        <div className={`p-4 ${isMobile ? 'pb-24' : 'p-8'} animate-fade-in`}>
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
                disabled={!isDay1 && !isDay2}
                className={`${!isDay1 && !isDay2 ? 'opacity-50' : ''}`}
              >
                Day 1 (16th March)
              </Button>
              <Button
                variant={selectedDate === 'day2' ? 'default' : 'outline'}
                onClick={() => setSelectedDate('day2')}
                disabled={!isDay1 && !isDay2}
                className={`${!isDay1 && !isDay2 ? 'opacity-50' : ''}`}
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
                <Tabs 
                  defaultValue="attendance" 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 md:w-[500px] mb-4">
                    <TabsTrigger value="participants" className="flex items-center gap-2">
                      <Users size={16} /> 
                      <span className="hidden sm:inline">Manage Participants</span>
                      <span className="sm:hidden">Participants</span>
                    </TabsTrigger>
                    <TabsTrigger value="attendance" className="flex items-center gap-2">
                      <CheckCircle size={16} /> 
                      <span className="hidden sm:inline">Track Attendance</span>
                      <span className="sm:hidden">Attendance</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="participants" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ParticipantForm 
                        onSubmit={addParticipant} 
                        councils={allCouncils} 
                      />
                      
                      <CSVImport 
                        onImport={addMultipleParticipants} 
                        councilRestriction={userCouncil}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="attendance" className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <UserCog size={18} className="text-primary" />
                            Attendance Tracker
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Mark attendance for {userCouncil} participants
                            {!canEdit && (
                              <span className="text-yellow-600 ml-2">
                                (View only - can only edit on the respective day)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <AttendanceTable
                        participants={participants}
                        selectedDate={selectedDate}
                        isDateLocked={!canEdit}
                        onMarkAttendance={markAttendance}
                        onBatchMarkAttendance={batchMarkAttendance}
                        deleteParticipant={deleteParticipant}
                      />
                      
                      <div className="mt-6 flex justify-end">
                        <Button 
                          onClick={handleSubmitAttendance}
                          disabled={isSaving || !canEdit}
                          className="flex items-center gap-2"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          {isSaving ? 'Submitting...' : 'Submit Attendance'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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
