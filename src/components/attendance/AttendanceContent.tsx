
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CheckCircle, UserCog, Loader2 } from 'lucide-react';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AttendanceTable } from './AttendanceTable';
import { ParticipantForm } from './ParticipantForm';
import { CSVImport } from './CSVImport';
import { realtimeService } from '@/services/realtimeService';

interface AttendanceContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDate: 'day1' | 'day2';
  participants: ParticipantWithAttendance[];
  userCouncil: string;
  userName?: string;
  allCouncils: string[];
  isSaving: boolean;
  setIsSaving: (value: boolean) => void;
  addParticipant: (participant: Omit<ParticipantWithAttendance, 'id'>) => Promise<string>;
  addMultipleParticipants: (participants: Omit<ParticipantWithAttendance, 'id'>[]) => Promise<string[]>;
  markAttendance: (participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => Promise<void>;
  batchMarkAttendance: (participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => Promise<void>;
}

export const AttendanceContent: React.FC<AttendanceContentProps> = ({
  activeTab,
  setActiveTab,
  selectedDate,
  participants,
  userCouncil,
  userName,
  allCouncils,
  isSaving,
  setIsSaving,
  addParticipant,
  addMultipleParticipants,
  markAttendance,
  batchMarkAttendance,
}) => {
  const handleSubmitAttendance = async () => {
    setIsSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dayField = selectedDate === 'day1' ? 'day1' : 'day2';
      const markedCount = participants.filter(p => p.attendance[dayField] !== 'not-marked').length;
      const totalCount = participants.length;
      
      await realtimeService.createAlert({
        type: 'Attendance Submission',
        council: userCouncil,
        message: `${userCouncil} submitted attendance for ${selectedDate === 'day1' ? 'Day 1' : 'Day 2'}`,
        chairName: userName || 'Chair',
        timestamp: Date.now(),
        status: 'pending',
        priority: 'normal'
      });
      
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
              </p>
            </div>
          </div>
          
          <AttendanceTable
            participants={participants}
            selectedDate={selectedDate}
            isDateLocked={false}
            onMarkAttendance={markAttendance}
            onBatchMarkAttendance={batchMarkAttendance}
          />
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSubmitAttendance}
              disabled={isSaving}
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
  );
};
