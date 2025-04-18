import React from 'react';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { AttendanceTable } from './AttendanceTable';

interface AttendanceViewTabProps {
  filteredParticipants: ParticipantWithAttendance[];
  selectedDate: 'day1' | 'day2';
  selectedCouncil: string;
  markAttendance: (participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => void;
  batchMarkAttendance: (participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => void;
  deleteParticipant: (participantId: string) => void;
}

export const AttendanceViewTab: React.FC<AttendanceViewTabProps> = ({
  filteredParticipants,
  selectedDate,
  selectedCouncil,
  markAttendance,
  batchMarkAttendance,
  deleteParticipant
}) => {
  return (
    <AttendanceTable
      participants={filteredParticipants}
      selectedDate={selectedDate}
      showCouncil={true}
      isDateLocked={false}
      onMarkAttendance={markAttendance}
      onBatchMarkAttendance={batchMarkAttendance}
      onDeleteParticipant={deleteParticipant}
    />
  );
};
