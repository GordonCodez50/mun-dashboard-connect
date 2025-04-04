
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TimeInput } from '@/components/ui/TimeInput';
import { Play, Pause, RefreshCw, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTimers } from '@/context/TimerContext';
import { toast } from 'sonner';

interface QuickTimerWidgetProps {
  className?: string;
}

export const QuickTimerWidget: React.FC<QuickTimerWidgetProps> = ({ className = '' }) => {
  const isMobile = useIsMobile();
  const { soundEnabled, timers, handleStartPause, handleReset, handleTimeChange } = useTimers();
  
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

  // Determine if timer should have warning animation
  const getTimerAnimation = () => {
    if (mainTimer.duration <= 10 && mainTimer.isRunning && !mainTimer.isPaused) return "time-warning";
    return "";
  };

  // Handle time update from the TimeInput component
  const handleQuickTimeChange = (minutes: number, seconds: number) => {
    handleTimeChange(minutes, seconds, mainTimer.id);
    setIsEditing(false);
    
    // Show feedback to user
    toast.success(`Timer set to ${minutes}:${seconds.toString().padStart(2, '0')}`);
  };
  
  // Add effect to notify when timer reaches 0
  useEffect(() => {
    if (mainTimer.duration === 0 && mainTimer.isRunning) {
      toast.info("Time's up!", {
        description: "The timer has reached zero."
      });
    }
  }, [mainTimer.duration, mainTimer.isRunning]);
  
  return (
    <div className={`w-full ${className}`}>
      {isEditing ? (
        <div className="py-2 max-w-[220px] mx-auto">
          <TimeInput 
            minutes={Math.floor(mainTimer.duration / 60)}
            seconds={mainTimer.duration % 60}
            onTimeChange={handleQuickTimeChange}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="w-full p-6 md:p-8 border border-gray-100 dark:border-gray-700 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
          </div>
          
          <button 
            className="absolute top-3 right-3 text-gray-400 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsEditing(true)}
            aria-label="Edit timer"
          >
            <Edit size={18} />
          </button>

          <div 
            className={`flex justify-center mb-6 cursor-pointer ${getTimerAnimation()}`}
            onClick={() => setIsEditing(true)}
          >
            <div className={`text-6xl md:text-7xl font-mono font-bold timer-display ${getTimerColor()}`}>
              {formatTime(mainTimer.duration)}
            </div>
          </div>
          
          <div className="timer-progress-bg mb-8">
            <div 
              className="timer-progress"
              style={{ width: `${progress}%` }} 
            />
          </div>
          
          <div className="flex justify-center gap-5">
            <Button
              onClick={() => handleStartPause(mainTimer.id)}
              variant={mainTimer.isRunning && !mainTimer.isPaused ? "secondary" : "default"}
              size={isMobile ? "default" : "lg"}
              className={`${!(mainTimer.isRunning && !mainTimer.isPaused) ? "bg-accent hover:bg-accent/90" : ""} px-6 py-2 h-12 w-36 md:w-40 font-medium timer-button`}
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
              className="px-6 py-2 h-12 w-36 md:w-40 font-medium border-2 timer-button"
            >
              <RefreshCw size={20} className="mr-2" /> Reset
            </Button>
          </div>
          
          {/* Show pulsing indicator when timer is running */}
          {mainTimer.isRunning && !mainTimer.isPaused && (
            <div className="mt-4 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-accent/80 pulse-animation mr-2"></div>
              <span className="text-xs text-gray-500">Running</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
