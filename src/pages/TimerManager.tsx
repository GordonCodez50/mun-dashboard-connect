
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
import { realtimeService } from '@/services/firebaseService';
import { SEOHead } from '@/components/SEOHead';
import { ChairMobileNav } from '@/components/layout/ChairMobileNav';
import NotificationInitializer from '@/components/NotificationInitializer';
import { useIsMobile } from '@/hooks/use-mobile';

const TimerManager = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
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
    <>
      <SEOHead 
        title="Timer Management"
        description="Manage debate and speech timers with precision. Professional timer tools for Model United Nations conferences with real-time controls and sound alerts."
        canonicalUrl="/timer-manager"
      />
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Initialize notifications on this page */}
        <NotificationInitializer />
        
        {/* Desktop Sidebar */}
        {!isMobile && <Sidebar />}
        
        <div className="flex-1 overflow-y-auto transition-all duration-300"
             style={{ marginLeft: !isMobile ? 'var(--sidebar-width, 256px)' : '0' }}>
          <div className="p-4 md:p-6 xl:p-8 max-w-7xl mx-auto animate-fade-in">
            <header className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl xl:text-4xl font-bold text-primary dark:text-white animate-fade-in">
                Time Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2 text-sm md:text-base animate-slide-in">
                Control debate and speech timers with precision
              </p>
            </header>
            
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
              <Button 
                onClick={addNewTimer}
                className="bg-accent hover:bg-accent/90 flex items-center justify-center gap-2 px-4 md:px-5 py-2 h-10 md:h-11 text-sm md:text-base transition-all duration-300 hover:shadow-lg group animate-scale-in"
                data-tour="add-timer-btn"
              >
                <Plus size={16} className="md:hidden transition-transform group-hover:rotate-90 duration-300" />
                <Plus size={18} className="hidden md:block transition-transform group-hover:rotate-90 duration-300" />
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
                  data-tour={index === 0 ? "timer-label" : undefined}
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
                    showTourPresets={index === 0}
                    allowRemove={timers.length > 1}
                  />
                </div>
              ))}
            </div>
            
            {/* Timer Guide */}
            <div className="mt-6 md:mt-8 transition-all duration-500 animate-fade-in animation-delay-500">
              <TimerGuide />
            </div>
          </div>
        </div>
        <ChairMobileNav />
      </div>
    </>
  );
};

export default TimerManager;
