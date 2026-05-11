/**
 * Service interface contracts for the Cogni Dashboard Assistant.
 * These interfaces define the public API of each service class without
 * coupling consumers to concrete implementations.
 */

import type {
  Conversation,
  ChatRequest,
  ChatResponse,
  ExportFormat,
  UserPreferences,
  StorageUsage,
  AnalyticsEvent,
} from './assistant.types';

// ─── Chat Service ─────────────────────────────────────────────────────────────

export interface IChatService {
  /**
   * Send a user message to the backend and receive an assistant reply.
   */
  sendMessage(params: ChatRequest): Promise<ChatResponse>;

  /**
   * Trigger a context refresh (no user message, mode = 'refresh').
   */
  refreshContext(
    params: Omit<ChatRequest, 'message' | 'mode'>,
  ): Promise<ChatResponse>;
}

// ─── Voice Input Service ──────────────────────────────────────────────────────

export interface IVoiceInputService {
  /** Returns true when the browser supports the Web Speech API. */
  isSupported(): boolean;

  /** Requests microphone permission. Resolves to true when granted. */
  requestPermission(): Promise<boolean>;

  /**
   * Starts recording audio for the given locale.
   * Rejects if permission is denied or the API is unavailable.
   */
  startRecording(locale: string): Promise<void>;

  /**
   * Stops recording and returns the transcribed text.
   * Rejects if transcription fails.
   */
  stopRecording(): Promise<string>;

  /** Register a callback that fires whenever a transcript is available. */
  onTranscript(callback: (text: string) => void): void;

  /** Register a callback that fires when a recording/transcription error occurs. */
  onError(callback: (error: Error) => void): void;
}

// ─── Storage Service ──────────────────────────────────────────────────────────

export interface IStorageService {
  /** Persist a conversation keyed by route. */
  saveConversation(routeKey: string, conversation: Conversation): void;

  /** Load a persisted conversation for the given route, or null if absent. */
  loadConversation(routeKey: string): Conversation | null;

  /** Persist user preferences. */
  savePreferences(preferences: UserPreferences): void;

  /** Load persisted preferences, returning defaults when absent. */
  loadPreferences(): UserPreferences;

  /**
   * Remove conversations older than `maxAge` milliseconds to free storage.
   */
  clearOldConversations(maxAge: number): void;

  /** Return current localStorage usage statistics. */
  getStorageUsage(): StorageUsage;
}

// ─── Export Service ───────────────────────────────────────────────────────────

export interface IExportService {
  /** Export a conversation as a plain-text Blob. */
  exportAsText(conversation: Conversation): Blob;

  /** Export a conversation as a JSON Blob. */
  exportAsJSON(conversation: Conversation): Blob;

  /** Export a conversation as a Markdown Blob. */
  exportAsMarkdown(conversation: Conversation): Blob;

  /**
   * Convenience method: export in the requested format.
   */
  export(conversation: Conversation, format: ExportFormat): Blob;

  /**
   * Generate a shareable URL for the given conversation ID.
   * The URL should open the conversation in read-only mode.
   */
  generateShareableLink(conversationId: string): string;
}

// ─── Analytics Service ────────────────────────────────────────────────────────

export interface IAnalyticsService {
  /** Track the assistant panel being opened. */
  trackAssistantOpen(role: string, route: string): void;

  /** Track a message being sent by the user. */
  trackMessageSent(messageLength: number, type: 'text' | 'voice'): void;

  /** Track a quick-prompt button click. */
  trackQuickPromptClick(prompt: string): void;

  /** Track positive or negative feedback on a message. */
  trackFeedback(messageId: string, type: 'positive' | 'negative'): void;

  /** Track an emoji reaction being added to a message. */
  trackReaction(messageId: string, emoji: string): void;

  /** Track a voice-input attempt and whether it succeeded. */
  trackVoiceInput(success: boolean): void;

  /** Track an error with its type and surrounding context. */
  trackError(errorType: string, context: Record<string, unknown>): void;

  /** Track a conversation export. */
  trackExport(format: ExportFormat): void;

  /**
   * Flush any batched events immediately.
   * Useful before the page unloads.
   */
  flush(): Promise<void>;

  /**
   * Low-level method to queue a raw analytics event.
   * Prefer the typed helpers above for normal usage.
   */
  track(event: AnalyticsEvent): void;
}
