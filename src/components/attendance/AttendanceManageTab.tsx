
import React from 'react';
import { ParticipantForm } from '@/components/attendance/ParticipantForm';
import { CSVImport } from '@/components/attendance/CSVImport';
import { ParticipantWithAttendance } from '@/types/attendance';

interface AttendanceManageTabProps {
  addParticipant: (participant: Omit<ParticipantWithAttendance, 'id'>) => Promise<string>;
  addMultipleParticipants: (participants: Omit<ParticipantWithAttendance, 'id'>[]) => Promise<string[]>;
  councils: string[];
}

export const AttendanceManageTab: React.FC<AttendanceManageTabProps> = ({
  addParticipant,
  addMultipleParticipants,
  councils
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ParticipantForm 
        onSubmit={addParticipant} 
        councils={councils} 
      />
      
      <CSVImport 
        onImport={addMultipleParticipants}
      />
    </div>
  );
};
