
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const TimerGuide: React.FC = () => {
  return (
    <Card className="border-gray-200 dark:border-gray-800 shadow-md dark:bg-gray-800">
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
  );
};
