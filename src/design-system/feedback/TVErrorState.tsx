import React from 'react';

interface TVErrorStateProps {
  icon?: React.ReactNode;
  title?: string;
  error: Error | string;
  action?: React.ReactNode;
  className?: string;
}

export const TVErrorState: React.FC<TVErrorStateProps> = ({
  icon,
  title = 'Something went wrong',
  error,
  action,
  className = ''
}) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px] gap-6 ${className}`}>
      {icon && (
        <div className="text-tv-error w-24 h-24 mb-4">
          {icon}
        </div>
      )}
      <h2 className="text-tv-title font-bold text-white">
        {title}
      </h2>
      <p className="text-tv-body text-tv-error max-w-2xl bg-tv-error/10 p-6 rounded-xl border border-tv-error/20 font-mono text-sm">
        {errorMessage}
      </p>
      {action && (
        <div className="mt-8">
          {action}
        </div>
      )}
    </div>
  );
};
