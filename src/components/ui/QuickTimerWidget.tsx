
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TimeInput } from '@/components/ui/TimeInput';
import { Play, Pause, RefreshCw, Edit, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTimers } from '@/context/TimerContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  
  // Calculate remaining percentage for color determination
  const remainingPercentage = (mainTimer.duration / mainTimer.initialDuration) * 100;
  
  // Determine timer color based on percentage of time remaining
  const getTimerColor = () => {
    if (remainingPercentage <= 20) return "text-red-500"; // Red when less than 20% remains
    if (remainingPercentage <= 40) return "text-amber-500"; // Amber when 20-40% remains
    if (remainingPercentage <= 60) return "text-yellow-500"; // Yellow when 40-60% remains
    if (remainingPercentage <= 80) return "text-green-500"; // Green when 60-80% remains
    return "text-primary dark:text-white"; // Default color when 80-100% remains
  };

  // Determine progress indicator color based on percentage of time left
  const getProgressColor = () => {
    if (remainingPercentage <= 20) return "bg-gradient-to-r from-red-500 to-rose-400";
    if (remainingPercentage <= 40) return "bg-gradient-to-r from-amber-500 to-yellow-400";
    if (remainingPercentage <= 60) return "bg-gradient-to-r from-yellow-500 to-yellow-300";
    if (remainingPercentage <= 80) return "bg-gradient-to-r from-green-500 to-emerald-400";
    return "bg-gradient-to-r from-accent to-sky-400";
  };

  // Determine if timer should have warning animation
  const getTimerAnimation = () => {
    if (remainingPercentage <= 20 && mainTimer.isRunning && !mainTimer.isPaused) return "time-warning";
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
        <div className="py-2 max-w-[220px] mx-auto animate-scale-in">
          <TimeInput 
            minutes={Math.floor(mainTimer.duration / 60)}
            seconds={mainTimer.duration % 60}
            onTimeChange={handleQuickTimeChange}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div 
          className="w-full p-6 md:p-8 border border-gray-100 dark:border-gray-700 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          {/* Animated background decorative elements */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-gradient-1"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent rounded-full translate-x-1/2 translate-y-1/2 blur-3xl animate-gradient-2"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl animate-gradient-3 animation-delay-2000"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl animate-gradient-4 animation-delay-2000"></div>
          </div>
          
          <button 
            className="absolute top-3 right-3 text-gray-400 hover:text-accent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsEditing(true)}
            aria-label="Edit timer"
          >
            <Edit size={18} />
          </button>

          {/* Timer icon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 opacity-5">
            <Timer size={180} strokeWidth={1} className="text-accent" />
          </div>

          <div 
            className={`flex justify-center mb-6 cursor-pointer ${getTimerAnimation()}`}
            onClick={() => setIsEditing(true)}
          >
            <div className={`text-6xl md:text-7xl font-mono font-bold timer-display ${getTimerColor()}`}>
              {formatTime(mainTimer.duration)}
            </div>
          </div>
          
          {/* Enhanced timer progress */}
          <div className="mb-8">
            <Progress 
              value={progress} 
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
              indicatorColor={getProgressColor()}
            />
            
            {/* Time markers */}
            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>0:00</span>
              <span>{formatTime(mainTimer.initialDuration)}</span>
            </div>
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
              className="px-6 py-2 h-12 w-36 md:w-40 font-medium border-2 timer-button relative overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-y-full bg-gray-100 dark:bg-gray-700 group-hover:translate-y-0 opacity-10"></div>
              <RefreshCw size={20} className="mr-2 group-hover:rotate-180 transition-transform duration-500" /> Reset
            </Button>
          </div>
          
          {/* Show pulsing indicator when timer is running */}
          {mainTimer.isRunning && !mainTimer.isPaused && (
            <div className="mt-4 flex items-center justify-center animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-accent/80 animate-pulse mr-2"></div>
              <span className="text-xs text-gray-500">Running</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
