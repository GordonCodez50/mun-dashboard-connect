
import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { TimerCard } from '@/components/timer/TimerCard';
import { TimerGuide } from '@/components/timer/TimerGuide';
import { SoundToggle } from '@/components/timer/SoundToggle';
import { timePresets } from '@/constants/timePresets';
import { useTimers } from '@/context/TimerContext';

const TimerManager = () => {
  const { user } = useAuth();
  const { 
    timers, 
    soundEnabled, 
    setSoundEnabled,
    handlePresetSelect,
    handleTimeChange,
    setEditingTimer,
    handleStartPause,
    handleReset,
    addNewTimer,
    removeTimer,
    updateTimerLabel
  } = useTimers();
  
  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
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
                onTimerComplete={() => {}}
                onPresetSelect={handlePresetSelect}
                onRemove={removeTimer}
                onStartPause={handleStartPause}
                onReset={handleReset}
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
