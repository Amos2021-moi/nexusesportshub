"use client";

import { useEffect, useState, memo } from "react";

interface ProgressBarProps {
  isVisible: boolean;
  progress: number; // 0-100
  status: 'approving' | 'rejecting' | 'completed' | 'error';
  label?: string;
}

const ProgressBar = memo(({ isVisible, progress, status, label }: ProgressBarProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Animate progress smoothly
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev < progress) {
            return Math.min(prev + 2, progress);
          }
          return prev;
        });
      }, 20);

      return () => clearInterval(interval);
    } else {
      setDisplayProgress(0);
    }
  }, [isVisible, progress]);

  if (!isVisible) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'approving':
        return 'from-emerald-500 to-green-600';
      case 'rejecting':
        return 'from-red-500 to-rose-600';
      case 'completed':
        return 'from-green-500 to-emerald-600';
      case 'error':
        return 'from-red-500 to-orange-600';
      default:
        return 'from-blue-500 to-indigo-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'approving':
        return 'Approving...';
      case 'rejecting':
        return 'Rejecting...';
      case 'completed':
        return '✅ Complete!';
      case 'error':
        return '❌ Failed';
      default:
        return label || 'Processing...';
    }
  };

  const getProgressColor = () => {
    if (status === 'error') return 'bg-red-500';
    if (status === 'completed') return 'bg-emerald-500';
    return 'bg-gradient-to-r from-emerald-500 to-green-500';
  };

  return (
    <div className="mt-3 w-full">
      {/* Progress Bar Container */}
      <div className="relative">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-gray-300">
            {getStatusText()}
          </span>
          <span className="font-bold text-white">
            {Math.round(displayProgress)}%
          </span>
        </div>
        
        {/* Progress Track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700/50">
          {/* Progress Fill */}
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getStatusColor()} transition-all duration-200 ease-out`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        {/* Status Indicators */}
        <div className="flex justify-between text-[9px] text-gray-500 mt-1 px-0.5">
          <span>Start</span>
          <span className={`${displayProgress >= 50 ? 'text-emerald-400' : 'text-gray-500'}`}>
            {displayProgress >= 50 ? '⚡ Processing' : '⏳ Pending'}
          </span>
          <span>Complete</span>
        </div>
      </div>

      {/* Completed/Error Status Message */}
      {status === 'completed' && (
        <div className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1">
          <span>✅</span> Action completed successfully!
        </div>
      )}
      {status === 'error' && (
        <div className="mt-2 text-xs font-medium text-red-400 flex items-center gap-1">
          <span>❌</span> Action failed. Please try again.
        </div>
      )}
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;