
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { FileText } from 'lucide-react';
import { canEditDate } from '@/utils/participantUtils';
import { motion } from 'framer-motion';

interface AttendanceViewTabProps {
  filteredParticipants: ParticipantWithAttendance[];
  selectedDate: 'day1' | 'day2';
  selectedCouncil: string;
  markAttendance: (participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => void;
  batchMarkAttendance: (participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => void;
}

export const AttendanceViewTab: React.FC<AttendanceViewTabProps> = ({
  filteredParticipants,
  selectedDate,
  selectedCouncil,
  markAttendance,
  batchMarkAttendance,
}) => {
  const canEdit = true; // Always allow editing

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)" }}
    >
      <Card className="overflow-hidden border-none bg-white/95 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <motion.div
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 10 }}
            >
              <FileText size={18} className="text-primary" />
            </motion.div>
            Attendance Overview
          </CardTitle>
          <CardDescription>
            {selectedCouncil === 'all' 
              ? 'View attendance across all councils' 
              : `View attendance for ${selectedCouncil}`}
            {!canEdit && (
              <span className="text-yellow-600 block mt-1">
                (View only - editing is only available on the respective day)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceTable
            participants={filteredParticipants}
            selectedDate={selectedDate}
            isDateLocked={!canEdit}
            showCouncil={selectedCouncil === 'all'}
            onMarkAttendance={markAttendance}
            onBatchMarkAttendance={batchMarkAttendance}
            readOnly={false}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};
