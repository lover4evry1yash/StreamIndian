import React from 'react';

interface TVBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'glass';
  className?: string;
}

export const TVBadge: React.FC<TVBadgeProps> = ({
  children,
  variant = 'secondary',
  className = '',
}) => {
  const variants = {
    primary: 'bg-tv-primary text-white',
    secondary: 'bg-tv-surface-light text-tv-text-secondary',
    outline: 'border-2 border-tv-surface-light text-tv-text-secondary',
    glass: 'bg-white/10 backdrop-blur-md text-white border border-white/10'
  };

  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 text-tv-xs font-bold rounded-tv-badge uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
