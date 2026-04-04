import { useContext } from 'react';
import { DashboardAssistantContext } from './dashboardAssistantContextValue';

export function useDashboardAssistantContext() {
  const value = useContext(DashboardAssistantContext);
  if (!value) {
    throw new Error('useDashboardAssistantContext must be used within DashboardAssistantProvider');
  }
  return value;
}
