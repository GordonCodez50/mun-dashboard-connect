
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { TimeInput } from '@/components/ui/TimeInput';
import { toast } from "sonner";
import { Clock, Volume2, VolumeX, Edit } from 'lucide-react';
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

const TimerManager = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(300); // Default 5 minutes
  const [customTime, setCustomTime] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [editingTimer, setEditingTimer] = useState(false);
  
  // Handle preset selection
  const handlePresetSelect = (seconds: number) => {
    setCurrentTime(seconds);
    setIsActive(false);
    toast.success(`Timer set to ${formatTime(seconds)}`);
  };
  
  // Handle custom time input
  const handleCustomTimeSet = () => {
    const timeInSeconds = parseCustomTime(customTime);
    
    if (timeInSeconds > 0) {
      setCurrentTime(timeInSeconds);
      setIsActive(false);
      toast.success(`Timer set to ${formatTime(timeInSeconds)}`);
      setCustomTime('');
    } else {
      toast.error('Please enter a valid time');
    }
  };
  
  // Parse custom time input (format: mm:ss)
  const parseCustomTime = (timeString: string): number => {
    // Check if it's just seconds
    if (/^\d+$/.test(timeString)) {
      return parseInt(timeString, 10);
    }
    
    // Check for mm:ss format
    const match = timeString.match(/^(\d+):(\d{1,2})$/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      
      if (seconds < 60) {
        return (minutes * 60) + seconds;
      }
    }
    
    return 0;
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
  const handleTimeChange = (minutes: number, seconds: number) => {
    const totalSeconds = (minutes * 60) + seconds;
    setCurrentTime(totalSeconds);
    setEditingTimer(false);
    toast.success(`Timer set to ${formatTime(totalSeconds)}`);
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
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Timer */}
            <Card className="lg:col-span-2 border-gray-200 dark:border-gray-800 shadow-md dark:bg-gray-800 overflow-hidden">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="text-accent h-5 w-5" />
                    <CardTitle className="text-xl text-primary dark:text-white">Session Timer</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingTimer ? (
                      <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full dark:bg-accent/30">
                        Editing
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="w-full max-w-lg mx-auto">
                  {editingTimer ? (
                    <div className="py-10 max-w-[220px] mx-auto">
                      <TimeInput 
                        minutes={Math.floor(currentTime / 60)}
                        seconds={currentTime % 60}
                        onTimeChange={handleTimeChange}
                        onCancel={() => setEditingTimer(false)}
                      />
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer relative" 
                      onClick={() => setEditingTimer(true)}
                    >
                      <CountdownTimer 
                        initialTime={currentTime} 
                        onComplete={handleTimerComplete} 
                        autoStart={false}
                        size="lg"
                        timerId="main-session-timer"
                      />
                      <button 
                        className="absolute -top-2 -right-2 bg-accent text-white p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTimer(true);
                        }}
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Sound toggle */}
                <div className="mt-8 flex items-center justify-center">
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
              </CardContent>
            </Card>
            
            {/* Time Controls */}
            <Card className="lg:col-span-1 border-gray-200 dark:border-gray-800 shadow-md dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-primary dark:text-white">Timer Controls</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Preset Times */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Preset Times</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {timePresets.map((preset) => (
                      <Button
                        key={preset.value}
                        onClick={() => handlePresetSelect(preset.value)}
                        variant="outline"
                        className="py-2 h-auto text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Time */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Custom Time</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      placeholder="mm:ss or seconds"
                      className="flex-1 px-3 py-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-accent"
                    />
                    <Button
                      onClick={handleCustomTimeSet}
                      className="px-3 py-2 bg-accent text-white hover:bg-accent/90"
                    >
                      Set
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter time as mm:ss (e.g., 2:30) or in seconds
                  </p>
                </div>
                
                {/* Timer Guide */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Quick Guide</h3>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerManager;
