
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { toast } from "sonner";
import { Clock, Volume2, VolumeX } from 'lucide-react';

// Presets in seconds
const timePresets = [
  { label: '30 Sec', value: 30 },
  { label: '1 Min', value: 60 },
  { label: '2 Min', value: 120 },
  { label: '3 Min', value: 180 },
  { label: '5 Min', value: 300 },
  { label: '10 Min', value: 600 }
];

const TimerManager = () => {
  const [currentTime, setCurrentTime] = useState(120); // Default 2 minutes
  const [customTime, setCustomTime] = useState('');
  const [adminSync, setAdminSync] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isActive, setIsActive] = useState(false);
  
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
    
    toast.info('Timer has ended!');
  };
  
  // Toggle admin sync
  const toggleAdminSync = () => {
    setAdminSync(!adminSync);
    toast.success(adminSync ? 'Admin sync disabled' : 'Admin sync enabled');
  };
  
  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toast.success(soundEnabled ? 'Sound disabled' : 'Sound enabled');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Timer Management</h1>
            <p className="text-gray-600 mt-1">
              Control debate and speech timers
            </p>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Timer */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="mb-6 flex items-center gap-2">
                  <Clock className="text-accent h-6 w-6" />
                  <h2 className="text-xl font-medium text-primary">Session Timer</h2>
                </div>
                
                <div className="w-full max-w-lg">
                  <CountdownTimer 
                    initialTime={currentTime} 
                    onComplete={handleTimerComplete} 
                    autoStart={false}
                    size="lg"
                  />
                </div>
                
                {/* Admin sync toggle */}
                <div className="mt-8 flex items-center justify-center gap-8">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAdminSync}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${
                        adminSync ? 'bg-accent' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                          adminSync ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">Admin Sync</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSound}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent ${
                        soundEnabled ? 'bg-accent' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="flex items-center gap-1 text-sm text-gray-600">
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
              </div>
            </div>
            
            {/* Time Controls */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-medium text-primary mb-4">Timer Controls</h2>
                
                {/* Preset Times */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Preset Times</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {timePresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handlePresetSelect(preset.value)}
                        className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium button-transition"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Time */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Custom Time</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      placeholder="mm:ss or seconds"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm input-shadow focus:outline-none focus:ring-accent focus:border-accent"
                    />
                    <button
                      onClick={handleCustomTimeSet}
                      className="px-3 py-2 bg-accent text-white rounded-md hover:bg-accent/90 button-transition"
                    >
                      Set
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter time as mm:ss (e.g., 2:30) or in seconds
                  </p>
                </div>
                
                {/* Timer Guide */}
                <div className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Quick Guide</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-start gap-1">
                      <span className="inline-block w-4 h-4 rounded-full bg-green-500 mt-0.5" />
                      <span>Green: More than 30 seconds</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="inline-block w-4 h-4 rounded-full bg-yellow-500 mt-0.5" />
                      <span>Yellow: Less than 30 seconds</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="inline-block w-4 h-4 rounded-full bg-red-500 mt-0.5" />
                      <span>Red: Less than 10 seconds</span>
                    </li>
                    <li className="flex items-start gap-1 mt-1">
                      <span>Sound will play when timer ends</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerManager;
