
import React from 'react';
import { cn } from '@/lib/utils';

export type AlertButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'urgent';
  className?: string;
  loading?: boolean;
};

export const AlertButton: React.FC<AlertButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'default',
  className,
  loading = false
}) => {
  return (
    <button
      className={cn(
        'alert-button',
        variant === 'urgent' && 'alert-button-urgent',
        loading && 'opacity-75 cursor-wait',
        className
      )}
      onClick={onClick}
      disabled={loading}
    >
      <div className="text-accent mb-2 flex items-center justify-center h-10 w-10">
        {loading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          icon
        )}
      </div>
      <span className={`font-medium text-sm ${variant === 'urgent' ? 'text-red-700' : 'text-primary'}`}>
        {label}
      </span>
    </button>
  );
};
