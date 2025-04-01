
import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Check, X } from 'lucide-react';

interface TimeInputProps {
  minutes: number;
  seconds: number;
  onTimeChange: (minutes: number, seconds: number) => void;
  onCancel?: () => void;
}

export function TimeInput({ minutes, seconds, onTimeChange, onCancel }: TimeInputProps) {
  const [mins, setMins] = useState<string>(minutes.toString());
  const [secs, setSecs] = useState<string>(seconds.toString().padStart(2, '0'));
  const minsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus on the minutes input when the component mounts
    if (minsInputRef.current) {
      minsInputRef.current.select();
    }
  }, []);

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setMins(value.slice(0, 2)); // Limit to 2 digits
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setSecs(value.slice(0, 2)); // Limit to 2 digits
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMinutes = parseInt(mins) || 0;
    const newSeconds = parseInt(secs) || 0;
    
    // Ensure seconds is between 0 and 59
    const adjustedSeconds = newSeconds >= 60 ? 59 : newSeconds;
    
    onTimeChange(newMinutes, adjustedSeconds);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full animate-fade-in">
      <div className="flex items-center space-x-1 mb-2">
        <div className="flex-1">
          <Input
            ref={minsInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={mins}
            onChange={handleMinutesChange}
            className="text-center font-mono"
            aria-label="Minutes"
          />
        </div>
        <span className="text-lg font-mono">:</span>
        <div className="flex-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={secs}
            onChange={handleSecondsChange}
            className="text-center font-mono"
            aria-label="Seconds"
          />
        </div>
      </div>
      <div className="flex space-x-2">
        <Button 
          type="submit" 
          className="flex-1 bg-accent hover:bg-accent/90 gap-1"
          size="sm"
        >
          <Check size={16} />
          Set
        </Button>
        <Button 
          type="button" 
          onClick={handleCancel} 
          variant="outline"
          className="flex-1 gap-1"
          size="sm"
        >
          <X size={16} />
          Cancel
        </Button>
      </div>
    </form>
  );
}
