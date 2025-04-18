
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { formatTime } from '@/utils/timeUtils';
import { notificationService } from '@/services/notificationService';

interface Timer {
  id: string;
  label: string;
  duration: number;
  isEditing: boolean;
  isRunning: boolean;
  isPaused: boolean;
  initialDuration: number;
  startTime?: number;
  pausedAt?: number;
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

// Store timer state in sessionStorage to persist across page navigations
const TIMER_STORAGE_KEY = 'mun-dashboard-timers';
const SOUND_STORAGE_KEY = 'mun-dashboard-sound-enabled';

// Helper to load timers from storage
const loadTimersFromStorage = (): Timer[] => {
  try {
    const storedTimers = sessionStorage.getItem(TIMER_STORAGE_KEY);
    if (storedTimers) {
      return JSON.parse(storedTimers);
    }
  } catch (e) {
    console.error('Error loading timers from storage:', e);
  }
  
  // Default timer if none in storage
  return [{ 
    id: 'main-timer', 
    label: 'Main Timer', 
    duration: 300, 
    initialDuration: 300,
    isEditing: false,
    isRunning: false,
    isPaused: false
  }];
};

// Helper to load sound preference from storage
const loadSoundPrefFromStorage = (): boolean => {
  try {
    const storedPref = localStorage.getItem(SOUND_STORAGE_KEY);
    return storedPref ? JSON.parse(storedPref) : true;
  } catch (e) {
    return true;
  }
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from storage to persist across page navigations
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundPrefFromStorage());
  const [timers, setTimers] = useState<Timer[]>(() => loadTimersFromStorage());
  
  const intervalRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  
  // Persist timer state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
    } catch (e) {
      console.error('Error saving timers to storage:', e);
    }
  }, [timers]);
  
  // Persist sound preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundEnabled));
    } catch (e) {
      console.error('Error saving sound preference:', e);
    }
  }, [soundEnabled]);
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);
  
  // Use visibilitychange event to handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes visible again, recalculate all running timers
        setTimers(prev => prev.map(timer => {
          if (timer.isRunning && !timer.isPaused && timer.startTime) {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - timer.startTime) / 1000);
            const newDuration = Math.max(0, timer.initialDuration - elapsedSeconds);
            
            // If timer has completed while tab was inactive
            if (newDuration <= 0) {
              if (intervalRefs.current[timer.id]) {
                clearInterval(intervalRefs.current[timer.id]!);
                intervalRefs.current[timer.id] = null;
              }
              // Handle timer completion
              handleTimerComplete(timer.label);
              return { ...timer, duration: 0, isRunning: false, startTime: undefined };
            }
            
            return { ...timer, duration: newDuration };
          }
          return timer;
        }));
      }
    };
    
    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Timer tick effect with improved reliability
  useEffect(() => {
    timers.forEach(timer => {
      if (timer.isRunning && !timer.isPaused) {
        // Clear any existing interval
        if (intervalRefs.current[timer.id]) {
          clearInterval(intervalRefs.current[timer.id]!);
        }
        
        // Record the exact time when the timer starts/resumes
        if (!timer.startTime) {
          setTimers(prev => prev.map(t => 
            t.id === timer.id 
              ? { ...t, startTime: Date.now() - ((timer.initialDuration - timer.duration) * 1000) } 
              : t
          ));
        }
        
        intervalRefs.current[timer.id] = setInterval(() => {
          setTimers(prev => prev.map(t => {
            if (t.id === timer.id) {
              const now = Date.now();
              const elapsedSeconds = Math.floor((now - (t.startTime || now)) / 1000);
              const newDuration = Math.max(0, t.initialDuration - elapsedSeconds);
              
              if (newDuration <= 0) {
                // Timer completed
                if (intervalRefs.current[t.id]) {
                  clearInterval(intervalRefs.current[t.id]!);
                  intervalRefs.current[t.id] = null;
                }
                handleTimerComplete(t.label);
                return { ...t, duration: 0, isRunning: false, startTime: undefined };
              }
              return { ...t, duration: newDuration };
            }
            return t;
          }));
        }, 1000);
      } else if (intervalRefs.current[timer.id]) {
        clearInterval(intervalRefs.current[timer.id]!);
        intervalRefs.current[timer.id] = null;
        
        // If paused, record the time it was paused at
        if (timer.isPaused && timer.isRunning) {
          setTimers(prev => prev.map(t => 
            t.id === timer.id 
              ? { ...t, pausedAt: Date.now() } 
              : t
          ));
        }
      }
    });
  }, [timers]);
  
  // Handle timer completion with timer name
  const handleTimerComplete = (timerName: string) => {
    if (soundEnabled) {
      // Play sound when timer completes
      const audio = new Audio('/notification.mp3');
      audio.play();
    }
    
    // Show toast notification
    toast.info(`${timerName} has ended!`, {
      style: {
        background: 'rgba(239, 68, 68, 0.9)',
        color: 'white',
      },
    });
    
    // Show browser notification (works even when on different pages)
    notificationService.showTimerNotification(timerName);
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
            isPaused: false,
            startTime: undefined,
            pausedAt: undefined
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
            isPaused: false,
            startTime: undefined,
            pausedAt: undefined
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
          return { ...timer, isPaused: true, pausedAt: Date.now() };
        } else if (timer.isPaused && timer.pausedAt && timer.startTime) {
          // Resume the timer - adjust startTime based on pause duration
          const pauseDuration = Date.now() - timer.pausedAt;
          return { 
            ...timer, 
            isPaused: false, 
            pausedAt: undefined,
            startTime: timer.startTime + pauseDuration 
          };
        } else {
          // Start the timer from scratch
          return { 
            ...timer, 
            isRunning: true, 
            isPaused: false,
            startTime: Date.now() - ((timer.initialDuration - timer.duration) * 1000)
          };
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
            isPaused: false,
            startTime: undefined,
            pausedAt: undefined
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
