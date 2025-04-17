
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParticipantWithAttendance } from '@/types/attendance';
import { CheckCircle, UserX, HelpCircle } from 'lucide-react';

interface AttendanceSummaryProps {
  participants: ParticipantWithAttendance[];
  selectedDate: 'day1' | 'day2';
  council?: string; // Optional council filter
  showCouncilsOverview?: boolean; // New prop to control councils overview visibility
}

export const AttendanceSummary: React.FC<AttendanceSummaryProps> = ({
  participants,
  selectedDate,
  council,
  showCouncilsOverview = true // Default to showing it
}) => {
  // Filter by council if provided
  const filteredParticipants = council
    ? participants.filter(p => p.council === council)
    : participants;
  
  // Calculate statistics
  const total = filteredParticipants.length;
  const presentCount = filteredParticipants.filter(p => p.attendance[selectedDate] === 'present').length;
  const absentCount = filteredParticipants.filter(p => p.attendance[selectedDate] === 'absent').length;
  const notMarkedCount = filteredParticipants.filter(p => p.attendance[selectedDate] === 'not-marked').length;
  
  // Calculate percentages
  const presentPercentage = total ? Math.round((presentCount / total) * 100) : 0;
  const absentPercentage = total ? Math.round((absentCount / total) * 100) : 0;
  const notMarkedPercentage = total ? Math.round((notMarkedCount / total) * 100) : 0;
  
  // Count by council
  const countByCouncil = React.useMemo(() => {
    if (!council && showCouncilsOverview) {
      const counts: Record<string, number> = {};
      participants.forEach(p => {
        counts[p.council] = (counts[p.council] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]) // Sort by count, descending
        .slice(0, 5); // Top 5 councils
    }
    return [];
  }, [participants, council, showCouncilsOverview]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">Total Participants</div>
              <div className="font-medium">{total}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Present</span>
                </div>
                <div className="text-sm font-medium">
                  {presentCount} <span className="text-muted-foreground">({presentPercentage}%)</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Absent</span>
                </div>
                <div className="text-sm font-medium">
                  {absentCount} <span className="text-muted-foreground">({absentPercentage}%)</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Not Marked</span>
                </div>
                <div className="text-sm font-medium">
                  {notMarkedCount} <span className="text-muted-foreground">({notMarkedPercentage}%)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Attendance Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{100 - notMarkedPercentage}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${100 - notMarkedPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {notMarkedCount} participants still need to be marked
              </p>
            </div>
            
            <div className="pt-4">
              <div className="text-sm font-medium mb-2">Attendance Breakdown</div>
              <div className="h-4 w-full flex rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${presentPercentage}%` }}
                  title={`Present: ${presentCount} (${presentPercentage}%)`}
                />
                <div 
                  className="bg-red-500 h-full" 
                  style={{ width: `${absentPercentage}%` }}
                  title={`Absent: ${absentCount} (${absentPercentage}%)`}
                />
                <div 
                  className="bg-gray-300 h-full" 
                  style={{ width: `${notMarkedPercentage}%` }}
                  title={`Not Marked: ${notMarkedCount} (${notMarkedPercentage}%)`}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Present</span>
                <span>Absent</span>
                <span>Not Marked</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!council && showCouncilsOverview && countByCouncil.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Councils Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {countByCouncil.map(([council, count]) => (
                <div key={council} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">{council}</div>
                    <div className="text-sm text-muted-foreground">{count} participants</div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/70" 
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
