
import React, { useState } from 'react';
import { ParticipantForm } from '@/components/attendance/ParticipantForm';
import { CSVImport } from '@/components/attendance/CSVImport';
import { ParticipantWithAttendance } from '@/types/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useParticipants } from '@/hooks/useParticipants';

interface AttendanceManageTabProps {
  addParticipant: (participant: Omit<ParticipantWithAttendance, 'id'>) => Promise<string>;
  addMultipleParticipants: (participants: Omit<ParticipantWithAttendance, 'id'>[]) => Promise<string[]>;
  councils: string[];
  participants: ParticipantWithAttendance[];
  deleteParticipant: (id: string) => Promise<void>;
}

export const AttendanceManageTab: React.FC<AttendanceManageTabProps> = ({
  addParticipant,
  addMultipleParticipants,
  councils,
  participants,
  deleteParticipant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { deleteParticipant: hookDeleteParticipant } = useParticipants();

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.council.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteParticipant = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await hookDeleteParticipant(id);
        toast.success(`${name} has been deleted successfully`);
      } catch (error) {
        toast.error('Failed to delete participant');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParticipantForm 
          onSubmit={addParticipant} 
          councils={councils} 
        />
        
        <CSVImport 
          onImport={addMultipleParticipants}
        />
      </div>

      {/* Delete Participants Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Delete Participants
          </CardTitle>
          <CardDescription>
            Search and remove participants from the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search participants by name or council..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchTerm && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No participants found matching your search
                </p>
              ) : (
                filteredParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{participant.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {participant.council}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {participant.role}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteParticipant(participant.id, participant.name)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {!searchTerm && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Start typing to search for participants to delete
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
