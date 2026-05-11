import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardAssistantContext } from './dashboardAssistantContextValue';
import {
  MIN_ASSISTANT_PANEL_WIDTH,
  DEFAULT_ASSISTANT_PANEL_WIDTH,
  MAX_ASSISTANT_PANEL_WIDTH,
} from './constants';
import { storageService } from '../services/assistant/StorageService';
import { PANEL_WIDTH_PRESETS } from '../constants/assistant.constants';

function clampAssistantWidth(width) {
  if (typeof width !== 'number' || Number.isNaN(width)) {
    return DEFAULT_ASSISTANT_PANEL_WIDTH;
  }
  return Math.min(
    MAX_ASSISTANT_PANEL_WIDTH,
    Math.max(MIN_ASSISTANT_PANEL_WIDTH, width),
  );
}

/**
 * Resolve a numeric pixel width to a named preset, or null if it doesn't
 * match any preset exactly.
 * @param {number} width
 * @returns {'compact' | 'default' | 'wide' | null}
 */
function widthToPreset(width) {
  for (const [name, px] of Object.entries(PANEL_WIDTH_PRESETS)) {
    if (px === width) return /** @type {'compact'|'default'|'wide'} */ (name);
  }
  return null;
}

export function DashboardAssistantProvider({ children }) {
  const location = useLocation();
  const [uiContext, setUiContextState] = useState({});
  const [assistantOpen, setAssistantOpenState] = useState(false);
  const [assistantPanelWidth, setAssistantPanelWidthState] = useState(
    DEFAULT_ASSISTANT_PANEL_WIDTH,
  );

  // ── New state ────────────────────────────────────────────────────────────

  const [preferences, setPreferences] = useState(() => {
    try {
      return storageService.loadPreferences();
    } catch {
      return {
        panelWidth: 'default',
        messageDensity: 'comfortable',
        autoRefreshOnNavigation: true,
        showSuggestedQuestions: true,
        soundEffects: false,
        animations: true,
        onboardingCompleted: false,
        tooltipsShown: [],
      };
    }
  });

  const [currentConversationId, setCurrentConversationIdState] = useState(null);

  // ── Existing effects ─────────────────────────────────────────────────────

  useEffect(() => {
    setUiContextState({});
  }, [location.pathname]);

  // ── Sync panel width preset into preferences ─────────────────────────────

  useEffect(() => {
    const preset = widthToPreset(assistantPanelWidth);
    if (preset !== null) {
      setPreferences((prev) => {
        if (prev.panelWidth === preset) return prev;
        const next = { ...prev, panelWidth: preset };
        try {
          storageService.savePreferences(next);
        } catch {
          // Non-critical — ignore storage errors.
        }
        return next;
      });
    }
  }, [assistantPanelWidth]);

  // ── Existing callbacks ───────────────────────────────────────────────────

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

  // ── New callbacks ────────────────────────────────────────────────────────

  /**
   * Update a single preference key and persist to storage.
   * @param {string} key
   * @param {unknown} value
   */
  const updatePreference = useCallback((key, value) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      try {
        storageService.savePreferences(next);
      } catch {
        // Non-critical — ignore storage errors.
      }
      return next;
    });
  }, []);

  /**
   * Set the currently active conversation ID.
   * @param {string | null} id
   */
  const setCurrentConversationId = useCallback((id) => {
    setCurrentConversationIdState(id);
  }, []);

  // ── Context value ────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    // Existing (unchanged)
    uiContext,
    setUiContext,
    assistantOpen,
    setAssistantOpen,
    assistantPanelWidth,
    setAssistantPanelWidth,
    // New
    preferences,
    updatePreference,
    currentConversationId,
    setCurrentConversationId,
  }), [
    uiContext,
    setUiContext,
    assistantOpen,
    setAssistantOpen,
    assistantPanelWidth,
    setAssistantPanelWidth,
    preferences,
    updatePreference,
    currentConversationId,
    setCurrentConversationId,
  ]);

  return (
    <DashboardAssistantContext.Provider value={value}>
      {children}
    </DashboardAssistantContext.Provider>
  );
}
