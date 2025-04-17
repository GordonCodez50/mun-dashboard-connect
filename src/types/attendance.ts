
export type AttendanceStatus = 'present' | 'absent' | 'not-marked';

export interface Participant {
  id: string;
  name: string;
  council: string;
  role: 'delegate' | 'chair' | 'observer' | 'staff' | 'guest';
  // Removed email, country and notes fields as requested
}

export interface ParticipantWithAttendance extends Participant {
  attendance: {
    day1: AttendanceStatus;
    day2: AttendanceStatus;
  };
}

export interface Council {
  id: string;
  name: string;
  chairId?: string;
  chairName?: string;
}

export interface AttendanceFilter {
  council: string;
  date: 'day1' | 'day2' | 'all';
  status: AttendanceStatus | 'all';
}
