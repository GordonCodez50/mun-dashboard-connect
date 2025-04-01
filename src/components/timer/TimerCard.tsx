
import React from 'react';
import { Timer, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { TimeInput } from '@/components/ui/TimeInput';
import { toast } from "sonner";

interface TimerCardProps {
  timer: {
    id: string;
    label: string;
    duration: number;
    isEditing: boolean;
  };
  onLabelChange: (timerId: string, newLabel: string) => void;
  onTimeChange: (minutes: number, seconds: number, timerId: string) => void;
  onEditingChange: (timerId: string, isEditing: boolean) => void;
  onTimerComplete: () => void;
  onPresetSelect: (seconds: number, timerId: string) => void;
  onRemove: (timerId: string) => void;
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
  timePresets,
  allowRemove
}) => {
  return (
    <Card className="border-gray-200 dark:border-gray-800 shadow-md dark:bg-gray-800 overflow-hidden">
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
                className="h-8 w-8 rounded-full"
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
            <div 
              className="cursor-pointer relative" 
              onClick={() => onEditingChange(timer.id, true)}
            >
              <CountdownTimer 
                initialTime={timer.duration} 
                onComplete={onTimerComplete} 
                autoStart={false}
                size="lg"
                variant="minimal"
              />
              <button 
                className="absolute -top-2 -right-2 bg-accent text-white p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditingChange(timer.id, true);
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
                onClick={() => onPresetSelect(preset.value, timer.id)}
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
  );
};
