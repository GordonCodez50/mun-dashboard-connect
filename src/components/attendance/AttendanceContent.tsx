
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CheckCircle, UserCog, Loader2 } from 'lucide-react';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AttendanceTable } from './AttendanceTable';
import { ParticipantForm } from './ParticipantForm';
import { CSVImport } from './CSVImport';
import { realtimeService } from '@/services/firebaseService';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Tabs 
        defaultValue="attendance" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <motion.div variants={itemVariants}>
          <TabsList className={`grid grid-cols-2 ${isMobile ? 'w-full mb-3' : 'md:w-[500px] mb-4'} bg-white/80 backdrop-blur-sm shadow-md`}>
            <TabsTrigger 
              value="participants" 
              className={`flex items-center gap-2 data-[state=active]:bg-primary/10 ${isMobile ? 'text-xs px-2 py-1.5' : ''}`}
              data-tour="manage-participants-tab"
            >
              <Users size={isMobile ? 14 : 16} /> 
              <span className={isMobile ? '' : 'hidden sm:inline'}>
                {isMobile ? 'Participants' : 'Manage Participants'}
              </span>
              {!isMobile && <span className="sm:hidden">Participants</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className={`flex items-center gap-2 data-[state=active]:bg-primary/10 ${isMobile ? 'text-xs px-2 py-1.5' : ''}`}
              data-tour="track-attendance-tab"
            >
              <CheckCircle size={isMobile ? 14 : 16} /> 
              <span className={isMobile ? '' : 'hidden sm:inline'}>
                {isMobile ? 'Attendance' : 'Track Attendance'}
              </span>
              {!isMobile && <span className="sm:hidden">Attendance</span>}
            </TabsTrigger>
          </TabsList>
        </motion.div>
        
        <TabsContent value="participants" className={`space-y-${isMobile ? '3' : '4'}`}>
          <motion.div 
            variants={itemVariants}
            className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'}`}
          >
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <ParticipantForm 
                onSubmit={addParticipant} 
                councils={allCouncils} 
              />
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <CSVImport 
                onImport={addMultipleParticipants} 
                councilRestriction={userCouncil}
              />
            </motion.div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="attendance" className={`space-y-${isMobile ? '3' : '4'}`}>
          <motion.div 
            variants={itemVariants}
            className={`bg-white/95 backdrop-blur-sm ${isMobile ? 'p-3' : 'p-4'} rounded-lg border shadow-md`}
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className={`flex flex-col ${isMobile ? 'gap-2 mb-3' : 'sm:flex-row items-start sm:items-center justify-between gap-4 mb-4'}`}>
              <div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium flex items-center gap-2`}>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 10 }}
                  >
                    <UserCog size={isMobile ? 16 : 18} className="text-primary" />
                  </motion.div>
                  Attendance Tracker
                </h3>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Mark attendance for {userCouncil} participants
                </p>
              </div>
            </div>
            
            <div data-tour="attendance-marking">
              <AttendanceTable
                participants={participants}
                selectedDate={selectedDate}
                isDateLocked={false}
                onMarkAttendance={markAttendance}
                onBatchMarkAttendance={batchMarkAttendance}
              />
            </div>
            
            <motion.div 
              className={`${isMobile ? 'mt-4' : 'mt-6'} flex ${isMobile ? 'justify-center' : 'justify-end'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleSubmitAttendance}
                  disabled={isSaving}
                  className={`flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow ${isMobile ? 'w-full px-8 text-sm' : ''}`}
                  data-tour="submit-attendance"
                  size={isMobile ? 'sm' : 'default'}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle size={isMobile ? 14 : 16} />
                  )}
                  {isSaving ? 'Submitting...' : 'Submit Attendance'}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
