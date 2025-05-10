
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParticipantWithAttendance } from '@/types/attendance';
import { CheckCircle, UserX, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    },
    hover: {
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      y: -5,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card className="h-full border-none bg-white/95 backdrop-blur-sm shadow-md">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg font-medium">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Total Participants</div>
                <motion.div 
                  className="font-medium"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                >
                  {total}
                </motion.div>
              </div>
              
              <div className="space-y-2">
                <motion.div 
                  className="flex justify-between items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Present</span>
                  </div>
                  <div className="text-sm font-medium">
                    {presentCount} <span className="text-muted-foreground">({presentPercentage}%)</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex justify-between items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Absent</span>
                  </div>
                  <div className="text-sm font-medium">
                    {absentCount} <span className="text-muted-foreground">({absentPercentage}%)</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex justify-between items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Not Marked</span>
                  </div>
                  <div className="text-sm font-medium">
                    {notMarkedCount} <span className="text-muted-foreground">({notMarkedPercentage}%)</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div 
        className="lg:col-span-2"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        transition={{ delay: 0.1 }}
      >
        <Card className="h-full border-none bg-white/95 backdrop-blur-sm shadow-md">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
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
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - notMarkedPercentage}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {notMarkedCount} participants still need to be marked
                </p>
              </div>
              
              <div className="pt-4">
                <div className="text-sm font-medium mb-2">Attendance Breakdown</div>
                <div className="h-4 w-full flex rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${presentPercentage}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${presentPercentage}%` }}
                    transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                    title={`Present: ${presentCount} (${presentPercentage}%)`}
                  />
                  <motion.div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${absentPercentage}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${absentPercentage}%` }}
                    transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
                    title={`Absent: ${absentCount} (${absentPercentage}%)`}
                  />
                  <motion.div 
                    className="bg-gray-300 h-full" 
                    style={{ width: `${notMarkedPercentage}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${notMarkedPercentage}%` }}
                    transition={{ delay: 1.1, duration: 1, ease: "easeOut" }}
                    title={`Not Marked: ${notMarkedCount} (${notMarkedPercentage}%)`}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Present</span>
                  <span></span>
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {!council && showCouncilsOverview && countByCouncil.length > 0 && (
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full border-none bg-white/95 backdrop-blur-sm shadow-md">
            <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-lg font-medium">Councils Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {countByCouncil.map(([council, count], index) => (
                  <motion.div 
                    key={council} 
                    className="space-y-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">{council}</div>
                      <div className="text-sm text-muted-foreground">{count} participants</div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary/70" 
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / total) * 100}%` }}
                        transition={{ delay: 0.8 + (index * 0.1), duration: 0.7 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
