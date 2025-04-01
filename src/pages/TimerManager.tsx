
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { TimeInput } from '@/components/ui/TimeInput';
import { toast } from "sonner";
import { Clock, Volume2, VolumeX, Edit, Plus, Trash2, Timer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Presets in seconds - updated as requested
const timePresets = [
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '10m', value: 600 },
  { label: '15m', value: 900 },
  { label: '30m', value: 1800 }
];

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
  
  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${
                  soundEnabled ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4" />
                    Sound On
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    Sound Off
                  </>
                )}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {timers.map((timer) => (
              <Card key={timer.id} className="border-gray-200 dark:border-gray-800 shadow-md dark:bg-gray-800 overflow-hidden">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="text-accent h-5 w-5" />
                      <div className="flex items-center gap-2">
                        <Input
                          value={timer.label}
                          onChange={(e) => updateTimerLabel(timer.id, e.target.value)}
                          className="text-xl text-primary dark:text-white font-semibold h-8 px-2 border-transparent focus:border-input"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {timer.isEditing ? (
                        <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full dark:bg-accent/30">
                          Editing
                        </span>
                      ) : null}
                      
                      {timers.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => removeTimer(timer.id)}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="w-full max-w-lg mx-auto">
                    {timer.isEditing ? (
                      <div className="py-6 max-w-[220px] mx-auto">
                        <TimeInput 
                          minutes={Math.floor(timer.duration / 60)}
                          seconds={timer.duration % 60}
                          onTimeChange={(minutes, seconds) => handleTimeChange(minutes, seconds, timer.id)}
                          onCancel={() => setEditingTimer(timer.id, false)}
                        />
                      </div>
                    ) : (
                      <div 
                        className="cursor-pointer relative" 
                        onClick={() => setEditingTimer(timer.id, true)}
                      >
                        <CountdownTimer 
                          initialTime={timer.duration} 
                          onComplete={handleTimerComplete} 
                          autoStart={false}
                          size="lg"
                          variant="minimal"
                        />
                        <button 
                          className="absolute -top-2 -right-2 bg-accent text-white p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTimer(timer.id, true);
                          }}
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Preset Times */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Preset Times</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {timePresets.map((preset) => (
                        <Button
                          key={preset.value}
                          onClick={() => handlePresetSelect(preset.value, timer.id)}
                          variant="outline"
                          className="py-2 h-auto text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Timer Guide */}
          <Card className="mt-8 border-gray-200 dark:border-gray-800 shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-primary dark:text-white">Timer Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-accent mt-0.5" />
                  <span>Normal: More than 30 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mt-0.5" />
                  <span>Warning: Less than 30 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 mt-0.5" />
                  <span>Critical: Less than 10 seconds</span>
                </li>
                <li className="flex items-start gap-2 mt-3 text-xs italic">
                  <span>Click on timer to edit directly</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimerManager;
