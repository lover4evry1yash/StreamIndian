/**
 * StreamIndian - TV Focusable Item Wrapper
 */
import React, { useEffect, useRef } from 'react';
import { useSpatialFocus } from './SpatialFocusContainer';

interface FocusItemProps {
  id: string;
  groupId?: string;
  children: React.ReactNode | ((isFocused: boolean) => React.ReactNode);
  className?: string | ((isFocused: boolean) => string);
  focusedClassName?: string;
  unfocusedClassName?: string;
  onClick?: () => void;
  autoFocus?: boolean;
}

export const FocusItem: React.FC<FocusItemProps> = ({
  id,
  groupId = 'main',
  children,
  className = '',
  focusedClassName = 'ring-[3px] ring-white shadow-[0_0_24px_rgba(79,70,229,0.5)] scale-[1.05] z-20',
  unfocusedClassName = 'scale-100 opacity-90',
  onClick,
  autoFocus = false,
}) => {
  const { focusedId, setFocusedId, registerFocusable, unregisterFocusable } = useSpatialFocus();
  const ref = useRef<HTMLDivElement>(null);
  
  const isFocused = focusedId === id;

  useEffect(() => {
    if (ref.current) {
      registerFocusable(id, ref.current, groupId, onClick);
    }
    return () => {
      unregisterFocusable(id);
    };
  }, [id, groupId, registerFocusable, unregisterFocusable, onClick]);

  useEffect(() => {
    if (autoFocus && !focusedId) {
      setFocusedId(id);
    }
  }, [autoFocus, focusedId, id, setFocusedId]);

  const resolvedClassName = typeof className === 'function' ? (className as Function)(isFocused) : className;
  const resolvedChildren = typeof children === 'function' ? (children as Function)(isFocused) : children;

  return (
    <div
      ref={ref}
      id={id}
      onClick={() => {
        setFocusedId(id);
        if (onClick) onClick();
      }}
      className={`relative transition-all duration-200 ease-out outline-none cursor-pointer ${
        isFocused ? focusedClassName : unfocusedClassName
      } ${resolvedClassName}`}
    >
      {resolvedChildren}
    </div>
  );
};
