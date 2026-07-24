import React from 'react';
import { FocusItem } from '../../components/FocusItem';

interface TVSidebarProps {
  id: string; // The group ID for the sidebar focus items
  isExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const TVSidebar: React.FC<TVSidebarProps> = ({
  id,
  isExpanded = false,
  children,
  className = '',
}) => {
  return (
    <nav
      id={id}
      className={`fixed top-0 left-0 bottom-0 z-40 bg-tv-surface-light border-r border-white/5 transition-all duration-300 flex flex-col pt-8 pb-8 ${
        isExpanded ? 'w-[18rem]' : 'w-[5.5rem]'
      } ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full gap-2 px-3 w-full">
        {children}
      </div>
    </nav>
  );
};

interface TVSidebarItemProps {
  id: string;
  groupId: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isExpanded?: boolean;
  onClick: () => void;
}

export const TVSidebarItem: React.FC<TVSidebarItemProps> = ({ 
  id, 
  groupId, 
  icon, 
  label, 
  isActive, 
  isExpanded, 
  onClick 
}) => {
  return (
    <FocusItem
      id={id}
      groupId={groupId}
      onClick={onClick}
      className={(isFocused) => `flex items-center gap-4 p-4 rounded-[1rem] transition-all duration-300 w-full overflow-hidden ${
        isActive && !isFocused ? 'bg-white/10 text-white' : 'text-tv-text-secondary'
      }`}
      focusedClassName="bg-white text-black scale-[1.05] ring-[4px] ring-white shadow-tv-focus z-20"
      unfocusedClassName="scale-100 opacity-90"
    >
      {(isFocused) => (
        <>
          <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 transition-colors ${isFocused ? 'text-black' : (isActive ? 'text-white' : 'text-tv-text-secondary')}`}>
            {icon}
          </div>
          <span 
            className={`font-bold whitespace-nowrap transition-all duration-300 ${
              isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            } ${isFocused ? 'text-black' : (isActive ? 'text-white' : 'text-tv-text-secondary')}`}
          >
            {label}
          </span>
        </>
      )}
    </FocusItem>
  );
};
