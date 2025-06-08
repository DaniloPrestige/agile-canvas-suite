
import React from 'react';

interface StatusCardProps {
  title: string;
  count: number | string;
  color: 'blue' | 'yellow' | 'gray' | 'green' | 'red' | 'purple';
  subtitle?: string;
  icon?: React.ReactNode;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, count, color, subtitle, icon }) => {
  const colorClasses = {
    blue: 'border-l-blue-500',
    yellow: 'border-l-yellow-500',
    gray: 'border-l-gray-500',
    green: 'border-l-green-500',
    red: 'border-l-red-500',
    purple: 'border-l-purple-500',
  };

  return (
    <div className={`bg-card border border-l-4 ${colorClasses[color]} rounded-lg p-6`}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <span className="text-3xl font-bold text-foreground mt-2">{count}</span>
        {subtitle && (
          <span className="text-sm text-muted-foreground mt-1">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default StatusCard;
