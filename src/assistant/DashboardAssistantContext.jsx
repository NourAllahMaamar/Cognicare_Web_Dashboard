import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardAssistantContext } from './dashboardAssistantContextValue';

export function DashboardAssistantProvider({ children }) {
  const location = useLocation();
  const [uiContext, setUiContextState] = useState({});

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

  const value = useMemo(() => ({
    uiContext,
    setUiContext,
  }), [uiContext, setUiContext]);

  return (
    <DashboardAssistantContext.Provider value={value}>
      {children}
    </DashboardAssistantContext.Provider>
  );
}
