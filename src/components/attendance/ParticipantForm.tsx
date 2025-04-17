
import React, { useState } from 'react';
import { Participant, ParticipantWithAttendance } from '@/types/attendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Loader2, UserPlus } from 'lucide-react';

interface ParticipantFormProps {
  onSubmit: (participant: Omit<ParticipantWithAttendance, 'id'>) => void;
  councils: string[];
}

export const ParticipantForm: React.FC<ParticipantFormProps> = ({ onSubmit, councils }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Participant>>({
    name: '',
    role: 'delegate',
    council: user?.council || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | { name: string; value: string }) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.name || !formData.council || !formData.role) {
        toast.error('Please fill out all required fields');
        return;
      }

      // Create a new participant with default attendance status
      const newParticipant = {
        ...formData,
        attendance: {
          day1: 'not-marked' as const,
          day2: 'not-marked' as const
        }
      } as Omit<ParticipantWithAttendance, 'id'>;

      await onSubmit(newParticipant);
      
      // Reset form
      setFormData({
        name: '',
        role: 'delegate',
        council: user?.council || '',
      });
      
      toast.success('Participant added successfully');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <UserPlus size={18} className="text-primary" />
          Add New Participant
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="Enter participant's full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="council">Council <span className="text-red-500">*</span></Label>
              {user?.role === 'chair' && user.council ? (
                <Input
                  id="council"
                  name="council"
                  value={user.council}
                  readOnly
                  className="bg-muted"
                />
              ) : (
                <Select
                  value={formData.council}
                  onValueChange={(value) => handleSelectChange('council', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select council" />
                  </SelectTrigger>
                  <SelectContent>
                    {councils.map((council) => (
                      <SelectItem key={council} value={council}>
                        {council}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange('role', value as any)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delegate">Delegate</SelectItem>
                  <SelectItem value="chair">Chair</SelectItem>
                  <SelectItem value="observer">Observer</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Add Participant
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
