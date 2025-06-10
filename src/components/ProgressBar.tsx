
import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '', 
  showPercentage = false,
  size = 'md',
  animated = true
}) => {
  const getProgressColor = (value: number) => {
    if (value < 30) return 'from-red-400 via-red-500 to-red-600';
    if (value < 70) return 'from-yellow-400 via-yellow-500 to-yellow-600';
    return 'from-green-400 via-green-500 to-green-600';
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-6';
      default: return 'h-4';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex-1 bg-gray-200 rounded-full shadow-inner border ${getSizeClasses(size)} mr-2`}>
        <div
          className={`${getSizeClasses(size)} rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${getProgressColor(progress)} shadow-md ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          <div className="h-full rounded-full bg-white bg-opacity-25 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-t from-transparent to-white bg-opacity-20"></div>
          </div>
        </div>
      </div>
      {showPercentage && (
        <span className="text-sm font-bold text-gray-700 min-w-[3rem]">
          {progress}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
