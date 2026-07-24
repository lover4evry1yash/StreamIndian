import React from 'react';

interface TVProgressBarProps {
  progress: number; // 0 to 1
  height?: string;
  className?: string;
  color?: string;
  trackColor?: string;
}

export const TVProgressBar: React.FC<TVProgressBarProps> = ({
  progress,
  height = 'h-1.5',
  className = '',
  color = 'bg-tv-primary',
  trackColor = 'bg-white/20',
}) => {
  const safeProgress = Math.max(0, Math.min(1, progress));
  
  return (
    <div className={`w-full overflow-hidden rounded-full ${trackColor} ${height} ${className}`}>
      <div 
        className={`h-full transition-all duration-300 ease-out rounded-full ${color}`}
        style={{ width: `${safeProgress * 100}%` }}
      />
    </div>
  );
};
