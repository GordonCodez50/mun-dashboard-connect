
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { toast } from "sonner";
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { TimerCard } from '@/components/timer/TimerCard';
import { TimerGuide } from '@/components/timer/TimerGuide';
import { SoundToggle } from '@/components/timer/SoundToggle';
import { timePresets } from '@/constants/timePresets';
import { formatTime } from '@/utils/timeUtils';

interface Timer {
  id: string;
  label: string;
  duration: number;
  isEditing: boolean;
}

const TimerManager = () => {
  const { user } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timers, setTimers] = useState<Timer[]>([
    { id: 'main-timer', label: 'Main Timer', duration: 300, isEditing: false }
  ]);
  
  // Handle preset selection
  const handlePresetSelect = (seconds: number, timerId: string) => {
    setTimers(prev => prev.map(timer => 
      timer.id === timerId 
        ? { ...timer, duration: seconds, isEditing: false } 
        : timer
    ));
    toast.success(`Timer set to ${formatTime(seconds)}`);
  };
  
  // Handle timer completion
  const handleTimerComplete = () => {
    if (soundEnabled) {
      // Play sound when timer completes
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
      audio.play();
    }
    
    toast.info('Timer has ended!', {
      style: {
        background: 'rgba(239, 68, 68, 0.9)',
        color: 'white',
      },
    });
  };
  
  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toast.success(soundEnabled ? 'Sound disabled' : 'Sound enabled');
  };

  // Handle time edit from TimeInput component
  const handleTimeChange = (minutes: number, seconds: number, timerId: string) => {
    const totalSeconds = (minutes * 60) + seconds;
    setTimers(prev => prev.map(timer => 
      timer.id === timerId 
        ? { ...timer, duration: totalSeconds, isEditing: false } 
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

  // Add a new timer
  const addNewTimer = () => {
    const newId = `timer-${Date.now()}`;
    const newTimer: Timer = {
      id: newId,
      label: `Timer ${timers.length + 1}`,
      duration: 300, // 5 minutes default
      isEditing: false
    };
    
    setTimers(prev => [...prev, newTimer]);
    toast.success('New timer added');
  };

  // Remove a timer
  const removeTimer = (timerId: string) => {
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-white">Timer Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Control debate and speech timers
            </p>
          </header>
          
          <div className="mb-6 flex items-center justify-between">
            <Button 
              onClick={addNewTimer}
              className="bg-accent hover:bg-accent/90 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Timer
            </Button>
            
            {/* Sound toggle */}
            <SoundToggle soundEnabled={soundEnabled} onToggle={toggleSound} />
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {timers.map((timer) => (
              <TimerCard
                key={timer.id}
                timer={timer}
                onLabelChange={updateTimerLabel}
                onTimeChange={handleTimeChange}
                onEditingChange={setEditingTimer}
                onTimerComplete={handleTimerComplete}
                onPresetSelect={handlePresetSelect}
                onRemove={removeTimer}
                timePresets={timePresets}
                allowRemove={timers.length > 1}
              />
            ))}
          </div>
          
          {/* Timer Guide */}
          <div className="mt-8">
            <TimerGuide />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerManager;
