
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { formatTime } from '@/utils/timeUtils';

interface Timer {
  id: string;
  label: string;
  duration: number;
  isEditing: boolean;
  isRunning: boolean;
  isPaused: boolean;
  initialDuration: number;
}

interface TimerContextType {
  timers: Timer[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setTimers: React.Dispatch<React.SetStateAction<Timer[]>>;
  handlePresetSelect: (seconds: number, timerId: string) => void;
  handleTimeChange: (minutes: number, seconds: number, timerId: string) => void;
  setEditingTimer: (timerId: string, isEditing: boolean) => void;
  handleStartPause: (timerId: string) => void;
  handleReset: (timerId: string) => void;
  addNewTimer: () => void;
  removeTimer: (timerId: string) => void;
  updateTimerLabel: (timerId: string, newLabel: string) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timers, setTimers] = useState<Timer[]>([
    { 
      id: 'main-timer', 
      label: 'Main Timer', 
      duration: 300, 
      initialDuration: 300,
      isEditing: false,
      isRunning: false,
      isPaused: false
    }
  ]);
  
  const intervalRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);
  
  // Timer tick effect
  useEffect(() => {
    timers.forEach(timer => {
      if (timer.isRunning && !timer.isPaused) {
        if (intervalRefs.current[timer.id]) {
          clearInterval(intervalRefs.current[timer.id]!);
        }
        
        intervalRefs.current[timer.id] = setInterval(() => {
          setTimers(prev => prev.map(t => {
            if (t.id === timer.id) {
              if (t.duration <= 1) {
                // Timer completed
                if (intervalRefs.current[t.id]) {
                  clearInterval(intervalRefs.current[t.id]!);
                  intervalRefs.current[t.id] = null;
                }
                handleTimerComplete();
                return { ...t, duration: 0, isRunning: false };
              }
              return { ...t, duration: t.duration - 1 };
            }
            return t;
          }));
        }, 1000);
      } else if (intervalRefs.current[timer.id]) {
        clearInterval(intervalRefs.current[timer.id]!);
        intervalRefs.current[timer.id] = null;
      }
    });
  }, [timers]);
  
  // Handle timer completion
  const handleTimerComplete = () => {
    if (soundEnabled) {
      // Play sound when timer completes
      const audio = new Audio('/notification.mp3');
      audio.play();
    }
    
    toast.info('Timer has ended!', {
      style: {
        background: 'rgba(239, 68, 68, 0.9)',
        color: 'white',
      },
    });
  };
  
  // Handle preset selection
  const handlePresetSelect = (seconds: number, timerId: string) => {
    setTimers(prev => prev.map(timer => 
      timer.id === timerId 
        ? { 
            ...timer, 
            duration: seconds, 
            initialDuration: seconds,
            isEditing: false,
            isRunning: false,
            isPaused: false
          } 
        : timer
    ));
    toast.success(`Timer set to ${formatTime(seconds)}`);
  };

  // Handle time edit from TimeInput component
  const handleTimeChange = (minutes: number, seconds: number, timerId: string) => {
    const totalSeconds = (minutes * 60) + seconds;
    setTimers(prev => prev.map(timer => 
      timer.id === timerId 
        ? { 
            ...timer, 
            duration: totalSeconds, 
            initialDuration: totalSeconds,
            isEditing: false,
            isRunning: false,
            isPaused: false
          } 
        : timer
    ));
    toast.success(`Timer set to ${formatTime(totalSeconds)}`);
  };

  // Set timer to editing state
  const setEditingTimer = (timerId: string, isEditing: boolean) => {
    setTimers(prev => prev.map(timer => 
      timer.id === timerId 
        ? { ...timer, isEditing } 
        : timer
    ));
  };

  // Start/Pause timer
  const handleStartPause = (timerId: string) => {
    setTimers(prev => prev.map(timer => {
      if (timer.id === timerId) {
        if (timer.isRunning && !timer.isPaused) {
          // Pause the timer
          return { ...timer, isPaused: true };
        } else {
          // Start/Resume the timer
          return { ...timer, isRunning: true, isPaused: false };
        }
      }
      return timer;
    }));
  };

  // Reset timer
  const handleReset = (timerId: string) => {
    setTimers(prev => prev.map(timer => 
      timer.id === timerId 
        ? { 
            ...timer, 
            duration: timer.initialDuration,
            isRunning: false,
            isPaused: false
          } 
        : timer
    ));
  };

  // Add a new timer
  const addNewTimer = () => {
    const newId = `timer-${Date.now()}`;
    const newTimer: Timer = {
      id: newId,
      label: `Timer ${timers.length + 1}`,
      duration: 300, // 5 minutes default
      initialDuration: 300,
      isEditing: false,
      isRunning: false,
      isPaused: false
    };
    
    setTimers(prev => [...prev, newTimer]);
    toast.success('New timer added');
  };

  // Remove a timer
  const removeTimer = (timerId: string) => {
    // Clear any running interval for this timer
    if (intervalRefs.current[timerId]) {
      clearInterval(intervalRefs.current[timerId]!);
      intervalRefs.current[timerId] = null;
    }
    
    setTimers(prev => prev.filter(timer => timer.id !== timerId));
    toast.success('Timer removed');
  };

  // Update timer label
  const updateTimerLabel = (timerId: string, newLabel: string) => {
    setTimers(prev => prev.map(timer => 
      timer.id === timerId 
        ? { ...timer, label: newLabel } 
        : timer
    ));
  };

  const value = {
    timers,
    soundEnabled,
    setSoundEnabled,
    setTimers,
    handlePresetSelect,
    handleTimeChange,
    setEditingTimer,
    handleStartPause,
    handleReset,
    addNewTimer,
    removeTimer,
    updateTimerLabel
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimers = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimers must be used within a TimerProvider');
  }
  return context;
};
