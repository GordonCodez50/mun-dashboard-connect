import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { FileText } from 'lucide-react';
import { canEditDate } from '@/utils/participantUtils';

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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <FileText size={18} className="text-primary" />
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
  );
};
