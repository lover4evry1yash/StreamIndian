import React from 'react';

interface TVLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const TVLoading: React.FC<TVLoadingProps> = ({
  size = 'md',
  label,
  className = ''
}) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div 
        className={`${sizes[size]} rounded-full border-tv-surface-light border-t-tv-primary animate-spin`}
      />
      {label && (
        <span className="text-tv-body text-tv-text-secondary font-medium animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
};
