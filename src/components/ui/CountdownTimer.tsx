
import React, { useState, useEffect, useRef, memo } from 'react';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type CountdownTimerProps = {
  initialTime: number; // in seconds
  onComplete?: () => void;
  autoStart?: boolean;
  size?: 'sm' | 'md' | 'lg';
  timerId?: string; // Optional ID for Firebase sync
  isAdmin?: boolean; // Whether this instance can control other timers
  variant?: 'default' | 'minimal';
  className?: string;
};

export const CountdownTimer: React.FC<CountdownTimerProps> = memo(({
  initialTime,
  onComplete,
  autoStart = true,
  size = 'md',
  timerId,
  isAdmin = false,
  variant = 'default',
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressCircleRef = useRef<SVGCircleElement>(null);
  
  // Set up Firebase for timer sync
  const { data: timerSync, sendMessage: sendTimerUpdate } = useFirebaseRealtime<{
    action: 'start' | 'pause' | 'reset';
    timeLeft?: number;
  }>('TIMER_SYNC', timerId);
  
  // Listen for timer sync updates
  useEffect(() => {
    if (timerSync && timerId) {
      switch (timerSync.action) {
        case 'start':
          setIsRunning(true);
          setIsPaused(false);
          if (timerSync.timeLeft !== undefined) {
            setTimeLeft(timerSync.timeLeft);
          }
          break;
        case 'pause':
          setIsPaused(true);
          break;
        case 'reset':
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeLeft(initialTime);
          setIsRunning(false);
          setIsPaused(false);
          break;
      }
    }
  }, [timerSync, timerId, initialTime]);
  
  // Calculate minutes and seconds
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Timer progress percentage
  const progress = (timeLeft / initialTime) * 100;

  // Timer animation class based on time left
  const getTimerClass = () => {
    if (timeLeft <= 10) return "text-destructive transition-colors duration-300";
    if (timeLeft <= 30) return "text-amber-500 transition-colors duration-300";
    return "text-primary dark:text-white transition-colors duration-300";
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return "text-2xl md:text-3xl";
      case 'lg': return "text-5xl md:text-6xl";
      default: return "text-3xl md:text-4xl";
    }
  };
  
  // Start timer
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRunning(false);
            
            // Notify user when timer completes
            toast.info("Timer complete!");
            
            if (onComplete) onComplete();
            
            // Notify via Firebase if this is the admin timer
            if (isAdmin && timerId) {
              sendTimerUpdate({
                action: 'reset',
                timeLeft: 0
              });
            }
            
            return 0;
          }
          
          // If admin timer, periodically sync with other timers
          if (isAdmin && timerId && prev % 5 === 0) { // Sync every 5 seconds
            sendTimerUpdate({
              action: 'start',
              timeLeft: prev - 1
            });
          }
          
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isPaused, onComplete, isAdmin, timerId, sendTimerUpdate]);
  
  // Start/Resume timer
  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
    
    // Notify via Firebase if this is the admin timer
    if (isAdmin && timerId) {
      sendTimerUpdate({
        action: 'start',
        timeLeft
      });
    }
  };
  
  // Pause timer
  const pauseTimer = () => {
    setIsPaused(true);
    
    // Notify via Firebase if this is the admin timer
    if (isAdmin && timerId) {
      sendTimerUpdate({
        action: 'pause'
      });
    }
  };
  
  // Reset timer
  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(initialTime);
    setIsRunning(false);
    setIsPaused(false);
    
    // Notify via Firebase if this is the admin timer
    if (isAdmin && timerId) {
      sendTimerUpdate({
        action: 'reset',
        timeLeft: initialTime
      });
    }
  };

  // Get color based on time left
  const getColor = () => {
    if (timeLeft <= 10) return "destructive";
    if (timeLeft <= 30) return "amber";
    return "accent";
  };
  
  // Calculate circle props for circular progress
  const calculateCircleProps = () => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    
    return { radius, circumference, offset };
  };
  
  const { radius, circumference, offset } = calculateCircleProps();
  
  // Get button animation classes
  const getButtonAnimClass = (type: 'start' | 'reset') => {
    if (isHovered) {
      return type === 'start' 
        ? "animate-scale-in transition-transform duration-200" 
        : "animate-scale-in transition-transform duration-300";
    }
    return "";
  };

  // Render the default variant - circular modern design
  if (variant === 'default') {
    return (
      <div 
        className={cn("flex flex-col items-center", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Timer display with circular progress */}
        <div className="relative w-full max-w-[200px] aspect-square mb-4 group">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
            {/* Background track */}
            <circle 
              cx="60" 
              cy="60" 
              r={radius} 
              fill="none" 
              strokeWidth="8" 
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            
            {/* Progress indicator */}
            <circle 
              ref={progressCircleRef}
              cx="60" 
              cy="60" 
              r={radius} 
              fill="none" 
              strokeWidth="8" 
              className={`
                ${getColor() === "destructive" ? "stroke-destructive" : 
                  getColor() === "amber" ? "stroke-amber-500" : "stroke-accent"}
                transition-all duration-1000 ease-in-out
              `}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Timer icon at the top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md border border-gray-100 dark:border-gray-700">
            <Timer className="w-5 h-5 text-accent animate-pulse-subtle" />
          </div>
          
          {/* Time display in the middle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-mono font-semibold tracking-tighter ${getSizeClasses()} ${getTimerClass()}`}>
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            
            {/* Status text */}
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 opacity-80">
              {isRunning && !isPaused ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Running
                </span>
              ) : isPaused ? (
                "Paused"
              ) : (
                "Ready"
              )}
            </div>
          </div>
          
          {/* Glowing effect when running */}
          {isRunning && !isPaused && (
            <div className={`absolute inset-0 rounded-full ${
              getColor() === "destructive" ? "bg-red-500/5" : 
              getColor() === "amber" ? "bg-amber-500/5" : "bg-accent/5"
            } blur-md animate-pulse opacity-70`}></div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex gap-3 mt-2">
          {!isRunning || isPaused ? (
            <Button 
              onClick={startTimer}
              variant="default"
              className={cn(
                "bg-accent hover:bg-accent/90 gap-1 transition-all duration-300",
                getButtonAnimClass('start')
              )}
              size="sm"
            >
              <Play size={16} className="animate-slide-in" />
              {isPaused ? "Resume" : "Start"}
            </Button>
          ) : (
            <Button 
              onClick={pauseTimer}
              variant="secondary"
              className="gap-1 transition-transform hover:scale-105"
              size="sm"
            >
              <Pause size={16} />
              Pause
            </Button>
          )}
          <Button 
            onClick={resetTimer}
            variant="outline"
            className={cn(
              "gap-1 transition-all duration-300",
              getButtonAnimClass('reset')
            )}
            size="sm"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
            Reset
          </Button>
        </div>
        
        {/* Real-time sync indicator */}
        {timerId && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>Real-time {isAdmin ? "controlling" : "synced"}</span>
            <div className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        )}
      </div>
    );
  }
  
  // Render the minimal variant - sleeker design
  return (
    <div 
      className={cn(className, "transition-all duration-300 hover:translate-y-[-2px]")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Minimal timer display */}
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 p-4">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent rounded-full translate-x-1/2 translate-y-1/2 blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Time display */}
        <div className={`font-mono font-semibold ${getSizeClasses()} ${getTimerClass()} text-center`}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        
        {/* Progress bar - with animated gradient for running state */}
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-linear rounded-full",
              isRunning && !isPaused && "animate-rainbow bg-gradient-to-r",
              getColor() === "destructive" ? "from-red-500 to-red-400" : 
              getColor() === "amber" ? "from-amber-500 to-yellow-400" : "from-accent to-sky-400",
              !isRunning && getColor() === "destructive" && "bg-destructive",
              !isRunning && getColor() === "amber" && "bg-amber-500",
              !isRunning && getColor() === "accent" && "bg-accent"
            )}
            style={{ width: `${progress}%`, backgroundSize: '200% 200%' }}
          />
        </div>
      </div>
      
      {/* Controls - floating at the bottom for minimal variant */}
      <div className="flex justify-center gap-2 mt-4">
        {!isRunning || isPaused ? (
          <Button 
            onClick={startTimer} 
            variant="default"
            className={cn(
              "bg-accent hover:bg-accent/90 h-9 w-9 p-0 rounded-full transition-transform hover:scale-110",
              isHovered && "animate-scale-in"
            )}
            size="icon"
          >
            <Play size={18} />
          </Button>
        ) : (
          <Button 
            onClick={pauseTimer} 
            variant="secondary"
            className="h-9 w-9 p-0 rounded-full transition-transform hover:scale-110"
            size="icon"
          >
            <Pause size={18} />
          </Button>
        )}
        <Button 
          onClick={resetTimer} 
          variant="outline"
          className={cn(
            "h-9 w-9 p-0 rounded-full transition-transform hover:scale-110", 
            isHovered && "animate-scale-in animation-delay-200"
          )}
          size="icon"
        >
          <RefreshCw size={18} className="transition-transform duration-500 hover:rotate-180" />
        </Button>
      </div>
    </div>
  );
});

CountdownTimer.displayName = "CountdownTimer";
