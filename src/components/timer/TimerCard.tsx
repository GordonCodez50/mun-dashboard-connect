
import React from 'react';
import { Timer, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { TimeInput } from '@/components/ui/TimeInput';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner";

interface TimerCardProps {
  timer: {
    id: string;
    label: string;
    duration: number;
    isEditing: boolean;
    isRunning?: boolean;
    isPaused?: boolean;
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
  const progress = Math.max(0, (timer.duration / (parseInt(timer.duration.toString()) || 300)) * 100);
  
  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (timer.duration <= 10) return "text-red-500";
    if (timer.duration <= 30) return "text-amber-500";
    return "text-primary dark:text-white";
  };

  // Determine if timer should have warning animation
  const getTimerAnimation = () => {
    if (timer.duration <= 10 && timer.isRunning && !timer.isPaused) return "time-warning";
    return "";
  };

  // Determine if timer should show glow effect
  const getGlowEffect = () => {
    if (timer.isRunning && !timer.isPaused) return "timer-glow";
    return "";
  };

  // Get active preset if any matches current timer duration
  const getActivePreset = (presetValue: number) => {
    return timer.duration === presetValue ? "preset-button-active" : "";
  };

  return (
    <Card className="timer-card">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="text-accent h-5 w-5" />
            <div className="flex items-center gap-2">
              <Input
                value={timer.label}
                onChange={(e) => onLabelChange(timer.id, e.target.value)}
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
            
            {allowRemove && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200"
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
            <div className="py-6 max-w-[220px] mx-auto">
              <TimeInput 
                minutes={Math.floor(timer.duration / 60)}
                seconds={timer.duration % 60}
                onTimeChange={(minutes, seconds) => onTimeChange(minutes, seconds, timer.id)}
                onCancel={() => onEditingChange(timer.id, false)}
              />
            </div>
          ) : (
            <div className={`w-full p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative ${getGlowEffect()}`}>
              <button 
                className="absolute top-3 right-3 text-gray-400 hover:text-accent transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onEditingChange(timer.id, true)}
              >
                <Edit size={16} />
              </button>

              <div 
                className={`flex justify-center mb-6 cursor-pointer ${getTimerAnimation()}`}
                onClick={() => onEditingChange(timer.id, true)}
              >
                <div className={`text-5xl font-mono font-bold ${getTimerColor()} transition-colors duration-300 timer-display`}>
                  {formatTime(timer.duration)}
                </div>
              </div>
              
              <div className="timer-progress-bg mb-6">
                <div
                  className="timer-progress"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => onStartPause(timer.id)}
                  variant={timer.isRunning && !timer.isPaused ? "secondary" : "default"}
                  className={`${!(timer.isRunning && !timer.isPaused) ? "bg-accent hover:bg-accent/90" : ""} px-6 py-2 h-11 w-32 timer-button`}
                >
                  {timer.isRunning && !timer.isPaused ? (
                    <>
                      <Pause size={18} className="mr-1" /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={18} className="mr-1" /> Start
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => onReset(timer.id)}
                  variant="outline"
                  className="px-6 py-2 h-11 w-32 timer-button"
                >
                  <RefreshCw size={18} className="mr-1" /> Reset
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Preset Times */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Preset Times</h3>
          <div className="grid grid-cols-5 gap-2">
            {timePresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onPresetSelect(preset.value, timer.id)}
                className={`preset-button ${getActivePreset(preset.value)}`}
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
