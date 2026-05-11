/**
 * Context and manager interface types for the Cogni Dashboard Assistant.
 * These types describe the shape of the React context value and the
 * conversation-management abstraction used throughout the assistant.
 */

import type { Message, Conversation, ExportFormat } from './assistant.types';

// ─── Panel Width & Density ────────────────────────────────────────────────────

/** Named width presets for the assistant panel. */
export type AssistantPanelWidth = 'compact' | 'default' | 'wide';

/** Vertical spacing density for message bubbles. */
export type MessageDensity = 'compact' | 'comfortable' | 'spacious';

// ─── Feature Availability ─────────────────────────────────────────────────────

/**
 * Flags that indicate which optional browser features are available at runtime.
 * Components use these to gracefully degrade when a capability is absent.
 */
export interface AssistantPanelFeatures {
  /** Web Speech API is available and microphone permission has been granted. */
  voiceInput: boolean;
  /** Clipboard API is available for copy-to-clipboard actions. */
  clipboard: boolean;
  /** localStorage is available for conversation persistence. */
  persistence: boolean;
}

// ─── Conversation Manager ─────────────────────────────────────────────────────

/**
 * Manages the lifecycle of conversations: creation, retrieval, mutation,
 * search, and export. Implementations are responsible for persisting state
 * via the StorageService.
 */
export interface IConversationManager {
  /** All loaded conversations, keyed by conversation ID. */
  readonly conversations: Map<string, Conversation>;

  /** The ID of the conversation currently displayed in the panel, or null. */
  readonly currentConversationId: string | null;

  /**
   * Create a new conversation for the given route key.
   * If a conversation for that route already exists it is returned as-is.
   */
  createConversation(routeKey: string): Conversation;

  /**
   * Retrieve the conversation for a route key, or null when none exists.
   */
  getConversation(routeKey: string): Conversation | null;

  /**
   * Append a message to the specified conversation and persist the change.
   */
  addMessage(conversationId: string, message: Message): void;

  /**
   * Remove all messages from the conversation except the initial greeting,
   * then persist the change.
   */
  clearConversation(conversationId: string): void;

  /**
   * Search across all loaded conversations and return messages whose content
   * matches the query string (case-insensitive).
   */
  searchMessages(query: string): Message[];

  /**
   * Serialise the conversation into a downloadable Blob in the requested format.
   */
  exportConversation(conversationId: string, format: ExportFormat): Blob;
}
