import React from 'react';
import { FocusItem } from '../../components/FocusItem';

interface TVCardProps {
  id: string;
  groupId?: string;
  onClick: () => void;
  children: React.ReactNode | ((isFocused: boolean) => React.ReactNode);
  className?: string | ((isFocused: boolean) => string);
}

export const TVCard: React.FC<TVCardProps> = ({
  id,
  groupId,
  onClick,
  children,
  className = '',
}) => {
  return (
    <FocusItem
      id={id}
      groupId={groupId}
      onClick={onClick}
      className={(isFocused: boolean) => `relative overflow-hidden rounded-[1rem] transition-all duration-300 ${
        isFocused ? 'ring-[4px] ring-white shadow-tv-focus bg-tv-surface-light z-20' : 'ring-0 ring-transparent bg-tv-surface'
      } ${typeof className === 'function' ? (className as Function)(isFocused) : className}`}
      focusedClassName="scale-[1.05]"
      unfocusedClassName="scale-100 opacity-90 hover:opacity-100"
    >
      {(isFocused: boolean) => (
        <div className="w-full h-full">
          {typeof children === 'function' ? (children as Function)(isFocused) : children}
        </div>
      )}
    </FocusItem>
  );
};
