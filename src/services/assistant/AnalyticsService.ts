/**
 * AnalyticsService — event tracking for the Cogni Dashboard Assistant.
 *
 * Events are queued locally and flushed either when the batch size threshold
 * is reached or after a debounced idle interval. No sensitive user data is
 * included in any event payload.
 */

import type { AnalyticsEvent, ExportFormat } from '../../types/assistant.types';
import type { IAnalyticsService } from '../../types/assistant-services.types';
import {
  ANALYTICS_EVENTS,
  ANALYTICS_BATCH_SIZE,
  ANALYTICS_FLUSH_INTERVAL_MS,
} from '../../constants/assistant.constants';

export class AnalyticsService implements IAnalyticsService {
  /** Stable identifier for the current browser session. */
  private readonly sessionId: string;

  /** Pending events waiting to be flushed. */
  private eventQueue: AnalyticsEvent[] = [];

  /** Handle for the debounced flush timer. */
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  // ─── IAnalyticsService ────────────────────────────────────────────────────

  trackAssistantOpen(role: string, route: string): void {
    this.track({
      eventType: ANALYTICS_EVENTS.ASSISTANT_OPEN,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: { role, route },
    });
  }

  trackMessageSent(messageLength: number, type: 'text' | 'voice'): void {
    this.track({
      eventType: ANALYTICS_EVENTS.MESSAGE_SENT,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: { messageLength, type },
    });
  }

  trackQuickPromptClick(prompt: string): void {
    this.track({
      eventType: ANALYTICS_EVENTS.QUICK_PROMPT_CLICK,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: { prompt },
    });
  }

  trackFeedback(messageId: string, type: 'positive' | 'negative'): void {
    this.track({
      eventType: ANALYTICS_EVENTS.FEEDBACK_GIVEN,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: { messageId, type },
    });
  }

  trackReaction(messageId: string, emoji: string): void {
    this.track({
      eventType: ANALYTICS_EVENTS.REACTION_ADDED,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: { messageId, emoji },
    });
  }

  trackVoiceInput(success: boolean): void {
    this.track({
      eventType: ANALYTICS_EVENTS.VOICE_INPUT,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: { success },
    });
  }

  trackError(errorType: string, context: Record<string, unknown>): void {
    this.track({
      eventType: ANALYTICS_EVENTS.ERROR_OCCURRED,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: { errorType, ...context },
    });
  }

  trackExport(format: ExportFormat): void {
    this.track({
      eventType: ANALYTICS_EVENTS.CONVERSATION_EXPORTED,
      timestamp: new Date(),
      sessionId: this.sessionId,
      properties: { format },
    });
  }

  /**
   * Queue a raw analytics event.
   * Triggers an immediate flush when the batch size threshold is reached;
   * otherwise schedules a debounced flush.
   */
  track(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= ANALYTICS_BATCH_SIZE) {
      this.flush();
    } else {
      this.scheduleDebouncedFlush();
    }
  }

  /**
   * Flush all queued events immediately.
   * Safe to call when the queue is empty — returns without doing anything.
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    // Snapshot and clear the queue before any async work so that events
    // arriving during the flush are not lost.
    const events = [...this.eventQueue];
    this.eventQueue = [];
    this.cancelFlushTimer();

    // No real backend endpoint yet — log to console.
    console.log('[Analytics]', events);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  private scheduleDebouncedFlush(): void {
    this.cancelFlushTimer();
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, ANALYTICS_FLUSH_INTERVAL_MS);
  }

  private cancelFlushTimer(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

/** Singleton instance for use throughout the application. */
export const analyticsService = new AnalyticsService();
