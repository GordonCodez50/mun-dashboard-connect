
import React from 'react';

interface DashboardHeaderProps {
  title: string;
  userName?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, userName }) => {
  return (
    <header className="mb-8">
      <h1 className="dashboard-heading">
        {title}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">
        Welcome back, <span className="font-semibold text-primary">{userName || 'User'}</span>
      </p>
    </header>
  );
};
