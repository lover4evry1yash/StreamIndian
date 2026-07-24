import React, { useEffect, useRef } from 'react';
import { FocusItem } from '../../components/FocusItem';

interface TVDialogProps {
  id: string; // The focus group ID for the dialog
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const TVDialog: React.FC<TVDialogProps> = ({
  id,
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-tv-safe-v">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-tv-fade" 
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div 
        ref={containerRef}
        className={`relative z-10 w-full max-w-4xl max-h-full bg-tv-surface rounded-[1.5rem] shadow-tv-card overflow-hidden flex flex-col animate-tv-fade ${className}`}
      >
        {title && (
          <div className="px-10 py-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-tv-title font-bold text-white">{title}</h2>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-10 tv-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
