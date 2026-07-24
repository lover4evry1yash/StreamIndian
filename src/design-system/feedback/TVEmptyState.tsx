import React from 'react';

interface TVEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const TVEmptyState: React.FC<TVEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px] gap-6 ${className}`}>
      {icon && (
        <div className="text-tv-text-disabled w-24 h-24 mb-4">
          {icon}
        </div>
      )}
      <h2 className="text-tv-title font-bold text-white">
        {title}
      </h2>
      {description && (
        <p className="text-tv-body text-tv-text-secondary max-w-xl">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
};
