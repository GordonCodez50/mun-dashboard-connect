
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
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="overflow-hidden border-none bg-white/95 backdrop-blur-sm shadow-md rounded-xl h-full">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.6, 
                ease: "easeOut",
                delay: 0.2 
              }}
            >
              <motion.div
                animate={{ 
                  rotateY: [0, 180, 360],
                  scale: [1, 1.1, 1] 
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  repeatDelay: 8,
                  ease: "easeInOut"
                }}
              >
                <FileText size={18} className="text-primary" />
              </motion.div>
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Attendance Overview
            </motion.span>
          </CardTitle>
          <CardDescription>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {selectedCouncil === 'all' 
                ? 'View attendance across all councils' 
                : `View attendance for ${selectedCouncil}`}
              {!canEdit && (
                <span className="text-yellow-600 block mt-1">
                  (View only - editing is only available on the respective day)
                </span>
              )}
            </motion.div>
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 16rem)" }}>
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
