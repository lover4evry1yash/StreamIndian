import React from 'react';
import { FocusItem } from '../../components/FocusItem';

interface TVButtonProps {
  id: string;
  groupId?: string;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TVButton: React.FC<TVButtonProps> = ({
  id,
  groupId,
  onClick,
  children,
  icon,
  variant = 'secondary',
  size = 'md',
  className = '',
}) => {
  const baseClasses = "flex items-center justify-center gap-3 rounded-tv-button font-bold transition-colors duration-200";
  
  const variants = {
    primary: "bg-white text-black",
    secondary: "bg-tv-surface-light text-white",
    ghost: "bg-transparent text-white",
    danger: "bg-tv-error text-white"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-tv-sm",
    md: "px-6 py-3 text-tv-body",
    lg: "px-8 py-4 text-tv-heading"
  };
  
  const focusedClasses = {
    primary: "ring-[4px] ring-white scale-[1.05] shadow-[0_0_24px_rgba(255,255,255,0.4)]",
    secondary: "ring-[4px] ring-white bg-tv-surface-lighter scale-[1.05] shadow-[0_0_24px_rgba(255,255,255,0.2)]",
    ghost: "ring-[4px] ring-white bg-tv-surface-light scale-[1.05]",
    danger: "ring-[4px] ring-white scale-[1.05] shadow-[0_0_24px_rgba(225,29,72,0.4)]"
  };

  return (
    <FocusItem
      id={id}
      groupId={groupId}
      onClick={onClick}
      className={(isFocused) => `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      focusedClassName={focusedClasses[variant]}
      unfocusedClassName="scale-100 opacity-90"
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </FocusItem>
  );
};
