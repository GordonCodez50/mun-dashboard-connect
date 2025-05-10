
import React, { useState } from 'react';
import { Timer, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { TimeInput } from '@/components/ui/TimeInput';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface TimerCardProps {
  timer: {
    id: string;
    label: string;
    duration: number;
    isEditing: boolean;
    isRunning?: boolean;
    isPaused?: boolean;
    initialDuration: number;
  };
  onLabelChange: (timerId: string, newLabel: string) => void;
  onTimeChange: (minutes: number, seconds: number, timerId: string) => void;
  onEditingChange: (timerId: string, isEditing: boolean) => void;
  onTimerComplete: () => void;
  onPresetSelect: (seconds: number, timerId: string) => void;
  onRemove: (timerId: string) => void;
  onStartPause: (timerId: string) => void;
  onReset: (timerId: string) => void;
  timePresets: Array<{ label: string; value: number }>;
  allowRemove: boolean;
}

export const TimerCard: React.FC<TimerCardProps> = ({
  timer,
  onLabelChange,
  onTimeChange,
  onEditingChange,
  onTimerComplete,
  onPresetSelect,
  onRemove,
  onStartPause,
  onReset,
  timePresets,
  allowRemove
}) => {
  // Format time for display
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = Math.max(0, (timer.duration / timer.initialDuration) * 100);
  
  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (timer.duration <= 10) return "text-red-500";
    if (timer.duration <= 30) return "text-amber-500";
    return "text-primary dark:text-white";
  };

  // Determine progress indicator color based on time left
  const getProgressColor = () => {
    if (timer.duration <= 10) return "bg-gradient-to-r from-red-500 to-rose-400";
    if (timer.duration <= 30) return "bg-gradient-to-r from-amber-500 to-yellow-400";
    return "bg-gradient-to-r from-accent to-sky-400";
  };

  // Get active preset if any matches current timer duration
  const getActivePreset = (presetValue: number) => {
    return timer.duration === presetValue;
  };

  return (
    <Card 
      className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 animate-fade-in"
    >
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Timer className="text-accent h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={timer.label}
                onChange={(e) => onLabelChange(timer.id, e.target.value)}
                className="text-xl text-primary dark:text-white font-semibold h-8 px-2 border-transparent focus:border-input focus:ring-1 focus:ring-accent transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timer.isEditing && (
              <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full dark:bg-accent/30 animate-pulse-subtle">
                Editing
              </span>
            )}
            
            {allowRemove && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors duration-300"
                onClick={() => onRemove(timer.id)}
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
            <div className="py-6 max-w-[220px] mx-auto animate-scale-in">
              <TimeInput 
                minutes={Math.floor(timer.duration / 60)}
                seconds={timer.duration % 60}
                onTimeChange={(minutes, seconds) => onTimeChange(minutes, seconds, timer.id)}
                onCancel={() => onEditingChange(timer.id, false)}
              />
            </div>
          ) : (
            <div 
              className="w-full p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Animated background decorative elements */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-32 h-32 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-gradient-1"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent rounded-full translate-x-1/2 translate-y-1/2 blur-3xl animate-gradient-2"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl animate-gradient-3 animation-delay-2000"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl animate-gradient-4 animation-delay-2000"></div>
              </div>
              
              <button 
                className="absolute top-3 right-3 text-gray-400 hover:text-accent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onEditingChange(timer.id, true)}
                aria-label="Edit timer"
              >
                <Edit size={18} />
              </button>

              {/* Timer icon */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 opacity-5">
                <Timer size={180} strokeWidth={1} className="text-accent" />
              </div>

              <div 
                className="flex justify-center mb-6 cursor-pointer"
                onClick={() => onEditingChange(timer.id, true)}
              >
                <div className={`text-6xl font-mono font-bold timer-display ${getTimerColor()} transition-colors duration-300`}>
                  {formatTime(timer.duration)}
                </div>
              </div>
              
              {/* Enhanced timer progress */}
              <div className="mb-8">
                <Progress 
                  value={progress} 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                  indicatorColor={getProgressColor()}
                />
                
                {/* Time markers */}
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>0:00</span>
                  <span>{formatTime(timer.initialDuration)}</span>
                </div>
              </div>
              
              <div className="flex justify-center gap-5">
                <Button
                  onClick={() => onStartPause(timer.id)}
                  variant={timer.isRunning && !timer.isPaused ? "secondary" : "default"}
                  className={`${!(timer.isRunning && !timer.isPaused) ? "bg-accent hover:bg-accent/90" : ""} px-6 py-2 h-12 w-36 font-medium relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-y-full bg-white/10 group-hover:translate-y-0"></div>
                  {timer.isRunning && !timer.isPaused ? (
                    <>
                      <Pause size={20} className="mr-2" /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={20} className="mr-2" /> Start
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => onReset(timer.id)}
                  variant="outline"
                  className="px-6 py-2 h-12 w-36 font-medium border-2 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-y-full bg-gray-100 dark:bg-gray-700 group-hover:translate-y-0 opacity-10"></div>
                  <RefreshCw size={20} className="mr-2 group-hover:rotate-180 transition-transform duration-500" /> Reset
                </Button>
              </div>
              
              {/* Show pulsing indicator when timer is running */}
              {timer.isRunning && !timer.isPaused && (
                <div className="mt-4 flex items-center justify-center animate-fade-in">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                  <span className="text-xs text-gray-500">Running</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Preset Times */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Preset Times</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {timePresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onPresetSelect(preset.value, timer.id)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  getActivePreset(preset.value) 
                    ? "bg-accent text-white shadow-md" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
