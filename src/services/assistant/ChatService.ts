/**
 * ChatService — handles communication with the backend chatbot API.
 *
 * This is a plain class (not a hook). The `authFetch` dependency is injected
 * via the constructor so the service can be used outside of React components
 * and is easily testable.
 */

import type { ChatRequest, ChatResponse } from '../../types/assistant.types';
import type { IChatService } from '../../types/assistant-services.types';

class ChatService implements IChatService {
  constructor(
    private authFetch: (url: string, options?: RequestInit) => Promise<Response>,
  ) {}

  /**
   * Send a message (or a context-refresh request) to the backend.
   *
   * POST /chatbot/chat
   * Body fields are taken directly from `ChatRequest`; undefined values are
   * omitted by JSON.stringify automatically.
   */
  async sendMessage(params: ChatRequest): Promise<ChatResponse> {
    const body: ChatRequest = {
      message: params.message,
      history: params.history,
      locale: params.locale,
      surface: params.surface,
      route: params.route,
      uiContext: params.uiContext,
      mode: params.mode,
      refreshReason: params.refreshReason,
    };

    let response: Response;

    try {
      response = await this.authFetch('/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      // Network-level failure (no response received)
      const message =
        err instanceof Error ? err.message : 'Network error: unable to reach the server';
      throw new Error(`ChatService network error: ${message}`);
    }

    if (!response.ok) {
      // HTTP error — try to extract a message from the response body
      let errorMessage: string;
      try {
        const data = await response.json();
        errorMessage = data?.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<ChatResponse>;
  }

  /**
   * Trigger a context refresh without a user message.
   * Delegates to `sendMessage` with `mode: 'refresh'`.
   */
  async refreshContext(
    params: Omit<ChatRequest, 'message' | 'mode'>,
  ): Promise<ChatResponse> {
    return this.sendMessage({
      ...params,
      mode: 'refresh',
    });
  }
}

/**
 * Factory function — preferred way to create a ChatService instance when
 * you already have an `authFetch` reference (e.g. from `useAuth`).
 *
 * @example
 * const { authFetch } = useAuth('specialist');
 * const chatService = createChatService(authFetch);
 */
function createChatService(
  authFetch: (url: string, options?: RequestInit) => Promise<Response>,
): ChatService {
  return new ChatService(authFetch);
}

export { ChatService, createChatService };
