
import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '', 
  showPercentage = false 
}) => {
  const getProgressColor = (value: number) => {
    if (value < 30) return 'bg-red-500';
    if (value < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-sm text-muted-foreground min-w-[3rem]">
          {progress}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
