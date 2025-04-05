
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Timer, AlertTriangle, MousePointerClick } from 'lucide-react';

export const TimerGuide: React.FC = () => {
  return (
    <Card className="border-gray-200 dark:border-gray-800 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden">
      <CardHeader className="bg-accent/5 border-b border-gray-200 dark:border-gray-700 pb-3">
        <CardTitle className="text-lg text-primary dark:text-white flex items-center gap-2">
          <Clock size={18} className="text-accent" />
          Timer Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3">
          <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Timer size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary dark:text-white">Normal Time</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">More than 30 seconds</p>
            </div>
          </li>
          
          <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Timer size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary dark:text-white">Warning</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Less than 30 seconds remaining</p>
            </div>
          </li>
          
          <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary dark:text-white">Critical</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Less than 10 seconds remaining</p>
            </div>
          </li>
        </ul>
        
        <div className="mt-4 p-3 bg-accent/5 border border-accent/20 rounded-lg">
          <p className="text-xs flex items-center justify-center gap-1.5 text-gray-600 dark:text-gray-400">
            <MousePointerClick size={14} className="text-accent" />
            Click on timer display to edit time directly
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
