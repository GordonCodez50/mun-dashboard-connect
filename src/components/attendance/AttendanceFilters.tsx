
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListFilter } from 'lucide-react';

interface AttendanceFiltersProps {
  selectedCouncil: string;
  setSelectedCouncil: (value: string) => void;
  selectedDate: 'day1' | 'day2';
  setSelectedDate: (date: 'day1' | 'day2') => void;
  councils: string[];
  isDay1: boolean;
  isDay2: boolean;
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  selectedCouncil,
  setSelectedCouncil,
  selectedDate,
  setSelectedDate,
  councils,
  isDay1,
  isDay2
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <ListFilter size={18} className="text-primary" />
          Attendance Filters
        </CardTitle>
        <CardDescription>
          Filter attendance data by council and date
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Select Council</label>
            <Select
              value={selectedCouncil}
              onValueChange={setSelectedCouncil}
            >
              <SelectTrigger>
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
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <div className="flex gap-2">
              <Button
                variant={selectedDate === 'day1' ? 'default' : 'outline'}
                onClick={() => setSelectedDate('day1')}
                size="sm"
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                Day 1 (16th March)
              </Button>
              <Button
                variant={selectedDate === 'day2' ? 'default' : 'outline'}
                onClick={() => setSelectedDate('day2')}
                size="sm"
                className="flex-1 sm:flex-none whitespace-nowrap"
              >
                Day 2 (17th March)
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
