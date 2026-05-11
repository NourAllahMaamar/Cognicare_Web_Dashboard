/**
 * Assistant constants for the Cogni Dashboard Assistant.
 *
 * NOTE: MIN_ASSISTANT_PANEL_WIDTH and MAX_ASSISTANT_PANEL_WIDTH are defined in
 * `src/assistant/constants.js` and re-exported here to avoid duplication.
 */

export {
  MIN_ASSISTANT_PANEL_WIDTH,
  MAX_ASSISTANT_PANEL_WIDTH,
} from '../assistant/constants.js';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  /** Prefix for per-route conversation history: append the routeKey. */
  CONVERSATION_PREFIX: 'cogni_conversation_',
  PREFERENCES: 'cogni_preferences',
  ONBOARDING: 'cogni_onboarding',
  SESSION_ID: 'cogni_session_id',
} as const;

// ---------------------------------------------------------------------------
// Panel width presets (px)
// ---------------------------------------------------------------------------

export const PANEL_WIDTH_PRESETS = {
  compact: 320,
  default: 380,
  wide: 520,
} as const;

// ---------------------------------------------------------------------------
// Animation durations (ms)
// ---------------------------------------------------------------------------

export const ANIMATION_DURATIONS = {
  panelEnter: 300,
  panelExit: 200,
  messageEnter: 250,
  reactionBounce: 400,
  copySuccess: 1500,
  typingDot: 1400,
} as const;

// ---------------------------------------------------------------------------
// Emoji reactions
// ---------------------------------------------------------------------------

export const REACTION_EMOJIS = ['👍', '👎', '❤️', '🤔', '😮', '😕'] as const;

// ---------------------------------------------------------------------------
// Export formats
// ---------------------------------------------------------------------------

export const EXPORT_FORMATS = ['text', 'json', 'markdown'] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

// ---------------------------------------------------------------------------
// Analytics event types
// ---------------------------------------------------------------------------

export const ANALYTICS_EVENTS = {
  ASSISTANT_OPEN: 'assistant_open',
  MESSAGE_SENT: 'message_sent',
  QUICK_PROMPT_CLICK: 'quick_prompt_click',
  FEEDBACK_GIVEN: 'feedback_given',
  REACTION_ADDED: 'reaction_added',
  VOICE_INPUT: 'voice_input',
  ERROR_OCCURRED: 'error_occurred',
  CONVERSATION_EXPORTED: 'conversation_exported',
  SETTINGS_CHANGED: 'settings_changed',
} as const;

export type AnalyticsEventType =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ---------------------------------------------------------------------------
// Performance / capacity limits
// ---------------------------------------------------------------------------

/** Show a performance warning when a conversation exceeds this many messages. */
export const MAX_MESSAGES_BEFORE_WARNING = 100;

/** Enable virtual scrolling once a conversation reaches this many messages. */
export const MAX_MESSAGES_VIRTUAL_SCROLL = 50;

/** Maximum number of quick-prompt buttons shown at once. */
export const MAX_QUICK_PROMPTS = 4;

/** Maximum number of suggested follow-up questions shown after a reply. */
export const MAX_SUGGESTED_QUESTIONS = 3;

/** Maximum number of context chips shown in the header. */
export const MAX_CONTEXT_CHIPS = 3;

// ---------------------------------------------------------------------------
// Analytics batching
// ---------------------------------------------------------------------------

/** Number of events to accumulate before flushing to the backend. */
export const ANALYTICS_BATCH_SIZE = 10;

/** Interval (ms) at which buffered analytics events are flushed. */
export const ANALYTICS_FLUSH_INTERVAL_MS = 5_000;

// ---------------------------------------------------------------------------
// Search / debounce
// ---------------------------------------------------------------------------

/** Debounce delay (ms) for the conversation search input. */
export const SEARCH_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Conversation retention
// ---------------------------------------------------------------------------

/** Maximum age (ms) of a stored conversation before it is eligible for cleanup. */
export const CONVERSATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000; // 7 days
