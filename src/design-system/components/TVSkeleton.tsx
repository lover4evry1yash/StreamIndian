import React from 'react';

interface TVSkeletonProps {
  className?: string;
  variant?: 'poster' | 'backdrop' | 'text' | 'circular';
}

export const TVSkeleton: React.FC<TVSkeletonProps> = ({ 
  className = '',
  variant = 'poster'
}) => {
  const variants = {
    poster: 'aspect-[2/3] rounded-[0.75rem]',
    backdrop: 'aspect-[16/9] rounded-[0.75rem]',
    text: 'h-6 rounded-[0.25rem] w-full',
    circular: 'rounded-full aspect-square'
  };

  return (
    <div 
      className={`bg-tv-surface-light animate-pulse ${variants[variant]} ${className}`} 
    />
  );
};
