/**
 * StreamIndian - Spatial Focus & Directional D-Pad Navigation Engine
 * Provides remote-friendly focus management (Up, Down, Left, Right, Enter, Return)
 * with TV highlight rings and automatic scrolling.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigationManager, useEventBus } from '../context/ServiceContext';

interface SpatialFocusContextType {
  focusedId: string;
  setFocusedId: (id: string) => void;
  registerFocusable: (id: string, element: HTMLElement, groupId: string, onSelected?: () => void) => void;
  unregisterFocusable: (id: string) => void;
  registerGroup: (groupName: string, trapFocus?: boolean) => void;
  setActiveGroup: (groupName: string) => void;
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

  const navManager = useNavigationManager();
  const eventBus = useEventBus();

  if (typeof window !== 'undefined') {
    (window as any).__FOCUS_ENGINE__ = navManager.focusEngine;
  }

  useEffect(() => {
    if (onBackKey) {
      navManager.setCustomBackHandler(() => {
        onBackKey();
        return true;
      });
    } else {
      navManager.setCustomBackHandler(() => false);
    }
  }, [onBackKey, navManager]);

  useEffect(() => {
    const handleFocusChanged = (newFocusedId: string) => {
      console.log(`[NAV_LOG] [SpatialFocusContainer] focusedId state changed to: '${newFocusedId}'`);
      setFocusedId(newFocusedId);
    };

    eventBus.on('FOCUS_CHANGED', handleFocusChanged);
    return () => {
      eventBus.off('FOCUS_CHANGED', handleFocusChanged);
    };
  }, [eventBus]);

  const registerFocusable = React.useCallback((id: string, element: HTMLElement, groupId: string = 'main', onSelected?: () => void) => {
    navManager.focusEngine.registerNode({
      id,
      groupId,
      getElement: () => element,
      onSelected
    });
  }, [navManager.focusEngine]);

  const unregisterFocusable = React.useCallback((id: string) => {
    navManager.focusEngine.unregisterNode(id);
  }, [navManager.focusEngine]);

  const registerGroup = React.useCallback((groupName: string, trapFocus: boolean = false) => {
    navManager.focusEngine.registerGroup(groupName, trapFocus);
  }, [navManager.focusEngine]);

  const setFocusedIdCallback = React.useCallback((id: string) => {
    navManager.focusEngine.setFocusedNode(id);
  }, [navManager.focusEngine]);

  const setActiveGroupCallback = React.useCallback((id: string) => {
    navManager.focusEngine.setActiveGroup(id);
  }, [navManager.focusEngine]);

  const contextValue = React.useMemo(() => ({
    focusedId,
    setFocusedId: setFocusedIdCallback,
    registerFocusable,
    unregisterFocusable,
    registerGroup,
    setActiveGroup: setActiveGroupCallback,
  }), [focusedId, setFocusedIdCallback, registerFocusable, unregisterFocusable, registerGroup, setActiveGroupCallback]);

  return (
    <SpatialFocusContext.Provider value={contextValue}>
      {children}
    </SpatialFocusContext.Provider>
  );
};
