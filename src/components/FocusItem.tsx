/**
 * StreamIndian - TV Focusable Item Wrapper
 * Applies TV active highlight states, scale transforms, and spatial focus registration.
 */

import React, { useEffect, useRef } from 'react';
import { useSpatialFocus } from './SpatialFocusContainer';

interface FocusItemProps {
  id: string;
  groupId?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  autoFocus?: boolean;
}

export const FocusItem: React.FC<FocusItemProps> = ({
  id,
  groupId = 'main',
  children,
  className = '',
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

  return (
    <div
      ref={ref}
      id={id}
      onClick={() => {
        setFocusedId(id);
        if (onClick) onClick();
      }}
      className={`relative transition-all duration-200 outline-none cursor-pointer ${
        isFocused
          ? 'ring-2 ring-indigo-500 border-indigo-400 scale-105 z-20 shadow-[0_0_30px_rgba(79,70,229,0.5)] rounded-xl'
          : 'hover:scale-102 opacity-90 hover:opacity-100'
      } ${className}`}
    >
      {children}
    </div>
  );
};
