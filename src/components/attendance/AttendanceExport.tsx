
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ParticipantWithAttendance } from '@/types/attendance';
import { FileSpreadsheet, Download, FileDown } from 'lucide-react';

interface AttendanceExportProps {
  participants: ParticipantWithAttendance[];
  councils: string[];
}

export const AttendanceExport: React.FC<AttendanceExportProps> = ({
  participants,
  councils
}) => {
  const [selectedCouncil, setSelectedCouncil] = React.useState<string>('all');
  
  // Function to export data as CSV
  const exportToCSV = (councilFilter: string) => {
    try {
      // Filter participants by council if needed
      const filteredParticipants = councilFilter === 'all'
        ? participants
        : participants.filter(p => p.council === councilFilter);
      
      if (filteredParticipants.length === 0) {
        toast.error('No participants to export');
        return;
      }
      
      // Create CSV header
      const headers = [
        'Name',
        'Council',
        'Role',
        'Day 1 Attendance',
        'Day 2 Attendance'
      ];
      
      // Create CSV rows
      const rows = filteredParticipants.map(p => [
        p.name,
        p.council,
        p.role,
        p.attendance.day1,
        p.attendance.day2
      ]);
      
      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set download attributes
      const date = new Date().toISOString().split('T')[0];
      const councilName = councilFilter === 'all' ? 'All_Councils' : councilFilter.replace(/\s+/g, '_');
      link.setAttribute('href', url);
      link.setAttribute('download', `MUN_Attendance_${councilName}_${date}.csv`);
      
      // Add to DOM, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported attendance data for ${councilFilter === 'all' ? 'all councils' : councilFilter}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };
  
  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-primary" />
          Export Attendance Data
        </CardTitle>
        <CardDescription>
          Download attendance records for specific councils or all participants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Select Council</label>
            <Select
              value={selectedCouncil}
              onValueChange={setSelectedCouncil}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select council" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Councils</SelectItem>
                {councils.map(council => (
                  <SelectItem key={council} value={council}>{council}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportToCSV(selectedCouncil)}
              className="flex items-center gap-2"
            >
              <FileDown size={16} />
              Export CSV
            </Button>
            
            <Button
              onClick={() => exportToCSV(selectedCouncil)}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Export Selected
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
