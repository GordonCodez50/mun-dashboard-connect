
import React from 'react';

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ 
  title, 
  children,
  className = "mb-8"
}) => {
  return (
    <div className={className}>
      <h2 className="dashboard-subheading mb-4">{title}</h2>
      {children}
    </div>
  );
};
