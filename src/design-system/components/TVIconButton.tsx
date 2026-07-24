import React from 'react';
import { FocusItem } from '../../components/FocusItem';

interface TVIconButtonProps {
  id: string;
  groupId?: string;
  onClick: () => void;
  icon: React.ReactNode;
  label?: string; // Optional label shown below or to the side, or screen reader only
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const TVIconButton: React.FC<TVIconButtonProps> = ({
  id,
  groupId,
  onClick,
  icon,
  label,
  variant = 'secondary',
  size = 'md',
  className = '',
}) => {
  const baseClasses = "flex flex-col items-center justify-center gap-2 rounded-full font-bold transition-all duration-200";
  
  const variants = {
    primary: "bg-white text-black",
    secondary: "bg-tv-surface-light text-white",
    ghost: "bg-transparent text-white",
    danger: "bg-tv-error text-white"
  };
  
  const sizes = {
    sm: "w-10 h-10 p-2",
    md: "w-12 h-12 p-3",
    lg: "w-16 h-16 p-4",
    xl: "w-20 h-20 p-5"
  };
  
  const focusedClasses = {
    primary: "ring-[4px] ring-white scale-[1.1] shadow-[0_0_24px_rgba(255,255,255,0.4)]",
    secondary: "ring-[4px] ring-white bg-tv-surface-lighter scale-[1.1] shadow-[0_0_24px_rgba(255,255,255,0.2)]",
    ghost: "ring-[4px] ring-white bg-tv-surface-light scale-[1.1]",
    danger: "ring-[4px] ring-white scale-[1.1] shadow-[0_0_24px_rgba(225,29,72,0.4)]"
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <FocusItem
        id={id}
        groupId={groupId}
        onClick={onClick}
        className={(isFocused) => `${baseClasses} ${variants[variant]} ${sizes[size]}`}
        focusedClassName={focusedClasses[variant]}
        unfocusedClassName="scale-100 opacity-90 hover:opacity-100"
      >
        {icon}
      </FocusItem>
      {label && (
        <span className="text-tv-xs text-tv-text-secondary font-medium tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};
