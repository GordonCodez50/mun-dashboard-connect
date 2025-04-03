
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TimeInput } from '@/components/ui/TimeInput';
import { Play, Pause, RefreshCw, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTimers } from '@/context/TimerContext';

interface QuickTimerWidgetProps {
  className?: string;
}

export const QuickTimerWidget: React.FC<QuickTimerWidgetProps> = ({ className = '' }) => {
  const isMobile = useIsMobile();
  const { timers, handleStartPause, handleReset, handleTimeChange } = useTimers();
  
  // Use the main timer from context
  const mainTimer = timers.find(t => t.id === 'main-timer') || timers[0];
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Format time for display
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = Math.max(0, (mainTimer.duration / mainTimer.initialDuration) * 100);
  
  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (mainTimer.duration <= 10) return "text-red-500";
    if (mainTimer.duration <= 30) return "text-amber-500";
    return "text-primary dark:text-white";
  };

  // Handle time update from the TimeInput component
  const handleQuickTimeChange = (minutes: number, seconds: number) => {
    handleTimeChange(minutes, seconds, mainTimer.id);
    setIsEditing(false);
  };
  
  return (
    <div className={`w-full ${className}`}>
      {isEditing ? (
        <div className="py-2 max-w-[220px] mx-auto animate-fade-in">
          <TimeInput 
            minutes={Math.floor(mainTimer.duration / 60)}
            seconds={mainTimer.duration % 60}
            onTimeChange={handleQuickTimeChange}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="w-full p-6 md:p-8 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative card-hover">
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
              {formatTime(mainTimer.duration)}
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="w-full h-4 md:h-5 mb-6 rounded-full bg-gray-200 dark:bg-gray-700" 
          />
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleStartPause(mainTimer.id)}
              variant={mainTimer.isRunning && !mainTimer.isPaused ? "secondary" : "default"}
              size={isMobile ? "default" : "lg"}
              className={`${!(mainTimer.isRunning && !mainTimer.isPaused) ? "bg-accent hover:bg-accent/90" : ""} px-6 py-2 h-auto w-32 md:w-40 font-medium ${mainTimer.isRunning && !mainTimer.isPaused ? "" : "btn-pulse"}`}
            >
              {mainTimer.isRunning && !mainTimer.isPaused ? (
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
              onClick={() => handleReset(mainTimer.id)}
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
