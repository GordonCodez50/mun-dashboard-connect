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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ParticipantWithAttendance, AttendanceStatus } from '@/types/attendance';
import { CheckCircle, Filter, Lock, Search, UserX, User, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExtendedParticipant extends ParticipantWithAttendance {
  day1_marked_by?: string;
  day1_marked_by_user?: string;
  day1_marked_at?: string;
  day2_marked_by?: string;
  day2_marked_by_user?: string;
  day2_marked_at?: string;
}

interface AdminAttendanceTableProps {
  participants: ExtendedParticipant[];
  selectedDate: 'day1' | 'day2';
  isDateLocked: boolean;
  showCouncil?: boolean;
  onMarkAttendance: (participantId: string, date: 'day1' | 'day2', status: AttendanceStatus) => void;
  onBatchMarkAttendance: (participantIds: string[], date: 'day1' | 'day2', status: AttendanceStatus) => void;
  readOnly?: boolean;
}

export const AdminAttendanceTable: React.FC<AdminAttendanceTableProps> = ({
  participants,
  selectedDate,
  isDateLocked,
  showCouncil = true, // Default to true for admin view
  onMarkAttendance,
  onBatchMarkAttendance,
  readOnly = false
}) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [councilFilter, setCouncilFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // Get unique council and source lists from participants
  const councils = [...new Set(participants.map(p => p.council))].sort();
  const sources = [...new Set(participants
    .map(p => selectedDate === 'day1' ? p.day1_marked_by : p.day2_marked_by)
    .filter(Boolean)
  )].sort();
  
  // Apply filters
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || participant.attendance[selectedDate] === statusFilter;
    
    const matchesCouncil = councilFilter === 'all' || participant.council === councilFilter;
    
    const markedBy = selectedDate === 'day1' ? participant.day1_marked_by : participant.day2_marked_by;
    const matchesSource = sourceFilter === 'all' || markedBy === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesCouncil && matchesSource;
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

  // Get source badge
  const getSourceBadge = (participant: ExtendedParticipant) => {
    const markedBy = selectedDate === 'day1' ? participant.day1_marked_by : participant.day2_marked_by;
    const markedByUser = selectedDate === 'day1' ? participant.day1_marked_by_user : participant.day2_marked_by_user;
    
    if (!markedBy) return null;
    
    return (
      <Badge 
        variant={markedBy === 'Press' ? 'secondary' : 'outline'} 
        className="text-xs flex items-center gap-1"
        title={markedByUser ? `Marked by ${markedByUser}` : undefined}
      >
        {markedBy === 'Press' ? (
          <FileText className="h-3 w-3" />
        ) : (
          <User className="h-3 w-3" />
        )}
        {markedBy}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 lg:grid-cols-5 gap-4'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="not-marked">Not Marked</SelectItem>
          </SelectContent>
        </Select>

        <Select value={councilFilter} onValueChange={setCouncilFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by council" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Councils</SelectItem>
            {councils.map(council => (
              <SelectItem key={council} value={council}>{council}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!readOnly && !isDateLocked && (
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2`}>
            <Button
              size="sm"
              onClick={() => handleBatchMarkAttendance('present')}
              disabled={selectedParticipants.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Mark Present
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBatchMarkAttendance('absent')}
              disabled={selectedParticipants.length === 0}
            >
              Mark Absent
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {!readOnly && (
                <TableHead className={isMobile ? 'w-8' : 'w-12'}>
                  <Checkbox 
                    checked={selectedParticipants.length === filteredParticipants.length && filteredParticipants.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={isDateLocked || readOnly}
                    className={isMobile ? 'h-3 w-3' : ''}
                  />
                </TableHead>
              )}
              <TableHead className={isMobile ? 'text-xs' : ''}>Name</TableHead>
              {showCouncil && <TableHead className={isMobile ? 'text-xs' : ''}>Council</TableHead>}
              <TableHead className={isMobile ? 'text-xs' : ''}>Role</TableHead>
              <TableHead className={isMobile ? 'text-xs' : ''}>Delegations</TableHead>
              <TableHead className={isMobile ? 'text-xs' : ''}>Status</TableHead>
              <TableHead className={isMobile ? 'text-xs' : ''}>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={showCouncil ? (readOnly ? 6 : 7) : (readOnly ? 5 : 6)} 
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
                          className={isMobile ? 'h-3 w-3' : ''}
                        />
                      </TableCell>
                    )}
                    <TableCell className={`font-medium ${isMobile ? 'text-xs' : ''}`}>{participant.name}</TableCell>
                    {showCouncil && <TableCell className={isMobile ? 'text-xs' : ''}>{participant.council}</TableCell>}
                    <TableCell className={`capitalize ${isMobile ? 'text-xs' : ''}`}>{participant.role}</TableCell>
                    <TableCell className={isMobile ? 'text-xs' : ''}>{participant.delegations || '-'}</TableCell>
                    <TableCell>
                      {isDateLocked || readOnly ? (
                        <div className={`inline-flex items-center ${isMobile ? 'px-1.5 py-0.5' : 'px-2.5 py-0.5'} rounded-full text-${isMobile ? '2xs' : 'xs'} font-medium ${statusDisplay.color}`}>
                          {statusDisplay.icon && <span className={`${isMobile ? 'mr-0.5' : 'mr-1'}`}>{statusDisplay.icon}</span>}
                          <span className="capitalize">{status === 'not-marked' ? 'Not Marked' : status}</span>
                          {isDateLocked && <Lock className={`ml-1 h-${isMobile ? '2' : '3'} w-${isMobile ? '2' : '3'} opacity-70`} />}
                        </div>
                      ) : (
                        <Select
                          value={status}
                          onValueChange={(value) => onMarkAttendance(participant.id, selectedDate, value as AttendanceStatus)}
                        >
                          <SelectTrigger className={`${isMobile ? 'w-[100px] h-7 text-xs' : 'w-[120px] h-8'} ${statusDisplay.color}`}>
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
                    <TableCell>
                      {getSourceBadge(participant)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
        Showing {filteredParticipants.length} of {participants.length} participants
      </div>
    </div>
  );
};