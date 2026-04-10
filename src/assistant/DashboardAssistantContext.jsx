import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardAssistantContext } from './dashboardAssistantContextValue';
import {
  MIN_ASSISTANT_PANEL_WIDTH,
  DEFAULT_ASSISTANT_PANEL_WIDTH,
  MAX_ASSISTANT_PANEL_WIDTH,
} from './constants';

function clampAssistantWidth(width) {
  if (typeof width !== 'number' || Number.isNaN(width)) {
    return DEFAULT_ASSISTANT_PANEL_WIDTH;
  }
  return Math.min(
    MAX_ASSISTANT_PANEL_WIDTH,
    Math.max(MIN_ASSISTANT_PANEL_WIDTH, width),
  );
}

export function DashboardAssistantProvider({ children }) {
  const location = useLocation();
  const [uiContext, setUiContextState] = useState({});
  const [assistantOpen, setAssistantOpenState] = useState(false);
  const [assistantPanelWidth, setAssistantPanelWidthState] = useState(
    DEFAULT_ASSISTANT_PANEL_WIDTH,
  );

  useEffect(() => {
    setUiContextState({});
  }, [location.pathname]);

  const setUiContext = useCallback((nextValue) => {
    if (nextValue && typeof nextValue === 'object') {
      setUiContextState(nextValue);
      return;
    }
    setUiContextState({});
  }, []);

  const setAssistantOpen = useCallback((nextValue) => {
    setAssistantOpenState((current) => (
      typeof nextValue === 'function'
        ? Boolean(nextValue(current))
        : Boolean(nextValue)
    ));
  }, []);

  const setAssistantPanelWidth = useCallback((nextValue) => {
    setAssistantPanelWidthState((current) => {
      const resolvedWidth = typeof nextValue === 'function'
        ? nextValue(current)
        : nextValue;
      return clampAssistantWidth(resolvedWidth);
    });
  }, []);

  const value = useMemo(() => ({
    uiContext,
    setUiContext,
    assistantOpen,
    setAssistantOpen,
    assistantPanelWidth,
    setAssistantPanelWidth,
  }), [
    uiContext,
    setUiContext,
    assistantOpen,
    setAssistantOpen,
    assistantPanelWidth,
    setAssistantPanelWidth,
  ]);

  return (
    <DashboardAssistantContext.Provider value={value}>
      {children}
    </DashboardAssistantContext.Provider>
  );
}
