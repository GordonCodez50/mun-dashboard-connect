
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  soundEnabled: boolean;
  onToggle: () => void;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ soundEnabled, onToggle }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggle}
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
  );
};
