
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { TimeInput } from '@/components/ui/TimeInput';
import { Play, Pause, RefreshCw, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface QuickTimerWidgetProps {
  className?: string;
}

export const QuickTimerWidget: React.FC<QuickTimerWidgetProps> = ({ className = '' }) => {
  const [time, setTime] = useState<number>(120); // 2 minutes in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [inputMinutes, setInputMinutes] = useState<string>("2");
  const [inputSeconds, setInputSeconds] = useState<string>("0");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-simple-countdown-922.mp3');
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
    const minutes = parseInt(inputMinutes) || 0;
    const seconds = parseInt(inputSeconds) || 0;
    setTime(minutes * 60 + seconds);
  };
  
  // Handle time update from the TimeInput component
  const handleTimeChange = (minutes: number, seconds: number) => {
    setInputMinutes(minutes.toString());
    setInputSeconds(seconds.toString());
    setTime(minutes * 60 + seconds);
    setIsEditing(false);
  };
  
  // Format time for display
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const initialTime = parseInt(inputMinutes) * 60 + parseInt(inputSeconds) || 120;
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
        <div className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-shadow hover:shadow-md relative">
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-accent transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={16} />
          </button>

          <div 
            className="flex justify-center mb-4 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <div className={`text-5xl font-mono font-semibold ${getTimerColor()} transition-colors duration-300`}>
              {formatTime(time)}
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="w-full h-3 mb-6 rounded-full bg-gray-200 dark:bg-gray-700" 
          />
          
          <div className="flex justify-center gap-3">
            <Button
              onClick={toggleTimer}
              variant={isRunning ? "secondary" : "default"}
              className={`${!isRunning ? "bg-accent hover:bg-accent/90" : ""} px-6 py-2 h-10 w-28`}
            >
              {isRunning ? (
                <>
                  <Pause size={18} className="mr-1" /> Pause
                </>
              ) : (
                <>
                  <Play size={18} className="mr-1" /> Start
                </>
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              className="px-6 py-2 h-10 w-28"
            >
              <RefreshCw size={18} className="mr-1" /> Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
