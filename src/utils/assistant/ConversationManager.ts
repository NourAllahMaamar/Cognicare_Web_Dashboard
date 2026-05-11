/**
 * ConversationManager — manages the lifecycle of conversations for the
 * Cogni Dashboard Assistant.
 *
 * Handles creation, retrieval, mutation, search, and export of conversations.
 * Persists state via the injected StorageService.
 */

import type { Message, Conversation, ExportFormat } from '../../types/assistant.types';
import type { IConversationManager } from '../../types/assistant-context.types';
import type { IStorageService } from '../../types/assistant-services.types';

// ─── UUID helper ──────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── ConversationManager ──────────────────────────────────────────────────────

export class ConversationManager implements IConversationManager {
  /** In-memory cache of all loaded conversations, keyed by conversation ID. */
  readonly conversations: Map<string, Conversation> = new Map();

  /** The ID of the conversation currently displayed in the panel, or null. */
  currentConversationId: string | null = null;

  constructor(
    private readonly storageService: IStorageService,
    private readonly role: string,
  ) {}

  // ── createConversation ─────────────────────────────────────────────────────

  /**
   * Create a new conversation for the given route key.
   * If a conversation for that route already exists in the in-memory map,
   * it is returned as-is without creating a duplicate.
   */
  createConversation(routeKey: string): Conversation {
    // Check if a conversation for this routeKey already exists in the map
    for (const conversation of this.conversations.values()) {
      if (conversation.routeKey === routeKey) {
        return conversation;
      }
    }

    // Create a new conversation
    const now = new Date();
    const conversation: Conversation = {
      id: generateId(),
      routeKey,
      messages: [],
      createdAt: now,
      updatedAt: now,
      metadata: {
        messageCount: 0,
        lastMessageAt: now,
        role: this.role,
      },
    };

    // Save to in-memory map
    this.conversations.set(conversation.id, conversation);

    // Persist to storage
    this.storageService.saveConversation(routeKey, conversation);

    return conversation;
  }

  // ── getConversation ────────────────────────────────────────────────────────

  /**
   * Retrieve the conversation for a route key.
   * Checks the in-memory map first; falls back to storage if not found.
   * Returns null when no conversation exists for the given route.
   */
  getConversation(routeKey: string): Conversation | null {
    // Check in-memory map first
    for (const conversation of this.conversations.values()) {
      if (conversation.routeKey === routeKey) {
        return conversation;
      }
    }

    // Try loading from storage
    const loaded = this.storageService.loadConversation(routeKey);
    if (loaded !== null) {
      this.conversations.set(loaded.id, loaded);
      return loaded;
    }

    return null;
  }

  // ── addMessage ─────────────────────────────────────────────────────────────

  /**
   * Append a message to the specified conversation and persist the change.
   * Does nothing if the conversation ID is not found.
   */
  addMessage(conversationId: string, message: Message): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation.messages.push(message);

    const now = new Date();
    conversation.updatedAt = now;
    conversation.metadata.messageCount = conversation.messages.length;
    conversation.metadata.lastMessageAt = now;

    this.storageService.saveConversation(conversation.routeKey, conversation);
  }

  // ── clearConversation ──────────────────────────────────────────────────────

  /**
   * Remove all messages from the conversation except the initial greeting
   * (index 0), then persist the change.
   * Does nothing if the conversation ID is not found.
   */
  clearConversation(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    // Keep only the first message (initial greeting)
    conversation.messages = conversation.messages.slice(0, 1);

    const now = new Date();
    conversation.updatedAt = now;
    conversation.metadata.messageCount = conversation.messages.length;
    conversation.metadata.lastMessageAt = now;

    this.storageService.saveConversation(conversation.routeKey, conversation);
  }

  // ── searchMessages ─────────────────────────────────────────────────────────

  /**
   * Search across all loaded conversations and return messages whose content
   * matches the query string (case-insensitive).
   * Returns an empty array when the query is empty.
   */
  searchMessages(query: string): Message[] {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();
    const results: Message[] = [];

    for (const conversation of this.conversations.values()) {
      for (const message of conversation.messages) {
        if (message.content.toLowerCase().includes(lowerQuery)) {
          results.push(message);
        }
      }
    }

    return results;
  }

  // ── exportConversation ─────────────────────────────────────────────────────

  /**
   * Serialise the conversation into a downloadable Blob in the requested format.
   * Returns an empty Blob when the conversation ID is not found.
   */
  exportConversation(conversationId: string, format: ExportFormat): Blob {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return new Blob([], { type: 'text/plain' });
    }

    switch (format) {
      case 'text':
        return this._exportAsText(conversation);
      case 'json':
        return this._exportAsJSON(conversation);
      case 'markdown':
        return this._exportAsMarkdown(conversation);
      default:
        return this._exportAsText(conversation);
    }
  }

  // ── Private export helpers ─────────────────────────────────────────────────

  private _exportAsText(conversation: Conversation): Blob {
    const lines: string[] = [
      `Conversation: ${conversation.routeKey}`,
      `Exported: ${new Date().toLocaleString()}`,
      `Messages: ${conversation.messages.length}`,
      '',
      '─'.repeat(60),
      '',
    ];

    for (const message of conversation.messages) {
      const role = message.role === 'user' ? 'You' : 'Cogni';
      const timestamp = message.timestamp instanceof Date
        ? message.timestamp.toLocaleString()
        : new Date(message.timestamp).toLocaleString();
      lines.push(`[${timestamp}] ${role}:`);
      lines.push(message.content);
      lines.push('');
    }

    return new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  }

  private _exportAsJSON(conversation: Conversation): Blob {
    const content = JSON.stringify(conversation, null, 2);
    return new Blob([content], { type: 'application/json;charset=utf-8' });
  }

  private _exportAsMarkdown(conversation: Conversation): Blob {
    const lines: string[] = [
      `# Conversation: ${conversation.routeKey}`,
      '',
      `**Exported:** ${new Date().toLocaleString()}  `,
      `**Messages:** ${conversation.messages.length}  `,
      `**Role:** ${conversation.metadata.role}`,
      '',
      '---',
      '',
    ];

    for (const message of conversation.messages) {
      const role = message.role === 'user' ? '👤 You' : '🤖 Cogni';
      const timestamp = message.timestamp instanceof Date
        ? message.timestamp.toLocaleString()
        : new Date(message.timestamp).toLocaleString();

      lines.push(`### ${role}`);
      lines.push(`*${timestamp}*`);
      lines.push('');
      lines.push(message.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  }
}

// ─── Factory function ─────────────────────────────────────────────────────────

/**
 * Factory function for creating a ConversationManager instance.
 * Prefer this over direct instantiation for easier testing and dependency injection.
 */
export function createConversationManager(
  storageService: IStorageService,
  role: string,
): ConversationManager {
  return new ConversationManager(storageService, role);
}
