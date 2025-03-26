
import React, { useState, useEffect, useRef } from 'react';
import useFirebaseRealtime from '@/hooks/useFirebaseRealtime';

export type CountdownTimerProps = {
  initialTime: number; // in seconds
  onComplete?: () => void;
  autoStart?: boolean;
  size?: 'sm' | 'md' | 'lg';
  timerId?: string; // Optional ID for Firebase sync
  isAdmin?: boolean; // Whether this instance can control other timers
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialTime,
  onComplete,
  autoStart = true,
  size = 'md',
  timerId,
  isAdmin = false
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
    if (timeLeft <= 10) return "text-red-500";
    if (timeLeft <= 30) return "text-yellow-500";
    return "text-primary";
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return "text-2xl";
      case 'lg': return "text-6xl";
      default: return "text-4xl";
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

  return (
    <div className="flex flex-col items-center">
      {/* Timer display */}
      <div className="relative">
        <div className={`font-mono ${getSizeClasses()} ${getTimerClass()} transition-colors duration-300`}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        {/* Circular progress */}
        <svg className="absolute -inset-2" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="46" 
            fill="none" 
            stroke="#f3f4f6" 
            strokeWidth="4" 
          />
          <circle 
            cx="50" 
            cy="50" 
            r="46" 
            fill="none" 
            stroke={timeLeft <= 10 ? "#ef4444" : timeLeft <= 30 ? "#f59e0b" : "#4581B6"} 
            strokeWidth="4" 
            strokeDasharray="289.027"
            strokeDashoffset={289.027 - (289.027 * progress / 100)} 
            transform="rotate(-90 50 50)" 
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
      </div>
      
      {/* Controls */}
      <div className="flex gap-2 mt-6">
        {!isRunning || isPaused ? (
          <button 
            onClick={startTimer}
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 button-transition"
          >
            {isPaused ? "Resume" : "Start"}
          </button>
        ) : (
          <button 
            onClick={pauseTimer}
            className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 button-transition"
          >
            Pause
          </button>
        )}
        <button 
          onClick={resetTimer}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 button-transition"
        >
          Reset
        </button>
      </div>
      
      {/* Show real-time sync indicator if timerId is provided */}
      {timerId && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <span>Real-time {isAdmin ? "controlling" : "synced"}</span>
          <div className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};
