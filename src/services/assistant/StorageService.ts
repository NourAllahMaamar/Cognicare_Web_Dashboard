/**
 * StorageService — localStorage management for the Cogni Dashboard Assistant.
 *
 * Handles persistence of conversations and user preferences with quota
 * management, date revival, and storage usage tracking.
 */

import type { Conversation, UserPreferences, StorageUsage } from '../../types/assistant.types';
import type { IStorageService } from '../../types/assistant-services.types';
import {
  STORAGE_KEYS,
  CONVERSATION_MAX_AGE_MS,
} from '../../constants/assistant.constants';

// ─── Default Preferences ─────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  panelWidth: 'default',
  messageDensity: 'comfortable',
  autoRefreshOnNavigation: true,
  showSuggestedQuestions: true,
  soundEffects: false,
  animations: true,
  onboardingCompleted: false,
  tooltipsShown: [],
};

// ─── Total localStorage capacity assumed (bytes) ─────────────────────────────

const TOTAL_STORAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Date field revival ───────────────────────────────────────────────────────

/**
 * Revive ISO date strings back to Date objects after JSON.parse.
 * Handles: conversation.createdAt, conversation.updatedAt,
 *          conversation.metadata.lastMessageAt, and each message.timestamp.
 */
function reviveConversationDates(conversation: Conversation): Conversation {
  return {
    ...conversation,
    createdAt: new Date(conversation.createdAt),
    updatedAt: new Date(conversation.updatedAt),
    messages: conversation.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    })),
    metadata: {
      ...conversation.metadata,
      lastMessageAt: new Date(conversation.metadata.lastMessageAt),
    },
  };
}

// ─── StorageService ───────────────────────────────────────────────────────────

export class StorageService implements IStorageService {
  // ── Static availability check ──────────────────────────────────────────────

  /**
   * Test whether localStorage is available and writable in the current
   * browser context (private mode, security restrictions, etc.).
   */
  static isAvailable(): boolean {
    try {
      const testKey = '__cogni_storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // ── Conversation persistence ───────────────────────────────────────────────

  /**
   * Persist a conversation keyed by route.
   * On quota errors, clears old conversations and retries once.
   */
  saveConversation(routeKey: string, conversation: Conversation): void {
    const key = `${STORAGE_KEYS.CONVERSATION_PREFIX}${routeKey}`;
    const serialized = JSON.stringify(conversation);

    try {
      localStorage.setItem(key, serialized);
    } catch (error) {
      // Likely a QuotaExceededError — free space and retry once.
      if (this.isQuotaError(error)) {
        this.clearOldConversations(CONVERSATION_MAX_AGE_MS);
        try {
          localStorage.setItem(key, serialized);
        } catch {
          // Retry also failed — silently give up to avoid crashing the UI.
        }
      }
    }
  }

  /**
   * Load a persisted conversation for the given route.
   * Returns null on any error (missing key, corrupt JSON, etc.).
   * Date fields are revived from ISO strings back to Date objects.
   */
  loadConversation(routeKey: string): Conversation | null {
    const key = `${STORAGE_KEYS.CONVERSATION_PREFIX}${routeKey}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;

      const parsed = JSON.parse(raw) as Conversation;
      return reviveConversationDates(parsed);
    } catch {
      return null;
    }
  }

  // ── Preferences persistence ────────────────────────────────────────────────

  /** Persist user preferences. */
  savePreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch {
      // Silently ignore — preferences are non-critical.
    }
  }

  /**
   * Load persisted preferences.
   * Returns DEFAULT_PREFERENCES when the key is absent or the value is corrupt.
   */
  loadPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (raw === null) return { ...DEFAULT_PREFERENCES };

      const parsed = JSON.parse(raw) as UserPreferences;
      // Merge with defaults so any newly added preference keys are present.
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  /**
   * Remove conversations whose `updatedAt` is older than `maxAge` ms.
   * Defaults to CONVERSATION_MAX_AGE_MS (7 days) when not specified.
   */
  clearOldConversations(maxAge: number = CONVERSATION_MAX_AGE_MS): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(STORAGE_KEYS.CONVERSATION_PREFIX)) continue;

        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;

          const parsed = JSON.parse(raw) as Partial<Conversation>;
          const updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;

          if (now - updatedAt > maxAge) {
            keysToRemove.push(key);
          }
        } catch {
          // Corrupt entry — remove it too.
          keysToRemove.push(key!);
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // localStorage iteration failed — nothing to do.
    }
  }

  // ── Storage usage ──────────────────────────────────────────────────────────

  /**
   * Sum the byte lengths of all `cogni_*` keys and return usage statistics.
   * Assumes UTF-16 encoding (2 bytes per character) as used by most browsers.
   */
  getStorageUsage(): StorageUsage {
    let used = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith('cogni_')) continue;

        const value = localStorage.getItem(key) ?? '';
        // Each JS character is 2 bytes in UTF-16.
        used += (key.length + value.length) * 2;
      }
    } catch {
      // If iteration fails, report 0 used.
    }

    const available = TOTAL_STORAGE_BYTES - used;
    const percentage = Math.min(100, (used / TOTAL_STORAGE_BYTES) * 100);

    return { used, available, percentage };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private isQuotaError(error: unknown): boolean {
    if (!(error instanceof DOMException)) return false;
    // Standard name across modern browsers.
    return (
      error.name === 'QuotaExceededError' ||
      // Legacy Firefox / older browsers.
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22
    );
  }
}

// ─── Singleton instance ───────────────────────────────────────────────────────

export const storageService = new StorageService();
