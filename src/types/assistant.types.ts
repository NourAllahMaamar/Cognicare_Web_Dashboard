/**
 * Core data model types for the Cogni Dashboard Assistant.
 */

// ─── Role ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'orgLeader' | 'specialist';

// ─── Reactions & Feedback ────────────────────────────────────────────────────

export interface Reaction {
  emoji: string;
  timestamp: Date;
}

export interface Feedback {
  type: 'positive' | 'negative';
  timestamp: Date;
}

// ─── Assistant Metadata ──────────────────────────────────────────────────────

export interface AssistantMeta {
  strategy: 'default' | 'cached' | 'lite_model' | 'smart_model';
  complexity: 'simple' | 'moderate' | 'complex';
  refreshed: boolean;
  cacheHit: boolean;
  /** ISO 8601 date string */
  generatedAt: string;
  reason?: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  meta?: AssistantMeta;
  reactions?: Reaction[];
  feedback?: Feedback;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface ConversationMetadata {
  messageCount: number;
  lastMessageAt: Date;
  role: string;
}

export interface Conversation {
  id: string;
  routeKey: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata: ConversationMetadata;
}

// ─── Dashboard Context ────────────────────────────────────────────────────────

export interface ContextMetric {
  key: string;
  value: string | number | boolean;
  label: string;
  priority: number;
}

export interface DashboardContext {
  route: string;
  role: string;
  uiContext: Record<string, unknown>;
  metrics: ContextMetric[];
}

// ─── User Preferences ────────────────────────────────────────────────────────

export interface UserPreferences {
  /** Preferred panel width preset */
  panelWidth: 'compact' | 'default' | 'wide';
  /** Message spacing density */
  messageDensity: 'compact' | 'comfortable' | 'spacious';
  /** Automatically refresh context when navigating to a new route */
  autoRefreshOnNavigation: boolean;
  /** Show suggested follow-up questions after assistant replies */
  showSuggestedQuestions: boolean;
  /** Play sound effects for events */
  soundEffects: boolean;
  /** Enable UI animations */
  animations: boolean;
  /** Whether the user has completed the onboarding flow */
  onboardingCompleted: boolean;
  /** Keys of tooltips the user has already dismissed */
  tooltipsShown: string[];
}

// ─── Export ───────────────────────────────────────────────────────────────────

export type ExportFormat = 'text' | 'json' | 'markdown';

// ─── Storage ──────────────────────────────────────────────────────────────────

export interface StorageUsage {
  /** Bytes used */
  used: number;
  /** Bytes available */
  available: number;
  /** Usage as a percentage (0–100) */
  percentage: number;
}

// ─── Chat API ─────────────────────────────────────────────────────────────────

/** Minimal message shape used in the chat history sent to the backend */
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatRequest {
  message?: string;
  locale?: string;
  surface?: string;
  route?: string;
  uiContext?: Record<string, unknown>;
  forceRefresh?: boolean;
  mode?: 'message' | 'refresh';
  refreshReason?: 'entry' | 'manual' | 'navigation';
  history?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  meta?: AssistantMeta;
  pendingAction?: unknown;
  suggestedQuestions?: string[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  eventType: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  properties: Record<string, unknown>;
}
