
import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { TimerCard } from '@/components/timer/TimerCard';
import { TimerGuide } from '@/components/timer/TimerGuide';
import { SoundToggle } from '@/components/timer/SoundToggle';
import { timePresets } from '@/constants/timePresets';
import { useTimers } from '@/context/TimerContext';
import { realtimeService } from '@/services/realtimeService';

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
  
  // Initialize realtime listeners when page loads
  useEffect(() => {
    // Ensure global alert listeners are initialized
    realtimeService.initializeAlertListeners();
  }, []);
  
  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 xl:p-10 max-w-7xl mx-auto animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-white animate-fade-in">
              Timer Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 animate-slide-in">
              Control debate and speech timers with precision
            </p>
          </header>
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Button 
              onClick={addNewTimer}
              className="bg-accent hover:bg-accent/90 flex items-center gap-2 px-5 py-2 h-11 transition-all duration-300 hover:shadow-lg group animate-scale-in"
            >
              <Plus size={18} className="transition-transform group-hover:rotate-90 duration-300" />
              <span>Add Timer</span>
            </Button>
            
            {/* Sound toggle */}
            <div className="animate-scale-in animation-delay-300">
              <SoundToggle soundEnabled={soundEnabled} onToggle={toggleSound} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 mb-12">
            {timers.map((timer, index) => (
              <div 
                key={timer.id} 
                className="transition-all duration-500"
                style={{ 
                  opacity: 0,
                  animation: 'fade-in 0.5s ease-out forwards',
                  animationDelay: `${(index + 1) * 150}ms`
                }}
              >
                <TimerCard
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
              </div>
            ))}
          </div>
          
          {/* Timer Guide */}
          <div className="mt-8 transition-all duration-500 animate-fade-in animation-delay-500">
            <TimerGuide />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerManager;
