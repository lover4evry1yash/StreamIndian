/**
 * StreamIndian - Spatial Focus & Directional D-Pad Navigation Engine
 * Provides remote-friendly focus management (Up, Down, Left, Right, Enter, Return)
 * with TV highlight rings and automatic scrolling.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigationManager, useEventBus } from '../context/ServiceContext';
import { NavigationManager } from '../core/navigation';

interface SpatialFocusContextType {
  focusedId: string;
  setFocusedId: (id: string) => void;
  registerFocusable: (id: string, element: HTMLElement, groupId: string, onSelected?: () => void) => void;
  unregisterFocusable: (id: string) => void;
  registerGroup: (groupName: string, trapFocus?: boolean) => void;
}

const SpatialFocusContext = createContext<SpatialFocusContextType | null>(null);

export function useSpatialFocus() {
  const ctx = useContext(SpatialFocusContext);
  if (!ctx) {
    throw new Error('useSpatialFocus must be used within SpatialFocusProvider');
  }
  return ctx;
}

interface SpatialFocusProviderProps {
  children: ReactNode;
  onBackKey?: () => void;
}

export const SpatialFocusProvider: React.FC<SpatialFocusProviderProps> = ({ children, onBackKey }) => {
  const [focusedId, setFocusedId] = useState<string>('');
  
  // Connect to the core FocusEngine
  const navManager = useNavigationManager();
  const eventBus = useEventBus();

  useEffect(() => {
    if (onBackKey) {
      navManager.setCustomBackHandler(() => {
        onBackKey();
        return true; // Indicate it was handled
      });
    } else {
      navManager.setCustomBackHandler(() => false);
    }
  }, [onBackKey, navManager]);

  useEffect(() => {
    const handleFocusChanged = (newFocusedId: string) => {
      setFocusedId(newFocusedId);
    };
    
    eventBus.on('FOCUS_CHANGED', handleFocusChanged);
    return () => {
      eventBus.off('FOCUS_CHANGED', handleFocusChanged);
    };
  }, []);

  const registerFocusable = (id: string, element: HTMLElement, groupId: string = 'main', onSelected?: () => void) => {
    navManager.focusEngine.registerNode({
      id,
      groupId,
      getElement: () => element,
      onSelected
    });
  };

  const unregisterFocusable = (id: string) => {
    navManager.focusEngine.unregisterNode(id);
  };

  const registerGroup = (groupName: string, trapFocus: boolean = false) => {
    navManager.focusEngine.registerGroup(groupName, trapFocus);
  };

  return (
    <SpatialFocusContext.Provider
      value={{
        focusedId,
        setFocusedId: (id) => navManager.focusEngine.setFocusedNode(id),
        registerFocusable,
        unregisterFocusable,
        registerGroup,
      }}
    >
      {children}
    </SpatialFocusContext.Provider>
  );
};
