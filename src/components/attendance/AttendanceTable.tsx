import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { CheckCircle, Filter, Lock, Search, UserX } from 'lucide-react';

interface AttendanceTableProps {
  participants: ParticipantWithAttendance[];
  selectedDate: 'day1' | 'day2';
  isDateLocked: boolean;
  showCouncil?: boolean;
  onMarkAttendance: (participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => void;
  onBatchMarkAttendance: (participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => void;
  readOnly?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  participants,
  selectedDate,
  isDateLocked,
  showCouncil = false,
  onMarkAttendance,
  onBatchMarkAttendance,
  readOnly = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [councilFilter, setCouncilFilter] = useState('all');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Get unique council list from participants
  const councils = [...new Set(participants.map(p => p.council))].sort();
  
  // Apply filters
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || participant.attendance[selectedDate] === statusFilter;
    
    const matchesCouncil = councilFilter === 'all' || participant.council === councilFilter;
    
    return matchesSearch && matchesStatus && matchesCouncil;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedParticipants(filteredParticipants.map(p => p.id));
    } else {
      setSelectedParticipants([]);
    }
  };

  const handleSelectParticipant = (participantId: string, checked: boolean) => {
    if (checked) {
      setSelectedParticipants(prev => [...prev, participantId]);
    } else {
      setSelectedParticipants(prev => prev.filter(id => id !== participantId));
    }
  };

  const handleBatchMarkAttendance = (status: AttendanceStatus) => {
    if (selectedParticipants.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }
    
    onBatchMarkAttendance(selectedParticipants, selectedDate, status);
    toast.success(`Marked ${selectedParticipants.length} participants as ${status}`);
  };

  // Get attendance status color and icon
  const getStatusDisplay = (status: AttendanceStatus) => {
    switch(status) {
      case 'present':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> };
      case 'absent':
        return { color: 'bg-red-100 text-red-800', icon: <UserX className="h-4 w-4" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: null };
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {showCouncil && (
              <Select
                value={councilFilter}
                onValueChange={setCouncilFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Council" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Councils</SelectItem>
                  {councils.map(council => (
                    <SelectItem key={council} value={council}>{council}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as any)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="not-marked">Not Marked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {selectedParticipants.length > 0 && !isDateLocked && !readOnly && (
        <div className="flex items-center gap-2 py-2 px-4 bg-muted/50 rounded-md">
          <span className="text-sm">{selectedParticipants.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchMarkAttendance('present')}
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
            >
              Mark Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchMarkAttendance('absent')}
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
            >
              Mark Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBatchMarkAttendance('not-marked')}
              className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-800"
            >
              Clear Status
            </Button>
          </div>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {!readOnly && (
                <TableHead className="w-[50px]">
                  <Checkbox 
                    onCheckedChange={(checked) => handleSelectAll(!!checked)} 
                    checked={
                      selectedParticipants.length > 0 &&
                      selectedParticipants.length === filteredParticipants.length
                    }
                    disabled={isDateLocked || readOnly}
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              {showCouncil && <TableHead>Council</TableHead>}
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={showCouncil ? (readOnly ? 4 : 5) : (readOnly ? 3 : 4)} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No participants found
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant) => {
                const status = participant.attendance[selectedDate];
                const statusDisplay = getStatusDisplay(status);
                
                return (
                  <TableRow key={participant.id}>
                    {!readOnly && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedParticipants.includes(participant.id)}
                          onCheckedChange={(checked) => handleSelectParticipant(participant.id, !!checked)}
                          disabled={isDateLocked || readOnly}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{participant.name}</TableCell>
                    {showCouncil && <TableCell>{participant.council}</TableCell>}
                    <TableCell className="capitalize">{participant.role}</TableCell>
                    <TableCell>
                      {isDateLocked || readOnly ? (
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.icon && <span className="mr-1">{statusDisplay.icon}</span>}
                          <span className="capitalize">{status === 'not-marked' ? 'Not Marked' : status}</span>
                          {isDateLocked && <Lock className="ml-1 h-3 w-3 opacity-70" />}
                        </div>
                      ) : (
                        <Select
                          value={status}
                          onValueChange={(value) => onMarkAttendance(participant.id, selectedDate, value as AttendanceStatus)}
                        >
                          <SelectTrigger className={`w-[120px] h-8 ${statusDisplay.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="not-marked">Not Marked</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Showing {filteredParticipants.length} of {participants.length} participants
      </div>
    </div>
  );
};
