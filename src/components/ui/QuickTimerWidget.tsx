
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { TimeInput } from '@/components/ui/TimeInput';
import { Play, Pause, RefreshCw, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickTimerWidgetProps {
  className?: string;
}

export const QuickTimerWidget: React.FC<QuickTimerWidgetProps> = ({ className = '' }) => {
  const isMobile = useIsMobile();
  const [time, setTime] = useState<number>(120); // 2 minutes in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [inputMinutes, setInputMinutes] = useState<string>("2");
  const [inputSeconds, setInputSeconds] = useState<string>("0");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [initialTime, setInitialTime] = useState<number>(120);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Timer functionality
  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && isRunning) {
      setIsRunning(false);
      // Play sound when timer finishes
      const audio = new Audio('/notification.mp3');
      audio.play();
      toast.info("Time's up!");
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, time]);
  
  // Handle Start/Pause
  const toggleTimer = () => {
    setIsRunning(prev => !prev);
  };
  
  // Handle Reset
  const handleReset = () => {
    setIsRunning(false);
    // Convert input values to numbers and set time
    setTime(initialTime);
  };
  
  // Handle time update from the TimeInput component
  const handleTimeChange = (minutes: number, seconds: number) => {
    const totalSeconds = minutes * 60 + seconds;
    setInputMinutes(minutes.toString());
    setInputSeconds(seconds.toString());
    setTime(totalSeconds);
    setInitialTime(totalSeconds);
    setIsEditing(false);
  };
  
  // Format time for display
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = Math.max(0, (time / initialTime) * 100);
  
  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (time <= 10) return "text-red-500";
    if (time <= 30) return "text-amber-500";
    return "text-primary dark:text-white";
  };
  
  return (
    <div className={`w-full ${className}`}>
      {isEditing ? (
        <div className="py-2 max-w-[220px] mx-auto">
          <TimeInput 
            minutes={Math.floor(time / 60)}
            seconds={time % 60}
            onTimeChange={handleTimeChange}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="w-full p-6 md:p-8 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative">
          <button 
            className="absolute top-3 right-3 text-gray-400 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-full p-1"
            onClick={() => setIsEditing(true)}
            aria-label="Edit timer"
          >
            <Edit size={18} />
          </button>

          <div 
            className="flex justify-center mb-6 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <div className={`text-6xl md:text-7xl font-mono font-semibold ${getTimerColor()} transition-colors duration-300`}>
              {formatTime(time)}
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="w-full h-4 md:h-5 mb-6 rounded-full bg-gray-200 dark:bg-gray-700" 
          />
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={toggleTimer}
              variant={isRunning ? "secondary" : "default"}
              size={isMobile ? "default" : "lg"}
              className={`${!isRunning ? "bg-accent hover:bg-accent/90" : ""} px-6 py-2 h-auto w-32 md:w-40 font-medium`}
            >
              {isRunning ? (
                <>
                  <Pause size={20} className="mr-2" /> Pause
                </>
              ) : (
                <>
                  <Play size={20} className="mr-2" /> Start
                </>
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className="px-6 py-2 h-auto w-32 md:w-40 font-medium border-2"
            >
              <RefreshCw size={20} className="mr-2" /> Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
