
import React, { useState } from 'react';
import { Participant, ParticipantWithAttendance } from '@/types/attendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

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
    country: '',
    email: '',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string; value: string }) => {
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

      onSubmit(newParticipant);
      
      // Reset form
      setFormData({
        name: '',
        role: 'delegate',
        council: user?.council || '',
        country: '',
        email: '',
        notes: ''
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
        <CardTitle className="text-lg font-medium">Add New Participant</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                placeholder="Full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="Email address"
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
            
            <div className="space-y-2">
              <Label htmlFor="country">Country/Delegation</Label>
              <Input
                id="country"
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                placeholder="Country or delegation"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Additional information"
              rows={3}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Participant'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
