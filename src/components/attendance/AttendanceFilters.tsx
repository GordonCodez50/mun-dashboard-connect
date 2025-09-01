
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListFilter } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
    >
      <Card className="overflow-hidden border-none shadow-md bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <motion.div
              animate={{ rotate: [0, 15, 0, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <ListFilter size={18} className="text-primary" />
            </motion.div>
            <span>Attendance Filters</span>
          </CardTitle>
          <CardDescription>
            Filter attendance data by council and date
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Select Council</label>
              <Select
                value={selectedCouncil}
                onValueChange={setSelectedCouncil}
              >
                <SelectTrigger className="bg-white shadow-sm hover:shadow transition-all">
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
                <motion.div whileHover={{ y: -2 }} whileTap={{ y: 1 }}>
                  <Button
                    variant={selectedDate === 'day1' ? 'default' : 'outline'}
                    onClick={() => setSelectedDate('day1')}
                    size="sm"
                    className={`flex-1 sm:flex-none whitespace-nowrap ${selectedDate === 'day1' ? 'shadow-md' : 'bg-white shadow-sm hover:shadow'}`}
                  >
                    Day 1 (16th March)
                  </Button>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ y: 1 }}>
                  <Button
                    variant={selectedDate === 'day2' ? 'default' : 'outline'}
                    onClick={() => setSelectedDate('day2')}
                    size="sm"
                    className={`flex-1 sm:flex-none whitespace-nowrap ${selectedDate === 'day2' ? 'shadow-md' : 'bg-white shadow-sm hover:shadow'}`}
                  >
                    Day 2 (17th March)
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
